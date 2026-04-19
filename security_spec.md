# Firestore Security Specification - HypeRemote

## Data Invariants
1. Devices, Tickets, Alerts, and Logs MUST belong to a valid `userId`.
2. Users can only read/write their own data, unless they are an admin.
3. Enrollment tokens are sensitive and MUST NOT be readable by any client.
4. Heartbeat data is read-only for users (written by server).
5. KB articles are public (read-only) for all signed-in users, but only admins can write.
6. Identity fields (userId, ownerId) MUST be immutable on update.

## The "Dirty Dozen" Payloads (Denial Tests)

1. **Identity Spoofing**: Attempt to create a ticket with another user's `userId`.
2. **Privilege Escalation**: Attempt to update own user profile `role` to `admin`.
3. **Shadow Field Injection**: Attempt to create a device with a hidden `isAdmin: true` field.
4. **Token Theft**: Attempt to read `/agent_enrollment_tokens/` collection.
5. **Heartbeat Poisoning**: Attempt to write fake high CPU usage to `/device_heartbeats/`.
6. **Script Tampering**: Attempt to update a shared script's content as a non-admin.
7. **Orphaned Record**: Attempt to create a ticket without a `userId`.
8. **State Shortcutting**: Attempt to update a command status from `pending` to `completed` from the browser (should be agent/server only).
9. **Bulk Scrape**: Attempt a blanket `list` query on `/devices/` without a `userId` filter.
10. **ID Poisoning**: Attempt to create a document with a 2MB string as ID.
11. **Timestamp Spoofing**: Attempt to set a future `createdAt` date.
12. **PII Leak**: Attempt to read another user's private profile information.

## Test Runner (Hardened Assertions)
All above payloads MUST return `PERMISSION_DENIED`.

---
*Follow the DRAFT_firestore.rules for implementation details.*
