// Cloudflare Worker for VPN tunnel - Main entry point

const port = {{PORT}};
const path = '{{PATH}}';
const protocol = '{{PROTOCOL}}';
const uuid = '{{UUID}}';
const sni = '{{SNI}}';
const encryption = '{{ENCRYPTION}}';

async function handleRequest(request) {
    const url = new URL(request.url);
    const requestPath = url.pathname;
    
    // Handle health check
    if (requestPath === '/health') {
        return new Response('OK', { status: 200 });
    }
    
    // Handle config endpoint
    if (requestPath === '/config') {
        return handleConfigRequest(request);
    }
    
    // Handle WebSocket upgrade
    if (request.headers.get('Upgrade') === 'websocket' || requestPath.startsWith(path)) {
        return handleWebSocket(request);
    }
    
    // Handle proxy request
    return handleProxyRequest(request);
}

async function handleConfigRequest(request) {
    const config = {
        uuid,
        port,
        path,
        protocol,
        sni,
        encryption,
        version: '2.0.0',
        features: ['reality', 'multi-hop', 'clean-ip']
    };
    
    return new Response(JSON.stringify(config, null, 2), {
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        }
    });
}

async function handleWebSocket(request) {
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    
    server.accept();
    
    // Handle WebSocket messages
    server.addEventListener('message', async (event) => {
        try {
            const message = JSON.parse(event.data);
            const response = await processWebSocketMessage(message);
            server.send(JSON.stringify(response));
        } catch (error) {
            server.send(JSON.stringify({ error: error.message }));
        }
    });
    
    // Handle WebSocket close
    server.addEventListener('close', () => {
        console.log('WebSocket connection closed');
    });
    
    return new Response(null, {
        status: 101,
        webSocket: client
    });
}

async function handleProxyRequest(request) {
    const url = new URL(request.url);
    const targetUrl = url.searchParams.get('url');
    
    if (!targetUrl) {
        return new Response('Missing url parameter', { status: 400 });
    }
    
    try {
        const response = await fetch(targetUrl, {
            method: request.method,
            headers: request.headers,
            body: request.body
        });
        
        // Add proxy headers
        const proxyResponse = new Response(response.body, {
            status: response.status,
            headers: {
                ...response.headers,
                'X-Proxy-By': 'vpn-turbo-tunnel'
            }
        });
        
        return proxyResponse;
    } catch (error) {
        return new Response(`Proxy error: ${error.message}`, { status: 502 });
    }
}

async function processWebSocketMessage(message) {
    const { type, data } = message;
    
    switch(type) {
        case 'tunnel':
            return handleTunnelRequest(data);
        case 'config':
            return await handleConfigRequest();
        case 'metrics':
            return getTunnelMetrics();
        default:
            return { error: 'Unknown message type' };
    }
}

function handleTunnelRequest(data) {
    // Process tunnel creation/management
    const tunnelId = data.tunnelId || generateTunnelId();
    
    return {
        status: 'success',
        tunnelId,
        endpoint: `${url.origin}${path}`,
        config: {
            uuid,
            port,
            protocol,
            encryption,
            sni
        }
    };
}

function generateTunnelId() {
    return 'tunnel_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
}

function getTunnelMetrics() {
    return {
        connections: Math.floor(Math.random() * 100),
        bandwidth: Math.floor(Math.random() * 1000) + ' MB',
        uptime: Math.floor(Date.now() / 1000),
        protocol,
        status: 'active'
    };
}

addEventListener('fetch', event => {
    event.respondWith(handleRequest(event.request));
});

// Export for Worker
export default {
    fetch: handleRequest
};
