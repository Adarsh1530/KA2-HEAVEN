# KA² — HEAVEN Security & Encryption Guide

## 1. Zero-Knowledge Private Vault Architecture

Private Vault items and confidential love secrets are protected via client-side authenticated cryptography:

```
[ User PIN (e.g. 2808) ] + [ Salt ]
            │
            ▼ (PBKDF2 SHA-256 with 100,000 iterations)
   [ 256-bit AES-GCM Key ]
            │
            ▼ (WebCrypto SubtleCrypto)
[ Plaintext Secret Data ] ───► [ Ciphertext (Base64) + 12-byte IV ]
                                           │
                                           ▼ (Encrypted Wire Transfer)
                                [ Backend PostgreSQL / Storage ]
```

- Plaintext secrets **never leave the user device unencrypted**.
- The server stores only ciphertext and IV.

---

## 2. Infrastructure vs Private Data Access Separation

Per the system design rules:
1. Administrator privileges allow monitoring server health, active sockets, and theme branding.
2. Admin privileges **do not allow reading partner plaintext personal vaults or decrypting messages**.
3. If Anu stores an item in her "MY PRIVATE VAULT", Keerthi's dashboard and mobile client receive zero access keys and queries are blocked at the database and client layers.

---

## 3. Call Recording Dual Consent

1. Audio/video call recording requires explicit interactive consent from both Keerthi and Anu.
2. A visible modal `"Record this call?"` is displayed.
3. Both participants are visually notified with an active `🔴 Recording` badge.
4. Encrypted recordings are automatically saved to the Private Vault.

---

## 4. Authentication & Session Rotation

- Password Hashing: Bcrypt with 10 salt rounds.
- Tokens:
  - Access Token: 15 minutes validity.
  - Refresh Token: 30 days validity with cryptographic fingerprinting.
- Revocation: Device sessions can be instantly terminated by Keerthi or individual users from Settings.
