# KA² — HEAVEN REST & WebSocket API Reference

## 1. REST Endpoints

### Authentication (`/api/auth`)
- `POST /login`: Authenticates Keerthi or Anu with email, password, and device metadata.
- `POST /refresh`: Rotates and generates a fresh JWT access token.
- `GET /me`: Fetches profile and partner presence status.
- `PUT /profile`: Updates display name, nickname, bio, and avatar.
- `POST /pin/verify`: Validates 4-digit security PIN for vault and app unlock.
- `PUT /pin/change`: Updates security PIN.
- `GET /sessions`: Lists active hardware sessions.
- `DELETE /sessions/:id`: Revokes specific device access.
- `POST /logout`: Sets status to offline and clears session.

### Realtime Messaging (`/api/chat`)
- `GET /messages`: Retrieves message history with pagination and search filter.
- `POST /messages`: Sends text, media, or voice note payload.
- `PUT /messages/:id`: Edits an outgoing message.
- `DELETE /messages/:id`: Soft-deletes a message.
- `POST /messages/:id/react`: Toggles emoji reaction (❤️, 😍, ✨, 🔥).
- `POST /read`: Marks all partner messages as read.

### Calling Logs (`/api/calls`)
- `GET /history`: Returns history of voice and video calls with durations.
- `POST /log`: Records completed call metadata.

### Memories (`/api/memories`)
- `GET /`: Lists shared moments filtered by category (`photos`, `videos`, `voice`, `favorites`).
- `POST /`: Uploads and creates a shared romantic memory.
- `PUT /:id/favorite`: Toggles memory favorite status.
- `DELETE /:id`: Deletes a memory item.

### Private Vault (`/api/vault`)
- `GET /?vaultType=shared|personal`: Fetches encrypted ciphertext items.
- `POST /`: Stores client-side encrypted AES-256 item.
- `DELETE /:id`: Deletes vault secret.

### Love Notes (`/api/love-notes`)
- `GET /`: Retrieves love letters and postcards.
- `POST /`: Dispatches a sealed love note.
- `PUT /:id/open`: Marks note as opened and records timestamp.

### Admin Infrastructure (`/api/admin`)
- `GET /telemetry`: System metrics, memory, active WebSockets, storage bytes.
- `GET /settings`: Retrieves current branding and theme configuration.
- `PUT /settings`: Updates branding, theme colors, and particle density.
- `GET /audit-logs`: Retrieves immutable security audit log.
- `GET /devices`: Lists all connected hardware.
- `DELETE /devices/:id`: Revokes any device session immediately.

---

## 2. WebSocket Events (`Socket.IO`)

| Event Name | Direction | Payload Description |
|---|---|---|
| `presence:sync` | Server -> Client | Active status of Keerthi & Anu and `bothOnline` boolean |
| `chat:typing_start` | Bidirectional | Triggers 3-particle typing indicator |
| `chat:typing_stop` | Bidirectional | Clears typing indicator |
| `chat:message_send` | Client -> Server | Dispatches new chat message |
| `chat:message_receive`| Server -> Client | Broadcasts incoming message |
| `call:initiate` | Client -> Server | Rings partner device with `callType` (voice/video) |
| `call:incoming` | Server -> Client | Displays full-screen incoming call overlay |
| `call:accept` | Client -> Server | Accepts call and starts WebRTC connection |
| `call:signal_offer` | Bidirectional | Forwards WebRTC SDP Offer |
| `call:signal_answer`| Bidirectional | Forwards WebRTC SDP Answer |
| `call:signal_ice` | Bidirectional | Forwards WebRTC ICE Candidates |
| `call:recording_request` | Bidirectional | Dispatches dual-consent recording request |
| `system:config_update` | Server -> Client | Propagates updated brand colors and settings live |
