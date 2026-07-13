const express = require('express');
const cors = require('cors');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const WebSocket = require('ws');
const http = require('http');
const fs = require('fs');

const TunnelManager = require('../core/tunnel-manager');
const WorkerDeployer = require('../core/worker-deployer');

class WebServer {
    constructor() {
        this.app = express();
        this.server = http.createServer(this.app);
        this.wss = new WebSocket.Server({ server: this.server });
        this.tunnelManager = new TunnelManager();
        this.workerDeployer = new WorkerDeployer();
        this.port = process.env.PORT || 3000;
        this.config = {};
        
        this.setupMiddleware();
        this.setupRoutes();
        this.setupWebSocket();
        this.setupStaticFiles();
    }

    setupMiddleware() {
        this.app.use(cors());
        this.app.use(express.json());
        this.app.use(express.urlencoded({ extended: true }));
        this.app.use((req, res, next) => {
            console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
            next();
        });
    }

    setupRoutes() {
        // Health check
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'healthy',
                timestamp: Date.now(),
                version: '2.0.0'
            });
        });

        // Generate tunnel configuration
        this.app.post('/api/tunnel/create', async (req, res) => {
            try {
                const config = req.body;
                const tunnel = await this.tunnelManager.createTunnel(config);
                res.json({
                    success: true,
                    tunnel,
                    config: {
                        url: `wss://${config.host || 'localhost'}:${config.port || 443}${config.path || '/ws'}`,
                        uuid: config.uuid || uuidv4(),
                        encryption: config.encryption || 'chacha20-poly1305',
                        protocol: config.protocol || 'vless'
                    }
                });
            } catch (error) {
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });

        // Deploy worker
        this.app.post('/api/worker/deploy', async (req, res) => {
            try {
                const { type, config } = req.body;
                const result = await this.workerDeployer.deployWorker(type, config);
                res.json({
                    success: true,
                    ...result
                });
            } catch (error) {
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });

        // Get tunnel status
        this.app.get('/api/tunnel/:id/status', async (req, res) => {
            try {
                const metrics = await this.tunnelManager.getTunnelMetrics(req.params.id);
                res.json({
                    success: true,
                    metrics
                });
            } catch (error) {
                res.status(404).json({
                    success: false,
                    error: error.message
                });
            }
        });

        // Destroy tunnel
        this.app.delete('/api/tunnel/:id', async (req, res) => {
            try {
                const result = await this.tunnelManager.destroyTunnel(req.params.id);
                res.json({
                    success: true,
                    ...result
                });
            } catch (error) {
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });

        // List all tunnels
        this.app.get('/api/tunnels', (req, res) => {
            const tunnels = this.tunnelManager.tunnels;
            res.json({
                success: true,
                tunnels: Array.from(tunnels.entries()).map(([id, info]) => ({
                    id,
                    status: info.status,
                    createdAt: info.createdAt,
                    metrics: info.metrics
                }))
            });
        });

        // Get configuration template
        this.app.get('/api/config/template', (req, res) => {
            const config = {
                name: 'VPN-Turbo-Tunnel',
                type: 'vless',
                uuid: uuidv4(),
                host: 'example.com',
                port: 443,
                path: '/ws/' + Math.random().toString(36).substring(7),
                encryption: 'chacha20-poly1305',
                sni: 'cloudflare.com',
                flow: 'xtls-rprx-vision',
                reality: {
                    enabled: true,
                    publicKey: 'your-public-key',
                    shortId: 'your-short-id'
                },
                optimization: {
                    tcpNoDelay: true,
                    keepAlive: 60,
                    bufferSize: 65536
                }
            };
            res.json(config);
        });

        // Get all workers
        this.app.get('/api/workers', async (req, res) => {
            try {
                const workers = await this.workerDeployer.listWorkers();
                res.json({
                    success: true,
                    workers
                });
            } catch (error) {
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });

        // Delete worker
        this.app.delete('/api/worker/:id', async (req, res) => {
            try {
                const result = await this.workerDeployer.deleteWorker(req.params.id);
                res.json({
                    success: true,
                    ...result
                });
            } catch (error) {
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });
    }

    setupWebSocket() {
        this.wss.on('connection', (ws, req) => {
            const clientId = uuidv4();
            console.log(`WebSocket client connected: ${clientId}`);
            
            // Send initial config
            ws.send(JSON.stringify({
                type: 'connection',
                clientId,
                timestamp: Date.now()
            }));

            ws.on('message', async (message) => {
                try {
                    const data = JSON.parse(message.toString());
                    await this.handleWebSocketMessage(ws, data);
                } catch (error) {
                    ws.send(JSON.stringify({
                        type: 'error',
                        error: error.message
                    }));
                }
            });

            ws.on('close', () => {
                console.log(`WebSocket client disconnected: ${clientId}`);
            });

            ws.on('error', (error) => {
                console.error(`WebSocket error: ${error.message}`);
            });
        });
    }

    async handleWebSocketMessage(ws, data) {
        const { action, payload } = data;
        
        switch (action) {
            case 'create_tunnel':
                const tunnel = await this.tunnelManager.createTunnel(payload);
                ws.send(JSON.stringify({
                    type: 'tunnel_created',
                    tunnel
                }));
                break;
                
            case 'get_status':
                const status = await this.tunnelManager.getTunnelMetrics(payload.tunnelId);
                ws.send(JSON.stringify({
                    type: 'status',
                    status
                }));
                break;
                
            case 'optimize':
                const optimized = await this.tunnelManager.optimizeConnection(payload.tunnelId);
                ws.send(JSON.stringify({
                    type: 'optimized',
                    ...optimized
                }));
                break;
                
            case 'deploy_worker':
                const worker = await this.workerDeployer.deployWorker(payload.type, payload.config);
                ws.send(JSON.stringify({
                    type: 'worker_deployed',
                    ...worker
                }));
                break;
                
            default:
                ws.send(JSON.stringify({
                    type: 'unknown_action',
                    action
                }));
        }
    }

    setupStaticFiles() {
        this.app.use(express.static(path.join(__dirname, 'public')));
        
        // Serve index.html for all other routes
        this.app.get('*', (req, res) => {
            res.sendFile(path.join(__dirname, 'public', 'index.html'));
        });
    }

    start() {
        this.server.listen(this.port, () => {
            console.log(`🚀 VPN Turbo Tunnel Server`);
            console.log(`📡 Running on http://localhost:${this.port}`);
            console.log(`🔌 WebSocket: ws://localhost:${this.port}`);
            console.log(`📊 API: http://localhost:${this.port}/api`);
            console.log(`🔄 ${new Date().toISOString()}`);
        });

        // Graceful shutdown
        process.on('SIGTERM', () => {
            console.log('Shutting down gracefully...');
            this.server.close(() => {
                console.log('Server closed');
                process.exit(0);
            });
        });
    }
}

// Start server
const server = new WebServer();
server.start();

module.exports = WebServer;
