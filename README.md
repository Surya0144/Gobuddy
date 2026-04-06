# Gobuddy Real-Time Chat System

Built as part of the Adverayze Technical Assignment, this repository contains a complete, production-ready full-stack real-time chat application. It features robust backend security architectures, instantaneous WebSockets, persistent database sync, and a premium "glassmorphic" UI constructed entirely via vanilla CSS Modules.

![Gobuddy Layout Concepts](https://img.shields.io/badge/Next.js-14%2B-black?logo=next.js)
![Deploy](https://img.shields.io/badge/Deployment-Vercel%20%7C%20Render-blue)
![DB](https://img.shields.io/badge/Database-MongoDB%20Atlas-green?logo=mongodb)

---

## 🌟 Key Features

- **Blazing Fast Synchronisation:** Utilizes `Socket.io` to broadcast live message feeds across multiple clients without page refreshes.
- **Message Pinning:** Interactive "Pin" buttons that dynamically hoist important texts into a globally synced Sidebar hub with click-to-scroll navigation.
- **Granular Deletion Controls:**
  - `Delete for Me`: Drops the message from the user's localized DOM and appends their identity tracking ID to the backend blacklist, ensuring the message doesn't return on page reload.
  - `Delete for Everyone`: Verifies the message sender and instantly overwrites the payload string in the database and broadcasts a removal trigger globally.
- **Persistent State:** Built-in UUID `localStorage` trackers instantly bind a user to their session context, solving identity loops and ensuring seamless refreshing.
- **Vanilla Glassmorphism:** Avoided generic CSS libraries (like Tailwind) to prove foundational design systems can achieve top-tier aesthetic fluidity using CSS Variables and isolated module scopes.

---

## 🔒 Security Architecture (Production Hardened)

Following assignment requirements for zero crash vectors and cyber resilience against web vulnerabilities, the backend is locked down by multiple middlewares:

1. **HelmetJS**: Injects secure HTTP headers deep into the Node.js cycle (blocking `X-Frame-Options` clickjacking and mimed-sniffing).
2. **CORS Governance**: A strict cross-origin whitelist strictly allows the Vercel-deployed frontend domain to interact with the API, actively blocking random origin spoofing.
3. **API Rate Limiting**: The backend halts brute-force flooding and spam bots at the API gate, restricting users to `150 requests / 1-min-window`.
4. **Native XSS Regex Escaper**: We intentionally rip HTML injections (`<script>`) out of message bodies on arrival to prevent DOM-based Cross-Site Scripting. *(Note: Third-party heavier HTML sanitizers like JSdom were intentionally removed as they structurally break the ESM top-level module loaders on modern Node v22 instances).*
5. **Payload Limiters**: Implemented `10kb` Body-Parser caps and hyper-strict `mongoose` schema limitations (max 2000 chars) ensuring heavy payloads bounce before destroying available RAM.

---

## 🏗️ Project Structure

The repository is intentionally decoupled to allow independent scaling, separating the serverless static assets from the long-lived persistent TCP WebSockets.

- `/frontend` - Next.js App Router Application.
- `/backend` - Node.js + Express WebSocket application.

---

## 🚀 Live Deployment Guide

The platform is designed to effortlessly run on **Vercel** and **Render.com**. 

### 1. MongoDB Setup
- Ensure your MongoDB Atlas cluster has your IP Whitelisted (`0.0.0.0/0`) under Network Access, otherwise Mongoose will naturally throw a 500 timeout due to port blocking.

### 2. Backend (Render.com)
1. Set the root directory to `backend`.
2. Run command: `npm install`
3. Start command: `node server.js`
4. Set the `MONGODB_URI` environment variable to your Atlas string.
5. Set `FRONTEND_URL` exactly to your ultimate Vercel frontend URL so the CORS wall allows it.

### 3. Frontend (Vercel)
1. Set the root directory configuration to default `frontend`.
2. Provide two vital environment variables inside the Vercel dashboard linking back to your new Render instance:
   - `NEXT_PUBLIC_SOCKET_URL` = `https://your-render-name.onrender.com`
   - `NEXT_PUBLIC_API_URL` = `https://your-render-name.onrender.com/api/messages`
3. Hit Deploy! 

---

## 🧠 Approach & Tradeoffs

- **Architecture:** While Next.js `Server Actions` and internal API routes are sleek, sustaining WebSockets (which require "Long Polling") via Vercel’s strictly internal standard serverless functions is an anti-pattern that ends in dropped connections. Spinning up a dedicated Node.js HTTP server ensures unshakeable socket tubes.
- **Session Auth:** Because a full encrypted JSON Web Token (JWT) workflow wasn't listed and sat slightly outside the 4-hour constraints, the `localStorage` identity model was established.
- **Validation Fallback:** Because of the pseudo-auth approach, security blocks on cross-user deletion currently relies on matching the local `senderId` to `userId` over query loops. For a medical-grade security application, swapping this logic into HTTPS Cookie-based server-signed JWTs would be the explicit next phase.
