# StudyMate — Security Specification

## 1. Data Invariants

1. **User Profile Ownership**: A user profile document at `/users/{userId}` can only be read and written by the authenticated user whose `request.auth.uid == userId`.
2. **Subject Ownership**: A subject document at `/subjects/{subjectId}` must have `userId == request.auth.uid`. A student cannot read, create, update, or delete another student's subject.
3. **Topic Ownership**: A topic document at `/topics/{topicId}` must have `userId == request.auth.uid` and valid `subjectId`. Cross-user access is denied by default.
4. **Card Ownership**: A flashcard document at `/cards/{cardId}` must have `userId == request.auth.uid`, `subjectId`, and `topicId`.
5. **Review Log Immutability**: Review logs at `/review_logs/{logId}` can be created by the owner with valid review ratings ('again', 'hard', 'good', 'easy') and SM-2 quality scores (1, 3, 4, 5). They are immutable (`allow update: if false;`).
6. **Immutability of Key Identity Fields**: Once created, `userId` and `createdAt` on any document cannot be altered. For topics and cards, parent `subjectId` and `topicId` are also immutable.
7. **Controlled Attribute Validation**:
   - Subject `name`: String, 2 to 60 characters.
   - Topic `title`: String, 2 to 80 characters.
   - Topic `description`: Optional string, 0 to 300 characters.
   - Topic `status`: Strictly `'not_started' | 'learning' | 'reviewed'`.
   - Card `front`: String, 2 to 500 characters.
   - Card `back`: String, 1 to 1000 characters.
   - Card `easeFactor`: Number >= 1.3.
   - Card `interval`: Non-negative number.
   - Card `dueDate`: String up to 10 characters (YYYY-MM-DD).
8. **Default Deny**: Any document path not explicitly allowed must be completely denied.

---

## 2. The "Dirty Dozen" Payloads (Adversarial Attack Vectors)

1. **Payload 1 (Ghost Write / Unauthenticated Create)**:
   - Request: Anonymous / null auth attempts `setDoc(/topics/top1, { title: "Topic", userId: "studentA" })`.
   - Expected: `PERMISSION_DENIED`.
2. **Payload 2 (Cross-User Topic Spoofing on Create)**:
   - Request: Authenticated user `studentA` attempts to create `/topics/top1` with `userId: "victimB"`.
   - Expected: `PERMISSION_DENIED`.
3. **Payload 3 (Parent Hijack on Update)**:
   - Request: Authenticated user attempts to modify `subjectId` on an existing card to move it into another user's subject.
   - Expected: `PERMISSION_DENIED` via immutable parent fields check `incoming().subjectId == existing().subjectId`.
4. **Payload 4 (Ghost Field / Shadow Field Injection on Cards)**:
   - Request: Authenticated user attempts to write `{ front: "Q", back: "A", isAdmin: true, bypassDue: true }`.
   - Expected: `PERMISSION_DENIED` via `hasOnly()` strict keys constraint.
5. **Payload 5 (Oversized Payload / Denial of Wallet Attack)**:
   - Request: Authenticated user attempts to create a card with a `back` answer of 50,000 characters.
   - Expected: `PERMISSION_DENIED` via `.size() <= 1000` constraint.
6. **Payload 6 (Oversized Document ID Injection)**:
   - Request: Write to `/topics/` with a 2,000-character malicious path ID.
   - Expected: `PERMISSION_DENIED` via `isValidId()`.
7. **Payload 7 (Tampering with Review Logs)**:
   - Request: Student attempts to update an existing `/review_logs/{logId}` document to change previous ratings.
   - Expected: `PERMISSION_DENIED` (`allow update: if false;`).
8. **Payload 8 (Blanket Cross-User Card List Scraping Attack)**:
   - Request: User `studentA` queries `collection('cards')` without `where('userId', '==', studentA)`.
   - Expected: `PERMISSION_DENIED` because security rules evaluate `resource.data.userId == request.auth.uid`.
9. **Payload 9 (Cross-User Topic Delete Attack)**:
   - Request: User `studentB` sends `deleteDoc(/topics/studentA_topic1)`.
   - Expected: `PERMISSION_DENIED`.
10. **Payload 10 (Invalid Quality Rating on Review Log)**:
    - Request: User attempts to write review log with `quality: 99` or `rating: "super_genius"`.
    - Expected: `PERMISSION_DENIED`.
11. **Payload 11 (Negative Ease Factor on Card)**:
    - Request: User attempts to update `easeFactor` to `-1.5` or `0.5`.
    - Expected: `PERMISSION_DENIED` via `data.easeFactor >= 1.3` constraint.
12. **Payload 12 (Empty Topic Title / Under-limit string)**:
    - Request: User creates a topic with `title: " "`.
    - Expected: `PERMISSION_DENIED` because `title.size() >= 2`.
