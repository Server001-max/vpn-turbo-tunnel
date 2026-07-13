// WebSocket Tunnel Worker for Cloudflare

const WEBSOCKET_PATH = '/ws';
const BUFFER_SIZE = 65536;
const PING_INTERVAL = 30000;

let activeConnections = 0;
let totalBytesTransferred = 0;

async function handleWebSocketRequest(request) {
    const url = new URL(request.url);
    
    // Only handle WebSocket upgrades
    if (request.headers.get('Upgrade') !== 'websocket') {
        return new Response('WebSocket upgrade required', { status: 400 });
    }
    
    try {
        const pair = new WebSocketPair();
        const [client, server] = Object.values(pair);
        
        server.accept();
        activeConnections++;
        
        // Set up connection handlers
        setupConnectionHandlers(server);
        
        // Return response with WebSocket
        return new Response(null, {
            status: 101,
            webSocket: client
        });
    } catch (error) {
        return new Response(`WebSocket error: ${error.message}`, { status: 500 });
    }
}

function setupConnectionHandlers(ws) {
    let pingInterval = setInterval(() => {
        if (ws.readyState === ws.OPEN) {
            ws.ping();
        }
    }, PING_INTERVAL);
    
    ws.addEventListener('message', (event) => {
        try {
            const data = parseMessage(event.data);
            handleTunnelMessage(ws, data);
        } catch (error) {
            ws.send(JSON.stringify({ error: error.message }));
        }
    });
    
    ws.addEventListener('close', () => {
        clearInterval(pingInterval);
        activeConnections--;
        console.log(`Connection closed. Active: ${activeConnections}`);
    });
    
    ws.addEventListener('error', (error) => {
        console.error('WebSocket error:', error);
        clearInterval(pingInterval);
        activeConnections--;
    });
}

function parseMessage(data) {
    try {
        return JSON.parse(data);
    } catch (e) {
        return {
            type: 'binary',
            data: data
        };
    }
}

async function handleTunnelMessage(ws, data) {
    const { type, payload } = data;
    
    switch(type) {
        case 'tunnel.create':
            await createTunnel(ws, payload);
            break;
        case 'tunnel.destroy':
            await destroyTunnel(ws, payload);
            break;
        case 'tunnel.ping':
            ws.send(JSON.stringify({ type: 'tunnel.pong', timestamp: Date.now() }));
            break;
        case 'data':
            totalBytesTransferred += payload.length || 0;
            ws.send(JSON.stringify({ type: 'ack', bytes: payload.length }));
            break;
        default:
            ws.send(JSON.stringify({ type: 'error', message: 'Unknown command' }));
    }
}

async function createTunnel(ws, config) {
    const tunnelId = generateTunnelId();
    const tunnelConfig = {
        id: tunnelId,
        status: 'created',
        config: {
            uuid: config.uuid || generateUUID(),
            port: config.port || 443,
            protocol: config.protocol || 'vless',
            path: config.path || '/ws',
            encryption: config.encryption || 'chacha20-poly1305',
            sni: config.sni || 'cloudflare.com'
        },
        createdAt: Date.now()
    };
    
    ws.send(JSON.stringify({
        type: 'tunnel.created',
        tunnel: tunnelConfig
    }));
    
    return tunnelConfig;
}

function destroyTunnel(ws, tunnelId) {
    ws.send(JSON.stringify({
        type: 'tunnel.destroyed',
        tunnelId
    }));
}

function generateTunnelId() {
    return 'tunnel_' + Math.random().toString(36).substring(2, 10);
}

function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// Handle fetch events
addEventListener('fetch', event => {
    const request = event.request;
    const url = new URL(request.url);
    
    if (request.headers.get('Upgrade') === 'websocket') {
        event.respondWith(handleWebSocketRequest(request));
    } else if (url.pathname === '/stats') {
        event.respondWith(getStatistics(request));
    } else {
        event.respondWith(new Response('Tunnel Worker', { 
            status: 200,
            headers: { 'Content-Type': 'text/plain' }
        }));
    }
});

async function getStatistics(request) {
    const stats = {
        activeConnections,
        totalBytesTransferred,
        uptime: Math.floor(Date.now() / 1000),
        workers: 1,
        status: 'healthy'
    };
    
    return new Response(JSON.stringify(stats, null, 2), {
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        }
    });
}

export default {
    fetch: handleWebSocketRequest
};
