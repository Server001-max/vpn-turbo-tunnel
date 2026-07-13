# 🚀 VPN Turbo Tunnel

**Ultra-fast, censorship-resistant VPN tunnel system with Cloudflare integration**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen)](https://nodejs.org/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequest.com)
[![GitHub stars](https://img.shields.io/github/stars/yourusername/vpn-turbo-tunnel)](https://github.com/yourusername/vpn-turbo-tunnel/stargazers)
[![GitHub issues](https://img.shields.io/github/issues/yourusername/vpn-turbo-tunnel)](https://github.com/yourusername/vpn-turbo-tunnel/issues)

## 📋 Table of Contents
- [✨ Features](#-features)
- [🚀 Quick Start](#-quick-start)
- [🛠️ Installation](#️-installation)
- [⚙️ Configuration](#️-configuration)
- [📡 API Endpoints](#-api-endpoints)
- [🏗️ Architecture](#️-architecture)
- [🔧 Development](#-development)
- [📦 Deployment Options](#-deployment-options)
- [🌐 Usage Guide](#-usage-guide)
- [📊 Performance Optimization](#-performance-optimization)
- [🛡️ Security Features](#️-security-features)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)
- [⚠️ Disclaimer](#️-disclaimer)
- [📞 Support](#-support)

## ✨ Features

### Core Features
- ⚡ **Ultra-fast performance** - Optimized TCP settings with BBR congestion control
- 🛡️ **Censorship-resistant** - Reality protocol with advanced SNI spoofing
- 🔄 **Multi-protocol support** - VLESS, Trojan, VMess, WebSocket
- ☁️ **Cloudflare integration** - Workers and Tunnel support
- 🎯 **Clean IP routing** - Automatic optimal IP selection
- 📊 **Real-time monitoring** - Live dashboard with metrics
- 🔐 **Military-grade encryption** - ChaCha20-Poly1305, AES-128-GCM
- 🚀 **Zero-config deployment** - One-click setup

### Advanced Features
- 🔄 **Multi-hop routing** - Multiple proxy chains
- 🎭 **SNI Spoofing** - Advanced DPI bypass
- 🔑 **Reality Protocol** - Undetectable traffic
- 🧹 **Clean IP** - Optimal CDN routing
- 📈 **Auto-scaling** - Dynamic resource allocation
- 🔄 **Load balancing** - Multiple tunnel management
- 📊 **Analytics** - Detailed usage statistics

## 🚀 Quick Start

### Prerequisites
- Node.js >= 16.0.0
- Cloudflare account (free tier works)
- npm or yarn
- Git

### One-Line Install
```bash
git clone https://github.com/yourusername/vpn-turbo-tunnel.git && cd vpn-turbo-tunnel && npm install && npm start
```

### Docker Quick Start
```bash
docker pull yourusername/vpn-turbo-tunnel:latest
docker run -d -p 3000:3000 --name vpn-turbo yourusername/vpn-turbo-tunnel:latest
```

## 🛠️ Installation

### Method 1: Standard Installation
```bash
# 1. Clone the repository
git clone https://github.com/yourusername/vpn-turbo-tunnel.git
cd vpn-turbo-tunnel

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
nano .env  # Edit with your Cloudflare credentials

# 4. Start the server
npm start

# 5. Access the dashboard
# Open http://localhost:3000 in your browser
```

### Method 2: Production Installation
```bash
# 1. Install PM2 globally
npm install -g pm2

# 2. Clone and setup
git clone https://github.com/yourusername/vpn-turbo-tunnel.git
cd vpn-turbo-tunnel
npm install --production
cp .env.example .env
nano .env

# 3. Start with PM2
pm2 start src/web/server.js --name vpn-turbo
pm2 save
pm2 startup

# 4. Check status
pm2 status
pm2 logs vpn-turbo
```

### Method 3: Cloudflare Workers Only
```bash
# 1. Install Wrangler
npm install -g wrangler

# 2. Login to Cloudflare
wrangler login

# 3. Deploy worker
wrangler deploy src/workers/main-worker.js --name vpn-turbo-tunnel

# 4. Access your worker
# https://vpn-turbo-tunnel.workers.dev
```

## ⚙️ Configuration

### Environment Variables (.env)
```env
# Cloudflare Configuration
CLOUDFLARE_ACCOUNT_ID=your_account_id_here
CLOUDFLARE_API_TOKEN=your_api_token_here
CLOUDFLARE_ZONE_ID=your_zone_id_here
KV_NAMESPACE_ID=your_kv_namespace_id_here

# Server Configuration
PORT=3000
NODE_ENV=production
HOST=0.0.0.0

# Security Configuration
JWT_SECRET=your_jwt_secret_here
ENCRYPTION_KEY=your_encryption_key_here
SESSION_TIMEOUT=3600

# Performance Configuration
BUFFER_SIZE=65536
KEEP_ALIVE=60
CONCURRENT_CONNECTIONS=100
TCP_NODELAY=true
CONGESTION_CONTROL=bbr

# Feature Toggles
ENABLE_REALITY=true
ENABLE_SNI_SPOOFING=true
ENABLE_CLEAN_IP=true
ENABLE_MULTI_HOP=true
ENABLE_WEBSOCKET=true
ENABLE_TROJAN=true
ENABLE_VMESS=true

# Optimization Settings
OPTIMIZE_TCP=true
ENABLE_COMPRESSION=true
CACHE_SIZE=1024
REQUEST_TIMEOUT=30000

# Logging
LOG_LEVEL=info
LOG_FILE=/var/log/vpn-turbo.log
ENABLE_ACCESS_LOG=true
```

### Protocol Configuration (config/protocols.json)
```json
{
  "protocols": {
    "vless": {
      "enabled": true,
      "port": 443,
      "encryption": ["chacha20-poly1305", "aes-128-gcm"],
      "flow": ["xtls-rprx-vision"],
      "reality": {
        "enabled": true,
        "publicKey": "auto-generate",
        "shortId": "auto-generate"
      }
    },
    "trojan": {
      "enabled": true,
      "port": 443,
      "encryption": "aes-128-gcm"
    },
    "vmess": {
      "enabled": true,
      "port": 443,
      "encryption": ["auto", "chacha20-poly1305"],
      "alterId": 0
    },
    "websocket": {
      "enabled": true,
      "path": "/ws",
      "headers": {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
      }
    }
  },
  "optimization": {
    "tcpNoDelay": true,
    "keepAlive": 60,
    "bufferSize": 65536,
    "mtu": 1500,
    "congestionControl": "bbr"
  }
}
```

## 📡 API Endpoints

### Tunnel Management
```bash
# Create new tunnel
POST /api/tunnel/create
{
  "protocol": "vless",
  "encryption": "chacha20-poly1305",
  "sni": "cloudflare.com",
  "path": "/ws/random123",
  "host": "your-domain.com",
  "port": 443,
  "uuid": "auto-generate"
}

# Response
{
  "success": true,
  "tunnel": {
    "id": "tunnel_123",
    "status": "active",
    "config": {
      "protocol": "vless",
      "uuid": "generated-uuid",
      "address": "your-domain.com",
      "port": 443,
      "path": "/ws/random123"
    }
  },
  "config": {
    "url": "wss://your-domain.com:443/ws/random123",
    "uuid": "generated-uuid",
    "encryption": "chacha20-poly1305",
    "protocol": "vless"
  }
}

# Get tunnel status
GET /api/tunnel/:id/status

# Response
{
  "success": true,
  "metrics": {
    "id": "tunnel_123",
    "status": "active",
    "uptime": 3600,
    "connections": 25,
    "bandwidth": {
      "in": 1048576,
      "out": 2097152
    },
    "performance": {
      "latency": 45,
      "throughput": 1024
    }
  }
}

# Destroy tunnel
DELETE /api/tunnel/:id

# List all tunnels
GET /api/tunnels

# Get configuration template
GET /api/config/template
```

### Worker Management
```bash
# Deploy Cloudflare Worker
POST /api/worker/deploy
{
  "type": "main",
  "config": {
    "uuid": "your-uuid",
    "port": 443,
    "path": "/ws",
    "protocol": "vless",
    "sni": "cloudflare.com"
  }
}

# Response
{
  "success": true,
  "workerId": "worker_123",
  "endpoint": "https://worker_123.workers.dev",
  "url": "wss://worker_123.workers.dev/ws"
}

# Get all workers
GET /api/workers

# Delete worker
DELETE /api/worker/:id
```

### System Endpoints
```bash
# Health check
GET /health
{
  "status": "healthy",
  "timestamp": 1234567890,
  "version": "2.0.0",
  "uptime": 3600
}

# System metrics
GET /metrics
{
  "tunnels": 10,
  "workers": 3,
  "connections": 150,
  "bandwidth": "1.2 GB",
  "uptime": 86400
}
```

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Web Dashboard                           │
│                   (Port 3000 - Express)                    │
├─────────────────────────────────────────────────────────────┤
│                     API Layer                              │
│              (REST & WebSocket APIs)                       │
├─────────────────────────────────────────────────────────────┤
│                   Core Services                            │
│  ┌───────────────┐  ┌────────────────┐  ┌───────────────┐ │
│  │   Tunnel      │  │    Worker      │  │   Protocol    │ │
│  │   Manager     │  │   Deployer     │  │  Optimizer    │ │
│  └───────────────┘  └────────────────┘  └───────────────┘ │
├─────────────────────────────────────────────────────────────┤
│                   Cloudflare Integration                   │
│  ┌───────────────┐  ┌────────────────┐  ┌───────────────┐ │
│  │   Workers     │  │    Tunnel      │  │  Clean IP     │ │
│  │  Deployment   │  │  Management    │  │   Routing     │ │
│  └───────────────┘  └────────────────┘  └───────────────┘ │
├─────────────────────────────────────────────────────────────┤
│                   Network Layer                            │
│  ┌───────────────┐  ┌────────────────┐  ┌───────────────┐ │
│  │   Reality     │  │  SNI Spoofing  │  │   Multi-hop   │ │
│  │   Protocol    │  │                │  │   Routing     │ │
│  └───────────────┘  └────────────────┘  └───────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow
```
User Request → Web Dashboard → API Layer → Core Services
                                                   ↓
                                             Cloudflare Workers
                                                   ↓
                                             Tunnel Manager
                                                   ↓
                                          Protocol Optimizer
                                                   ↓
                                         Network Output (VPN)
```

## 🔧 Development

### Setup Development Environment
```bash
# Clone and install
git clone https://github.com/yourusername/vpn-turbo-tunnel.git
cd vpn-turbo-tunnel
npm install

# Development mode with auto-reload
npm run dev

# Run tests
npm test

# Lint code
npm run lint

# Format code
npm run format

# Build for production
npm run build
```

### Project Structure
```
src/
├── core/                    # Core business logic
│   ├── tunnel-manager.js   # Tunnel lifecycle management
│   ├── config-builder.js   # Configuration generation
│   ├── worker-deployer.js  # Cloudflare worker deployment
│   └── protocol-optimizer.js # Protocol optimization
├── workers/                 # Cloudflare worker scripts
│   ├── main-worker.js      # Main entry point
│   ├── ws-tunnel.js        # WebSocket tunnel
│   └── http-proxy.js       # HTTP proxy
├── scripts/                 # Utility scripts
│   ├── deploy.sh           # Deployment script
│   ├── setup-tunnel.sh     # Tunnel setup
│   └── test-connection.sh  # Connection testing
├── web/                     # Web dashboard
│   ├── public/             # Static files
│   │   ├── index.html      # Dashboard HTML
│   │   ├── style.css       # CSS styles
│   │   └── app.js          # Client-side JavaScript
│   └── server.js           # Express server
├── utils/                   # Utility functions
│   ├── crypto-helper.js    # Cryptography utilities
│   ├── network-utils.js    # Network helpers
│   └── logger.js           # Logging
└── config/                  # Configuration
    ├── default-config.json  # Default settings
    └── protocols.json       # Protocol configurations
```

### Testing
```bash
# Unit tests
npm run test:unit

# Integration tests
npm run test:integration

# End-to-end tests
npm run test:e2e

# Coverage report
npm run test:coverage
```

## 📦 Deployment Options

### Option 1: Self-Hosted VPS (Recommended)

#### Ubuntu/Debian Setup
```bash
# 1. Update system
sudo apt update && sudo apt upgrade -y

# 2. Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs git

# 3. Install PM2
sudo npm install -g pm2

# 4. Clone and setup
git clone https://github.com/yourusername/vpn-turbo-tunnel.git
cd vpn-turbo-tunnel
npm install --production
cp .env.example .env

# 5. Configure Cloudflare
nano .env
# Add your Cloudflare credentials

# 6. Start with PM2
pm2 start src/web/server.js --name vpn-turbo
pm2 save
pm2 startup

# 7. Configure Nginx reverse proxy
sudo apt install -y nginx
sudo nano /etc/nginx/sites-available/vpn-turbo
```

#### Nginx Configuration
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Option 2: Docker Deployment
```bash
# Build Docker image
docker build -t vpn-turbo-tunnel .

# Run container
docker run -d \
  --name vpn-turbo \
  -p 3000:3000 \
  -e CLOUDFLARE_ACCOUNT_ID=your_id \
  -e CLOUDFLARE_API_TOKEN=your_token \
  vpn-turbo-tunnel

# Docker Compose
docker-compose up -d
```

#### Docker Compose File
```yaml
version: '3.8'
services:
  vpn-turbo:
    image: vpn-turbo-tunnel:latest
    container_name: vpn-turbo
    restart: always
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
      - CLOUDFLARE_ACCOUNT_ID=${CLOUDFLARE_ACCOUNT_ID}
      - CLOUDFLARE_API_TOKEN=${CLOUDFLARE_API_TOKEN}
      - ENABLE_REALITY=true
      - ENABLE_SNI_SPOOFING=true
    volumes:
      - ./logs:/var/log
      - ./config:/app/config
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

### Option 3: Cloudflare Workers Only
```bash
# 1. Install Wrangler
npm install -g wrangler

# 2. Login
wrangler login

# 3. Deploy worker
wrangler deploy src/workers/main-worker.js \
  --name vpn-turbo-tunnel \
  --env production

# 4. Set environment variables
wrangler secret put UUID --env production
wrangler secret put ENCRYPTION_KEY --env production

# 5. Access worker
# https://vpn-turbo-tunnel.workers.dev
```

### Option 4: Hybrid Deployment
```bash
# Deploy core on VPS for performance
# Use Cloudflare Workers for edge caching
# Combine both for maximum speed

# 1. Deploy VPS instance
# 2. Deploy worker for CDN
# 3. Configure routing
# 4. Enable load balancing
```

## 🌐 Usage Guide

### Web Dashboard

1. **Access Dashboard**: Open `http://your-server:3000`
2. **Create Tunnel**: Select protocol, encryption, and settings
3. **Generate Config**: Click "Create Tunnel"
4. **Copy Configuration**: Copy the generated config
5. **Import to Client**: Use in your VPN client

### Command Line Interface

```bash
# Create tunnel via CLI
node scripts/create-tunnel.js \
  --protocol vless \
  --encryption chacha20-poly1305 \
  --sni cloudflare.com

# Generate config file
node scripts/generate-config.js \
  --output config.json \
  --format json

# Test connection
node scripts/test-connection.js \
  --tunnel-id tunnel_123

# Monitor performance
node scripts/monitor.js \
  --tunnel-id tunnel_123 \
  --interval 5
```

### Client Configuration

#### VLESS Configuration
```json
{
  "protocol": "vless",
  "uuid": "your-uuid",
  "host": "your-domain.com",
  "port": 443,
  "path": "/ws/random123",
  "encryption": "chacha20-poly1305",
  "sni": "cloudflare.com",
  "flow": "xtls-rprx-vision",
  "reality": {
    "enabled": true,
    "publicKey": "your-public-key",
    "shortId": "your-short-id"
  },
  "websocket": {
    "enabled": true,
    "path": "/ws/random123",
    "headers": {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    }
  }
}
```

#### Import into Clients
- **V2Ray/Sing-box**: Use JSON config above
- **Shadowsocks**: Convert with ss-local
- **Clash**: Use the Clash config generator
- **Nekoray**: Import URL from dashboard

### Performance Tuning

```bash
# 1. Optimize system limits
sudo sysctl -w net.core.rmem_max=134217728
sudo sysctl -w net.core.wmem_max=134217728
sudo sysctl -w net.ipv4.tcp_rmem="4096 87380 134217728"
sudo sysctl -w net.ipv4.tcp_wmem="4096 65536 134217728"
sudo sysctl -w net.core.default_qdisc=fq
sudo sysctl -w net.ipv4.tcp_congestion_control=bbr

# 2. Configure buffer sizes
echo "BUFFER_SIZE=131072" >> .env

# 3. Enable multi-hop for stability
echo "ENABLE_MULTI_HOP=true" >> .env

# 4. Use clean IP routing
echo "ENABLE_CLEAN_IP=true" >> .env
```

## 📊 Performance Optimization

### TCP Optimization
```javascript
// In src/core/tunnel-manager.js
const optimizationConfig = {
    tcpNoDelay: true,           // Disable Nagle's algorithm
    keepAlive: 60,              // Keep connections alive
    bufferSize: 131072,         // 128KB buffer
    congestionControl: 'bbr',   // BBR congestion control
    mtu: 1500,                  // Maximum transmission unit
    windowScaling: true,        // TCP window scaling
    timestamping: true          // TCP timestamping
};
```

### Cache Optimization
```javascript
// Cache configuration
const cacheConfig = {
    enabled: true,
    size: 1024,                 // 1MB cache
    ttl: 3600,                 // 1 hour TTL
    compression: true,          // Enable compression
    preload: ['/config', '/health']
};
```

### Load Balancing
```bash
# Multiple tunnel instances
# 1. Create multiple tunnels
# 2. Distribute traffic
# 3. Monitor performance
# 4. Auto-scale based on load

# Enable load balancing
ENABLE_LOAD_BALANCING=true
MIN_TUNNELS=2
MAX_TUNNELS=10
```

## 🛡️ Security Features

### Reality Protocol
```json
{
  "reality": {
    "enabled": true,
    "publicKey": "generated-public-key",
    "shortId": "8-char-hex",
    "serverName": "cloudflare.com",
    "dest": "cloudflare.com:443",
    "fingerprint": "chrome"
  }
}
```

### SNI Spoofing
```javascript
// Auto-generated SNI domains
const sniDomains = [
    'cloudflare.com',
    'azure.com',
    'microsoft.com',
    'apple.com',
    'google.com',
    'amazon.com',
    'github.com',
    'stackoverflow.com'
];

// Random selection with rotation
function getSniDomain() {
    return sniDomains[Math.floor(Math.random() * sniDomains.length)];
}
```

### Encryption
- **ChaCha20-Poly1305**: Fast, secure, optimized for mobile
- **AES-128-GCM**: Hardware accelerated, secure
- **Auto-selection**: Best encryption based on client

### Access Control
```bash
# IP whitelisting
ALLOWED_IPS="192.168.1.0/24,10.0.0.0/8"

# Rate limiting
RATE_LIMIT=true
MAX_REQUESTS=100
RATE_WINDOW=60

# Authentication
AUTH_TYPE=jwt
JWT_EXPIRY=3600
```

## 🤝 Contributing

We welcome contributions! Here's how you can help:

### Getting Started
```bash
# Fork the repository
# Clone your fork
git clone https://github.com/yourusername/vpn-turbo-tunnel.git
cd vpn-turbo-tunnel

# Create a feature branch
git checkout -b feature/amazing-feature

# Make your changes
# Commit and push
git commit -m 'Add amazing feature'
git push origin feature/amazing-feature

# Open a Pull Request
```

### Development Guidelines
- Follow ESLint rules
- Write unit tests
- Update documentation
- Keep code clean and modular
- Add comments for complex logic

### Reporting Issues
- Use GitHub Issues
- Provide reproduction steps
- Include system information
- Add relevant logs

### Feature Requests
- Create issue with `feature` label
- Describe use case
- Provide implementation ideas

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

```
MIT License

Copyright (c) 2024 VPN Turbo Tunnel

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## ⚠️ Disclaimer

**IMPORTANT**: This tool is provided for educational purposes only.

- 🛡️ Users are responsible for complying with local laws and regulations
- 🔒 Use at your own risk
- 👨‍💻 The developers are not responsible for any misuse
- 📚 This is a learning resource for network technology
- 🚫 Do not use for illegal activities

### Acceptable Use
- ✅ Educational purposes
- ✅ Research and development
- ✅ Network testing
- ✅ Personal privacy protection
- ❌ Illegal activities
- ❌ Malicious purposes
- ❌ Copyright infringement

### Compliance
- Check local laws before use
- Respect terms of service of all providers
- Use responsibly and ethically
- Maintain transparency about usage

## 📞 Support

### Community Support
- 💬 [GitHub Discussions](https://github.com/Server001/vpn-turbo-tunnel/discussions)
- 🐦 [Twitter/X](https://twitter.com/yourusername)
- 📧 [Email Support](mailto:support@example.com)

### Documentation
- 📚 [Full Documentation](https://docs.example.com)
- 📖 [API Reference](https://api.example.com)
- 🎥 [Video Tutorials](https://youtube.com/example)

### Troubleshooting
```bash
# Check logs
pm2 logs vpn-turbo

# Test connectivity
curl -I http://localhost:3000/health

# Verify configuration
node scripts/validate-config.js

# Debug mode
NODE_ENV=debug npm start
```

### Common Issues

#### Connection refused
```bash
# Check if server is running
pm2 status

# Check port availability
netstat -tulpn | grep 3000

# Check firewall
sudo ufw allow 3000
```

#### Cloudflare errors
```bash
# Verify credentials
wrangler whoami

# Test API
curl -X GET "https://api.cloudflare.com/client/v4/accounts" \
     -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN"
```

#### Performance issues
```bash
# Check system resources
htop

# Verify BBR is active
sysctl net.ipv4.tcp_congestion_control

# Check buffer settings
sysctl net.core.rmem_max
```

---

**Made By Cyebr-Rage**

**⭐ Star this repo if you find it useful!**
**🔧 Contributions welcome!**
**📣 Share with others!**

[Back to Top](#-vpn-turbo-tunnel)
