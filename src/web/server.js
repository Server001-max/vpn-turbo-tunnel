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

   
