#!/bin/bash

# VPN Turbo Tunnel Deployment Script
# Cloudflare Worker and Tunnel Setup

set -e

echo "🚀 VPN Turbo Tunnel - Deployment Script"
echo "========================================"

# Check required tools
check_requirements() {
    echo "Checking requirements..."
    
    if ! command -v node &> /dev/null; then
        echo "Error: Node.js is required but not installed"
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        echo "Error: npm is required but not installed"
        exit 1
    fi
    
    if ! command -v cloudflared &> /dev/null; then
        echo "Installing cloudflared..."
        curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o cloudflared
        chmod +x cloudflared
        sudo mv cloudflared /usr/local/bin/
    fi
    
    echo "✅ Requirements satisfied"
}

# Setup environment
setup_environment() {
    echo "Setting up environment..."
    
    if [ ! -f .env ]; then
        cp .env.example .env
        echo "Please edit .env file with your Cloudflare credentials"
        exit 1
    fi
    
    # Load environment variables
    export $(cat .env | grep -v '#' | xargs)
    
    echo "✅ Environment configured"
}

# Install dependencies
install_dependencies() {
    echo "Installing dependencies..."
    npm install --production
    echo "✅ Dependencies installed"
}

# Deploy Cloudflare Worker
deploy_worker() {
    echo "Deploying Cloudflare Worker..."
    
    WORKER_NAME=${1:-"vpn-turbo-tunnel"}
    
    # Create worker configuration
    cat > wrangler.toml <<EOF
name = "$WORKER_NAME"
type = "javascript"
account_id = "$CLOUDFLARE_ACCOUNT_ID"
workers_dev = true
route = ""
zone_id = "$CLOUDFLARE_ZONE_ID"
compatibility_date = "2024-01-01"

[vars]
UUID = "$(uuidgen)"
PORT = "443"
PROTOCOL = "vless"
ENCRYPTION = "chacha20-poly1305"

[[kv_namespaces]]
binding = "TUNNEL_CONFIG"
id = "$KV_NAMESPACE_ID"
EOF

    # Deploy worker
    npx wrangler deploy src/workers/main-worker.js
    
    echo "✅ Worker deployed: https://$WORKER_NAME.workers.dev"
}

# Setup tunnel
setup_tunnel() {
    echo "Setting up Cloudflare Tunnel..."
    
    TUNNEL_NAME=${1:-"vpn-tunnel"}
    
    # Create tunnel
    cloudflared tunnel create $TUNNEL_NAME || true
    
    # Get tunnel ID
    TUNNEL_ID=$(cloudflared tunnel list | grep $TUNNEL_NAME | awk '{print $1}')
    
    # Create tunnel configuration
    cat > ~/.cloudflared/config.yml <<EOF
tunnel: $TUNNEL_ID
credentials-file: /root/.cloudflared/$TUNNEL_ID.json

ingress:
  - hostname: $TUNNEL_NAME.trycloudflare.com
    service: http://localhost:443
  - service: http_status:404
EOF

    # Start tunnel
    cloudflared tunnel --config ~/.cloudflared/config.yml run $TUNNEL_NAME &
    
    echo "✅ Tunnel running: $TUNNEL_NAME.trycloudflare.com"
}

# Generate configuration
generate_config() {
    echo "Generating VPN configuration..."
    
    cat > config/current-config.json <<EOF
{
  "protocol": "vless",
  "uuid": "$(uuidgen)",
  "address": "$(curl -s ifconfig.me)",
  "port": 443,
  "path": "/ws/$(openssl rand -hex 8)",
  "encryption": "chacha20-poly1305",
  "sni": "cloudflare.com",
  "reality": {
    "enabled": true,
    "publicKey": "$(openssl rand -base64 32)",
    "shortId": "$(openssl rand -hex 8)"
  },
  "websocket": {
    "enabled": true,
    "headers": {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    }
  },
  "optimization": {
    "tcpNoDelay": true,
    "keepAlive": 60,
    "bufferSize": 65536
  }
}
EOF

    echo "✅ Configuration generated: config/current-config.json"
}

# Main execution
main() {
    echo "Starting deployment..."
    
    check_requirements
    setup_environment
    install_dependencies
    
    deploy_worker "$1"
    setup_tunnel "$2"
    generate_config
    
    echo ""
    echo "🎉 Deployment complete!"
    echo ""
    echo "Worker URL: https://$1.workers.dev"
    echo "Tunnel URL: $2.trycloudflare.com"
    echo "Config file: config/current-config.json"
    echo ""
    echo "To get client config: curl https://$1.workers.dev/config"
}

# Run with arguments
main "$@"
