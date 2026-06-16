# Fix Memory & Event Listener Leak in API Gateway (Error Code 134)

The Render `Error code 134` (OOM/SIGABRT) is caused by the dynamic instantiation of `createProxyMiddleware` on every incoming request in `backend/src/app.ts`. Because the proxy is configured with `ws: true`, each new proxy instance attempts to bind an `upgrade` event listener to the root HTTP server. Under load (e.g., WebSocket connection attempts), this leads to a massive accumulation of event listeners and unbounded memory growth, eventually crashing the container.

## Proposed Changes

### [Component: Gateway Proxy]

We will refactor `backend/src/app.ts` to instantiate the proxies exactly **once** at server startup. We will also properly bind the `upgrade` event to the HTTP server, which is the correct way to handle WebSockets in `http-proxy-middleware` without leaking listeners.

#### [MODIFY] `backend/src/app.ts`

```typescript
// Initialize Static Proxy Instances Once
const v1Target = `http://127.0.0.1:${process.env.PORT_V1 || 4000}`;
const v2Target = `http://127.0.0.1:${process.env.PORT_V2 || 4001}`;

const v1Proxy = createProxyMiddleware({
  target: v1Target,
  changeOrigin: true,
  ws: true,
});

const v2Proxy = createProxyMiddleware({
  target: v2Target,
  changeOrigin: true,
  ws: true,
});

// Unified Proxy Router for both standard HTTP requests and initial polling requests
app.use((req, res, next) => {
  const apiVersion = req.headers['x-api-version'] || req.query.version;
  if (apiVersion === 'v2') {
    v2Proxy(req, res, next);
  } else {
    v1Proxy(req, res, next);
  }
});

// ...

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`Mentivo API Gateway Proxy running on port ${PORT}`);
});

// Correctly proxy WebSocket upgrade requests without leaking listeners
server.on('upgrade', (req, socket, head) => {
  let apiVersion = req.headers['x-api-version'];
  if (!apiVersion) {
    // Attempt to extract from query parameters for WebSocket handshakes
    const url = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);
    apiVersion = url.searchParams.get('version');
  }

  if (apiVersion === 'v2') {
    // @ts-ignore
    v2Proxy.upgrade(req, socket, head);
  } else {
    // @ts-ignore
    v1Proxy.upgrade(req, socket, head);
  }
});
```
