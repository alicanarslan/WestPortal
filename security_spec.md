# Security Specification: Co-op Game Lounge

This document defines the zero-trust data invariants, malicious "Dirty Dozen" payload test cases, and the structural rules specifications to secure our real-time Firestore database.

## 1. Data Invariants

- **Users**:
  - A user profile must reside at `/users/{userId}` where `{userId}` is equal to their Firebase Auth `uid`.
  - Profiling is immutable except for username updates, which are strictly guarded.

- **Messages**:
  - Global lounge messages are stored under `/messages/{messageId}`.
  - Users can only publish messages with `createdAt` set to the exact server time `request.time`.
  - The message field `author` must match the publishing user's verified identity.
  - Message modification and deletions are disabled for general users, preventing content tampering.

- **Games**:
  - Stored under `/games/{gameId}`.
  - Publicly readable. Only authorized administrators (listed in the admin document path `/admins/{adminId}`) can add or delete games.

- **Reviews**:
  - Top level under `/reviews/{reviewId}`.
  - Verified users can create reviews, but the author identity is validated, and rating must be an integer between 1 and 5.

- **Events & Comments**:
  - Located under `/events/{eventId}` and `/events/{eventId}/comments/{commentId}`.
  - A user can create events. They are the `organizer` of these events.
  - A user who is not the organizer can ONLY perform updates if they are joining or leaving a slot in the event (modifying the `players` array).

---

## 2. The "Dirty Dozen" Payloads (Denial Vectors)

Let's list the twelve malicious payloads designed to bypass identity, integrity, or state boundaries, which our `firestore.rules` will explicitly reject:

1. **Self-Appointed Profile Creation ($users)**
   - Attempt to write a profile under `/users/other-uid` where the `uid` does not match the authenticated user.
2. **Ghost-Admin Elevation ($users)**
   - Attempt to add a field `role: "ADMIN"` or equivalent inside their own user profile document.
3. **Spoofed Message Author ($messages)**
   - Logged-in user `UserA` attempts to post a message with `author: "UserB"`.
4. **Retroactive Timestamp Hijack ($messages)**
   - Attempt to write `createdAt: "2020-01-01T00:00:00Z"` to fake old messages instead of using `request.time`.
5. **Unauthorized Game Insertion ($games)**
   - Non-admin user attempts to insert or modify a game at `/games/123990`.
6. **Out-of-Bound Rating ($reviews)**
   - User attempts to write a review with rating `6` (limit 1-5).
7. **Cross-User Event Hijack ($events)**
   - User attempts to delete or alter a lobby created by another user.
8. **Malicious Player Array Expansion ($events)**
   - Attempt to bypass limits by adding 100 fake player names into the event `players` array on join.
9. **Junk Character Path Injection ($events)**
   - Attempt to create an event with a document ID exceeding 128 characters or containing illegal regex characters like `///`.
10. **Spoofed Event Comment ($comments)**
    - Posting a comment at `/events/event_1/comments/c_1` where `author` is someone else.
11. **Blanket Query Abuse ($messages)**
    - Attempting a list query on `/messages` without signed-in credentials.
12. **Status Locking Bypass ($events)**
    - Modifying an immutable historical event that is completed.

---

## 3. Security Test Specs

Our `firestore.rules` will test each vector to verify that all operations return `PERMISSION_DENIED`. We will implement Global Catch-All default deny:
```javascript
match /{document=**} {
  allow read, write: if false;
}
```

Every update branch must enforce `affectedKeys().hasOnly()` to allow exactly specified keys, avoiding write leaks.
