# StudyMate — Security Specification

## 1. Data Invariants

1. **User Profile Ownership**: A user profile document at `/users/{userId}` can only be read and written by the authenticated user whose `request.auth.uid == userId`.
2. **Subject Ownership**: A subject document at `/subjects/{subjectId}` must have `userId == request.auth.uid`. A student cannot read, create, update, or delete another student's subject.
3. **Immutability of Key Identity Fields**: Once created, `userId` and `createdAt` on a subject or user document cannot be altered by an update operation.
4. **Controlled Attribute Validation**:
   - `name`: String, 2 to 60 characters.
   - `code`: Optional string, 0 to 20 characters.
   - `description`: Optional string, 0 to 280 characters.
   - `color`: Optional string, max 30 characters.
   - `icon`: Optional string, max 30 characters.
   - `targetHours`: Optional positive number (0 to 168 hours).
   - Document ID: Alphanumeric with hyphens/underscores, max 128 chars.
5. **Timestamp Temporal Integrity**: `createdAt` and `updatedAt` must be valid timestamps, where `updatedAt == request.time` on updates.
6. **Default Deny**: Any document path not explicitly allowed must be completely denied.

---

## 2. The "Dirty Dozen" Payloads (Adversarial Attack Vectors)

1. **Payload 1 (Ghost Write / Unauthenticated Create)**:
   - Request: Anonymous / null auth attempts `setDoc(/subjects/math101, { name: "Math", userId: "studentA" })`.
   - Expected: `PERMISSION_DENIED`.
2. **Payload 2 (Identity Spoofing on Create)**:
   - Request: Authenticated user `studentA` attempts to create `/subjects/chem101` with `userId: "victimB"`.
   - Expected: `PERMISSION_DENIED`.
3. **Payload 3 (Owner Hijack on Update)**:
   - Request: Authenticated user `studentA` attempts to update their subject and change `userId: "victimB"` or `studentB` attempts to update `studentA`'s subject.
   - Expected: `PERMISSION_DENIED`.
4. **Payload 4 (Ghost Field / Shadow Field Injection)**:
   - Request: Authenticated user attempts to write `{ name: "Math", userId: "studentA", isAdmin: true, role: "superuser" }`.
   - Expected: `PERMISSION_DENIED` via `hasOnly()` strict keys constraint.
5. **Payload 5 (Oversized Payload / Denial of Wallet Attack)**:
   - Request: Authenticated user attempts to create a subject with a `name` of 10,000 characters.
   - Expected: `PERMISSION_DENIED` via `.size() <= 60` constraint.
6. **Payload 6 (Oversized Document ID Injection)**:
   - Request: Write to `/subjects/` with a 2,000-character malicious path ID.
   - Expected: `PERMISSION_DENIED` via `isValidId()`.
7. **Payload 7 (Profile PII Snooping / Cross-User Get)**:
   - Request: User `studentA` attempts to `getDoc(/users/studentB)`.
   - Expected: `PERMISSION_DENIED`.
8. **Payload 8 (Blanket List Scraping Attack)**:
   - Request: User `studentA` performs `getDocs(collection('subjects'))` without filtering by `userId == studentA`.
   - Expected: `PERMISSION_DENIED` because security rules reject queries without matching resource constraints.
9. **Payload 9 (Cross-User Delete Attack)**:
   - Request: User `studentB` sends `deleteDoc(/subjects/studentA_subject1)`.
   - Expected: `PERMISSION_DENIED`.
10. **Payload 10 (Type Poisoning on Target Hours)**:
    - Request: User attempts to update `targetHours` with `"ten_hours"` (string instead of number) or `-5`.
    - Expected: `PERMISSION_DENIED`.
11. **Payload 11 (Immutable Field Mutation - createdAt tampering)**:
    - Request: User attempts to overwrite `createdAt` with a timestamp from 5 years ago.
    - Expected: `PERMISSION_DENIED` because `incoming().createdAt == existing().createdAt`.
12. **Payload 12 (Empty Subject Name / Under-limit string)**:
    - Request: User creates a subject with `name: ""` or `name: " "`.
    - Expected: `PERMISSION_DENIED` because `name.size() >= 2`.
