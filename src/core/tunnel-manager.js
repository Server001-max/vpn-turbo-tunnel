const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class TunnelManager {
    constructor(config) {
        this.config = config || this.loadDefaultConfig();
        this.tunnels = new Map();
        this.activeConnections = 0;
        this.performanceMetrics = {
            latency: [],
            throughput: [],
            uptime: 0
        };
    }

    loadDefaultConfig() {
        return {
            protocols: ['vless', 'trojan', 'ws'],
            encryption: 'chacha20-poly1305',
            port: 443,
            sniSpoofing: true,
            cleanIP: true,
            multiHop: true,
            bufferSize: 65536,
            keepAlive: 60,
            obfuscation: 'reality'
        };
    }

    async createTunnel(options) {
        const tunnelId = crypto.randomBytes(16).toString('hex');
        const tunnelConfig = this.buildTunnelConfig(options);
        
        try {
            const result = await this.deployTunnel(tunnelId, tunnelConfig);
            this.tunnels.set(tunnelId, {
                id: tunnelId,
                config: tunnelConfig,
                status: 'active',
                createdAt: Date.now(),
                metrics: {
                    bytesIn: 0,
                    bytesOut: 0,
                    connections: 0
                }
            });
            
            this.activeConnections++;
            return result;
        } catch (error) {
            console.error(`Tunnel creation failed: ${error.message}`);
            throw error;
        }
    }

    buildTunnelConfig(options) {
        const baseConfig = {
            uuid: options.uuid || crypto.randomUUID(),
            address: options.address || '127.0.0.1',
            port: options.port || this.config.port,
            protocol: options.protocol || 'vless',
            encryption: options.encryption || this.config.encryption,
            sni: this.config.sniSpoofing ? this.generateSniSpoof() : undefined,
            flow: 'xtls-rprx-vision',
            network: 'ws',
            wsSettings: {
                path: this.generateWebSocketPath(),
                headers: this.generateWsHeaders()
            },
            reality: {
                enabled: true,
                publicKey: this.generateRealityKey(),
                shortId: crypto.randomBytes(8).toString('hex'),
                serverName: 'cloudflare.com'
            }
        };

        if (this.config.cleanIP) {
            baseConfig.host = this.getOptimalCleanIP();
        }

        return baseConfig;
    }

    generateSniSpoof() {
        const domains = [
            'cloudflare.com',
            'azure.com',
            'microsoft.com',
            'apple.com',
            'google.com',
            'amazon.com',
            'github.com',
            'stackoverflow.com'
        ];
        return domains[Math.floor(Math.random() * domains.length)];
    }

    generateWebSocketPath() {
        const prefixes = ['/ws', '/v2', '/proxy', '/tunnel', '/api'];
        const suffix = crypto.randomBytes(4).toString('hex');
        return `${prefixes[Math.floor(Math.random() * prefixes.length)]}/${suffix}`;
    }

    generateWsHeaders() {
        return {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'Upgrade',
            'Upgrade': 'websocket'
        };
    }

    generateRealityKey() {
        const keyPair = crypto.generateKeyPairSync('x25519', {
            publicKeyEncoding: { type: 'spki', format: 'der' },
            privateKeyEncoding: { type: 'pkcs8', format: 'der' }
        });
        return keyPair.publicKey.toString('base64');
    }

    getOptimalCleanIP() {
        const cleanIPs = [
            '104.21.0.1',
            '104.21.1.1',
            '104.21.2.1',
            '104.21.3.1',
            '104.21.4.1',
            '172.67.0.1',
            '172.67.1.1',
            '172.67.2.1'
        ];
        return cleanIPs[Math.floor(Math.random() * cleanIPs.length)];
    }

    async deployTunnel(tunnelId, config) {
        const deployScript = `
            set -e
            echo "Deploying tunnel ${tunnelId}"
            
            # Create tunnel configuration
            cat > /tmp/tunnel-${tunnelId}.json <<EOF
            {
                "uuid": "${config.uuid}",
                "address": "${config.address}",
                "port": ${config.port},
                "protocol": "${config.protocol}",
                "network": "${config.network}",
                "path": "${config.wsSettings.path}",
                "sni": "${config.sni || ''}",
                "reality": ${JSON.stringify(config.reality)}
            }
            EOF
            
            # Deploy with cloudflare
            cloudflared tunnel --url localhost:${config.port} --config /tmp/tunnel-${tunnelId}.json > /tmp/tunnel-${tunnelId}.log 2>&1 &
            
            echo "Tunnel ${tunnelId} deployed successfully"
        `;

        return new Promise((resolve, reject) => {
            exec(deployScript, (error, stdout, stderr) => {
                if (error) {
                    reject(new Error(`Deployment failed: ${stderr}`));
                } else {
                    resolve({
                        tunnelId,
                        config,
                        status: 'deployed',
                        endpoint: `wss://${config.host || 'localhost'}:${config.port}${config.wsSettings.path}`
                    });
                }
            });
        });
    }

    async optimizeConnection(tunnelId) {
        const tunnel = this.tunnels.get(tunnelId);
        if (!tunnel) throw new Error('Tunnel not found');

        const optimizationConfig = {
            tcpNoDelay: true,
            keepAlive: this.config.keepAlive,
            bufferSize: this.config.bufferSize,
            congestionControl: 'bbr',
            mtu: 1500
        };

        // Apply optimization
        const optimized = await this.applyOptimization(tunnelId, optimizationConfig);
        return optimized;
    }

    async applyOptimization(tunnelId, config) {
        const script = `
            # Optimize TCP settings
            echo "Optimizing tunnel ${tunnelId}"
            
            # Set TCP parameters
            sysctl -w net.core.rmem_max=134217728
            sysctl -w net.core.wmem_max=134217728
            sysctl -w net.ipv4.tcp_rmem="4096 87380 134217728"
            sysctl -w net.ipv4.tcp_wmem="4096 65536 134217728"
            sysctl -w net.core.default_qdisc=fq
            sysctl -w net.ipv4.tcp_congestion_control=bbr
            
            # Apply to tunnel connection
            if [ -f /proc/${tunnelId}/fd/* ]; then
                for fd in /proc/${tunnelId}/fd/*; do
                    if [ -L $fd ] && [ -e $fd ]; then
                        echo "Optimizing file descriptor: $fd"
                    fi
                done
            fi
        `;

        return new Promise((resolve, reject) => {
            exec(script, (error, stdout) => {
                if (error) {
                    reject(error);
                } else {
                    resolve({
                        tunnelId,
                        optimized: true,
                        configuration: config
                    });
                }
            });
        });
    }

    async getTunnelMetrics(tunnelId) {
        const tunnel = this.tunnels.get(tunnelId);
        if (!tunnel) throw new Error('Tunnel not found');

        return {
            id: tunnelId,
            status: tunnel.status,
            uptime: Date.now() - tunnel.createdAt,
            connections: tunnel.metrics.connections,
            bandwidth: {
                in: tunnel.metrics.bytesIn,
                out: tunnel.metrics.bytesOut
            },
            performance: {
                latency: this.performanceMetrics.latency.slice(-10),
                throughput: this.performanceMetrics.throughput.slice(-10)
            }
        };
    }

    async destroyTunnel(tunnelId) {
        const tunnel = this.tunnels.get(tunnelId);
        if (!tunnel) throw new Error('Tunnel not found');

        try {
            await this.terminateTunnel(tunnelId);
            this.tunnels.delete(tunnelId);
            this.activeConnections--;
            return { success: true, tunnelId };
        } catch (error) {
            throw new Error(`Failed to destroy tunnel: ${error.message}`);
        }
    }

    async terminateTunnel(tunnelId) {
        const script = `
            # Kill tunnel process
            pkill -f "tunnel-${tunnelId}" || true
            
            # Cleanup configuration files
            rm -f /tmp/tunnel-${tunnelId}.json
            rm -f /tmp/tunnel-${tunnelId}.log
            
            echo "Tunnel ${tunnelId} terminated"
        `;

        return new Promise((resolve, reject) => {
            exec(script, (error) => {
                if (error) {
                    reject(error);
                } else {
                    resolve({ tunnelId, terminated: true });
                }
            });
        });
    }
}

module.exports = TunnelManager;
