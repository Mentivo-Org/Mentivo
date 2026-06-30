# Implementation Plan: Fix Socket.IO 400 Errors (Sticky Sessions)

## Problem
Socket.IO starts by sending an HTTP long-polling request (handshake) to the server. With multiple backend instances and simple Round-Robin routing, the first request might go to **Worker 1**, which creates the session. The next polling request from that same user might be routed to **Worker 2**. Worker 2 doesn't know about that session, so it returns a **400 Bad Request (Session ID unknown)** error.

## Proposed Solution: IP Hashing (Sticky Sessions)
We need to ensure that once a user connects, all their subsequent requests are consistently routed to the **same** backend instance.

We will replace the Round-Robin logic in the Load Balancer with **IP Hashing**. 
By hashing the user's IP address (e.g., `req.headers['x-forwarded-for']`), we can deterministically pick the same worker node for that IP every time.

### Changes to `load-balancer/index.js`
1. Replace the `getNextNode()` round-robin function with a `getStickyNode(ip)` function.
2. The function will generate a simple numerical hash from the IP string.
3. We will use the modulo operator (`hash % userNodes.length`) to select the backend instance consistently.
4. We will pass the IP to the proxy router to make the routing decision.

```javascript
// New Sticky Session Router logic
const getStickyNode = (ip) => {
    let hash = 0;
    for (let i = 0; i < ip.length; i++) {
        hash = (hash << 5) - hash + ip.charCodeAt(i);
        hash |= 0; // Convert to 32bit int
    }
    const index = Math.abs(hash) % userNodes.length;
    return userNodes[index];
};

// Update userProxy router
router: (req) => {
    const ip = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket.remoteAddress || 'unknown';
    const node = getStickyNode(ip);
    lastRoutedNode = node;
    return node;
}
```

This ensures that Socket.IO long-polling requests and WebSocket upgrades from the same user always hit the same backend container, completely eliminating the 400 errors.

## Verification
1. Apply the changes to the load balancer code.
2. Verify that Socket.IO connections remain stable and 400 errors disappear.
