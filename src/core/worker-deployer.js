const { Worker } = require('worker_threads');
const path = require('path');
const fs = require('fs');
const axios = require('axios');

class WorkerDeployer {
    constructor() {
        this.workers = new Map();
        this.workerPaths = {
            main: path.join(__dirname, '../workers/main-worker.js'),
            wsTunnel: path.join(__dirname, '../workers/ws-tunnel.js'),
            httpProxy: path.join(__dirname, '../workers/http-proxy.js')
        };
        this.cloudflareApi = {
            baseUrl: 'https://api.cloudflare.com/client/v4',
            accountId: process.env.CLOUDFLARE_ACCOUNT_ID,
            apiToken: process.env.CLOUDFLARE_API_TOKEN
        };
    }

    async deployWorker(workerType, config = {}) {
        const workerId = this.generateWorkerId();
        const workerPath = this.workerPaths[workerType];
        
        if (!workerPath) {
            throw new Error(`Unknown worker type: ${workerType}`);
        }

        const workerCode = fs.readFileSync(workerPath, 'utf-8');
        const compiledCode = this.compileWorkerCode(workerCode, config);

        try {
            const response = await this.uploadToCloudflare(workerId, compiledCode, config);
            
            const worker = new Worker(workerPath, {
                workerData: {
                    workerId,
                    config,
                    cloudflareResponse: response.data
                }
            });

            this.workers.set(workerId, {
                id: workerId,
                type: workerType,
                worker,
                config,
                status: 'running',
                deployedAt: Date.now()
            });

            return {
                success: true,
                workerId,
                endpoint: `https://${workerId}.workers.dev`,
                url: `wss://${workerId}.workers.dev/${config.path || 'ws'}`
            };
        } catch (error) {
            console.error(`Worker deployment failed: ${error.message}`);
            throw error;
        }
    }

    compileWorkerCode(code, config) {
        // Replace configuration placeholders in worker code
        let compiled = code;
        const placeholders = {
            '{{UUID}}': config.uuid || this.generateUUID(),
            '{{PORT}}': config.port || 443,
            '{{PATH}}': config.path || '/ws',
            '{{PROTOCOL}}': config.protocol || 'vless',
            '{{SNI}}': config.sni || 'cloudflare.com',
            '{{ENCRYPTION}}': config.encryption || 'chacha20-poly1305'
        };

        Object.keys(placeholders).forEach(key => {
            compiled = compiled.replace(new RegExp(key, 'g'), placeholders[key]);
        });

        return compiled;
    }

    async uploadToCloudflare(workerId, code, config) {
        const url = `${this.cloudflareApi.baseUrl}/accounts/${this.cloudflareApi.accountId}/workers/scripts/${workerId}`;
        
        const headers = {
            'Authorization': `Bearer ${this.cloudflareApi.apiToken}`,
            'Content-Type': 'application/javascript'
        };

        const data = {
            script: code,
            bindings: [
                {
                    type: 'kv_namespace',
                    name: 'TUNNEL_CONFIG',
                    namespace_id: config.kvNamespaceId || process.env.KV_NAMESPACE_ID
                }
            ],
            module: true,
            compatibility_date: '2024-01-01'
        };

        try {
            const response = await axios.put(url, data, { headers });
            return response;
        } catch (error) {
            console.error('Cloudflare upload failed:', error.response?.data || error.message);
            throw error;
        }
    }

    async updateWorker(workerId, newConfig) {
        const workerInfo = this.workers.get(workerId);
        if (!workerInfo) throw new Error(`Worker ${workerId} not found`);

        const updatedConfig = { ...workerInfo.config, ...newConfig };
        const workerPath = this.workerPaths[workerInfo.type];
        const workerCode = fs.readFileSync(workerPath, 'utf-8');
        const compiledCode = this.compileWorkerCode(workerCode, updatedConfig);

        await this.uploadToCloudflare(workerId, compiledCode, updatedConfig);

        // Restart worker
        await this.restartWorker(workerId);

        workerInfo.config = updatedConfig;
        this.workers.set(workerId, workerInfo);

        return {
            success: true,
            workerId,
            config: updatedConfig
        };
    }

    async restartWorker(workerId) {
        const workerInfo = this.workers.get(workerId);
        if (!workerInfo) throw new Error(`Worker ${workerId} not found`);

        // Terminate existing worker
        await workerInfo.worker.terminate();

        // Create new worker
        const workerPath = this.workerPaths[workerInfo.type];
        const newWorker = new Worker(workerPath, {
            workerData: {
                workerId,
                config: workerInfo.config
            }
        });

        workerInfo.worker = newWorker;
        workerInfo.status = 'running';
        this.workers.set(workerId, workerInfo);

        return { success: true, workerId };
    }

    async getWorkerStatus(workerId) {
        const workerInfo = this.workers.get(workerId);
        if (!workerInfo) throw new Error(`Worker ${workerId} not found`);

        // Check worker health
        const isAlive = await this.checkWorkerHealth(workerId);
        
        return {
            ...workerInfo,
            isAlive,
            metrics: await this.getWorkerMetrics(workerId)
        };
    }

    async checkWorkerHealth(workerId) {
        try {
            const response = await axios.get(`https://${workerId}.workers.dev/health`, {
                timeout: 5000
            });
            return response.status === 200;
        } catch (error) {
            return false;
        }
    }

    async getWorkerMetrics(workerId) {
        // In real implementation, this would fetch from Cloudflare Analytics API
        return {
            requests: 0,
            bandwidth: 0,
            cpuTime: 0,
            memoryUsage: 0
        };
    }

    generateWorkerId() {
        return `worker_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    }

    generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    async deleteWorker(workerId) {
        const workerInfo = this.workers.get(workerId);
        if (!workerInfo) throw new Error(`Worker ${workerId} not found`);

        try {
            // Delete from Cloudflare
            const url = `${this.cloudflareApi.baseUrl}/accounts/${this.cloudflareApi.accountId}/workers/scripts/${workerId}`;
            await axios.delete(url, {
                headers: {
                    'Authorization': `Bearer ${this.cloudflareApi.apiToken}`
                }
            });

            // Terminate worker thread
            await workerInfo.worker.terminate();

            this.workers.delete(workerId);

            return { success: true, workerId };
        } catch (error) {
            console.error(`Failed to delete worker: ${error.message}`);
            throw error;
        }
    }

    async listWorkers() {
        const workersList = [];
        for (const [id, info] of this.workers.entries()) {
            workersList.push({
                id,
                type: info.type,
                status: info.status,
                deployedAt: info.deployedAt,
                config: info.config
            });
        }
        return workersList;
    }
}

module.exports = WorkerDeployer;const { Worker } = require('worker_threads');
const path = require('path');
const fs = require('fs');
const axios = require('axios');

class WorkerDeployer {
    constructor() {
        this.workers = new Map();
        this.workerPaths = {
            main: path.join(__dirname, '../workers/main-worker.js'),
            wsTunnel: path.join(__dirname, '../workers/ws-tunnel.js'),
            httpProxy: path.join(__dirname, '../workers/http-proxy.js')
        };
        this.cloudflareApi = {
            baseUrl: 'https://api.cloudflare.com/client/v4',
            accountId: process.env.CLOUDFLARE_ACCOUNT_ID,
            apiToken: process.env.CLOUDFLARE_API_TOKEN
        };
    }

    async deployWorker(workerType, config = {}) {
        const workerId = this.generateWorkerId();
        const workerPath = this.workerPaths[workerType];
        
        if (!workerPath) {
            throw new Error(`Unknown worker type: ${workerType}`);
        }

        const workerCode = fs.readFileSync(workerPath, 'utf-8');
        const compiledCode = this.compileWorkerCode(workerCode, config);

        try {
            const response = await this.uploadToCloudflare(workerId, compiledCode, config);
            
            const worker = new Worker(workerPath, {
                workerData: {
                    workerId,
                    config,
                    cloudflareResponse: response.data
                }
            });

            this.workers.set(workerId, {
                id: workerId,
                type: workerType,
                worker,
                config,
                status: 'running',
                deployedAt: Date.now()
            });

            return {
                success: true,
                workerId,
                endpoint: `https://${workerId}.workers.dev`,
                url: `wss://${workerId}.workers.dev/${config.path || 'ws'}`
            };
        } catch (error) {
            console.error(`Worker deployment failed: ${error.message}`);
            throw error;
        }
    }

    compileWorkerCode(code, config) {
        // Replace configuration placeholders in worker code
        let compiled = code;
        const placeholders = {
            '{{UUID}}': config.uuid || this.generateUUID(),
            '{{PORT}}': config.port || 443,
            '{{PATH}}': config.path || '/ws',
            '{{PROTOCOL}}': config.protocol || 'vless',
            '{{SNI}}': config.sni || 'cloudflare.com',
            '{{ENCRYPTION}}': config.encryption || 'chacha20-poly1305'
        };

        Object.keys(placeholders).forEach(key => {
            compiled = compiled.replace(new RegExp(key, 'g'), placeholders[key]);
        });

        return compiled;
    }

    async uploadToCloudflare(workerId, code, config) {
        const url = `${this.cloudflareApi.baseUrl}/accounts/${this.cloudflareApi.accountId}/workers/scripts/${workerId}`;
        
        const headers = {
            'Authorization': `Bearer ${this.cloudflareApi.apiToken}`,
            'Content-Type': 'application/javascript'
        };

        const data = {
            script: code,
            bindings: [
                {
                    type: 'kv_namespace',
                    name: 'TUNNEL_CONFIG',
                    namespace_id: config.kvNamespaceId || process.env.KV_NAMESPACE_ID
                }
            ],
            module: true,
            compatibility_date: '2024-01-01'
        };

        try {
            const response = await axios.put(url, data, { headers });
            return response;
        } catch (error) {
            console.error('Cloudflare upload failed:', error.response?.data || error.message);
            throw error;
        }
    }

    async updateWorker(workerId, newConfig) {
        const workerInfo = this.workers.get(workerId);
        if (!workerInfo) throw new Error(`Worker ${workerId} not found`);

        const updatedConfig = { ...workerInfo.config, ...newConfig };
        const workerPath = this.workerPaths[workerInfo.type];
        const workerCode = fs.readFileSync(workerPath, 'utf-8');
        const compiledCode = this.compileWorkerCode(workerCode, updatedConfig);

        await this.uploadToCloudflare(workerId, compiledCode, updatedConfig);

        // Restart worker
        await this.restartWorker(workerId);

        workerInfo.config = updatedConfig;
        this.workers.set(workerId, workerInfo);

        return {
            success: true,
            workerId,
            config: updatedConfig
        };
    }

    async restartWorker(workerId) {
        const workerInfo = this.workers.get(workerId);
        if (!workerInfo) throw new Error(`Worker ${workerId} not found`);

        // Terminate existing worker
        await workerInfo.worker.terminate();

        // Create new worker
        const workerPath = this.workerPaths[workerInfo.type];
        const newWorker = new Worker(workerPath, {
            workerData: {
                workerId,
                config: workerInfo.config
            }
        });

        workerInfo.worker = newWorker;
        workerInfo.status = 'running';
        this.workers.set(workerId, workerInfo);

        return { success: true, workerId };
    }

    async getWorkerStatus(workerId) {
        const workerInfo = this.workers.get(workerId);
        if (!workerInfo) throw new Error(`Worker ${workerId} not found`);

        // Check worker health
        const isAlive = await this.checkWorkerHealth(workerId);
        
        return {
            ...workerInfo,
            isAlive,
            metrics: await this.getWorkerMetrics(workerId)
        };
    }

    async checkWorkerHealth(workerId) {
        try {
            const response = await axios.get(`https://${workerId}.workers.dev/health`, {
                timeout: 5000
            });
            return response.status === 200;
        } catch (error) {
            return false;
        }
    }

    async getWorkerMetrics(workerId) {
        // In real implementation, this would fetch from Cloudflare Analytics API
        return {
            requests: 0,
            bandwidth: 0,
            cpuTime: 0,
            memoryUsage: 0
        };
    }

    generateWorkerId() {
        return `worker_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    }

    generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    async deleteWorker(workerId) {
        const workerInfo = this.workers.get(workerId);
        if (!workerInfo) throw new Error(`Worker ${workerId} not found`);

        try {
            // Delete from Cloudflare
            const url = `${this.cloudflareApi.baseUrl}/accounts/${this.cloudflareApi.accountId}/workers/scripts/${workerId}`;
            await axios.delete(url, {
                headers: {
                    'Authorization': `Bearer ${this.cloudflareApi.apiToken}`
                }
            });

            // Terminate worker thread
            await workerInfo.worker.terminate();

            this.workers.delete(workerId);

            return { success: true, workerId };
        } catch (error) {
            console.error(`Failed to delete worker: ${error.message}`);
            throw error;
        }
    }

    async listWorkers() {
        const workersList = [];
        for (const [id, info] of this.workers.entries()) {
            workersList.push({
                id,
                type: info.type,
                status: info.status,
                deployedAt: info.deployedAt,
                config: info.config
            });
        }
        return workersList;
    }
}

module.exports = WorkerDeployer;
