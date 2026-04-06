# Gobuddy Real-Time Chat System

Built as part of the Adverayze 4-hour Technical Assignment, this repository contains a complete full-stack real-time chat application with robust security features, localized session state tracking, and premium vanilla dark-mode styling.

## Features
- **Real-Time Synchronisation:** Instant message broadcasting via WebSockets (Socket.io).
- **Pinning & Highlighting:** Messages can be pinned which universally syncs them to the Sidebar.
- **Delete Protocols:**
  - `Delete for Me`: Drops message from local DOM and registers a flag on the backend so it doesn't fetch on reload.
  - `Delete for Everyone`: Instantly replaces message content globally.
- **Next-Gen Aesthetics:** Glassmorphic UI constructed completely via Vanilla CSS (No Tailwind) using Next.js App Router.
  
## Project Structure
The project is decoupled for maximal websocket reliability and clear boundary separations:
- `/frontend` - Next.js App Router Application.
- `/backend` - Node.js + Express WebSocket edge application.

---

## Getting Started Locally

### Prerequisites
- Node.js `v18+`
- MongoDB cluster (Remote connection strings pre-populated in `.env` templates for simplicity).

### Backend Setup
1. `cd backend`
2. `npm install`
3. Ensure `.env` is populated with `MONGODB_URI`.
4. Run `npm start` or `node server.js`
5. *Server boots on `http://localhost:5000`*

### Frontend Setup
1. `cd frontend`
2. `npm install`
3. Run `npm run dev`
4. *Frontend boots on `http://localhost:3000`*

---

## Security & Edge Cases Handled

Following explicit requests for cyber resilience against common web attack vectors, the backend implements:

1. **HelmetJS**: Injects secure HTTP headers into Node.js (e.g., `X-Content-Type-Options`, `X-Frame-Options` blocking simple clickjacking).
2. **CORS Governance**: Strict whitelisting `frontend` origin blocking unauthorized cross-origin fetches.
3. **Express Rate Limiting**: Mitigating basic DDoS or spam bot flooding on the API routes (150 requests / minute max).
4. **XSS Protection & DOMPurify**: Input is fully evaluated. Strings strip executing code segments limiting stored cross-site scripting risks upon render.
5. **Payload Limitation**: Built-in 10kb body parser limit & mongoose MaxLength enforcements ensuring massive 5MB text blobs crash at the router gate rather than the RAM stack.

## Architecture & Tradeoffs

- **Decoupled Strategy**: While Next.js App Router (Server Actions/API routes) is extremely powerful, persisting long-polling WebSockets via Vercel’s serverless architecture requires hacks. Deploying a dedicated long-lived Node.js HTTP server on Render/Railway maintains persistent and reliable socket tubes.
- **No-Auth User Management**: Since direct JWT/Auth workflows fell slightly outside the required 4 hours (and user schema wasn't requested), a pseudo-client identity using `localStorage` hash values defines identity bindings. This solves "Delete for Me" persistence.
- **"Delete for Everyone" Validation**: Because of the pseudo-auth approach, security blocks on cross-user deletion is partially enforced matching `senderId` to `userId`, though a full malicious API hijack via Postman could fake this header. A true JWT architecture would enforce bulletproof origin validation.

Enjoy the application!
