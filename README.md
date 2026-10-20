# StudyMate — Milestone 1: Production-Oriented Web Foundation

StudyMate is an ambitious, AI-powered learning platform designed to make studying engaging, understandable, personalised, and effective through first-principles concept comprehension, spaced retrieval, mistake archaeology, and transparent progress tracking.

This repository represents **Milestone 1**, providing the production-oriented web foundation, user authentication, Cloud Firestore database persistence, and subject management.

---

## 1. System Architecture

```
studymate/
├── src/
│   ├── config/
│   │   └── firebase.ts            # Firebase App, Auth, Firestore init & error handling
│   ├── context/
│   │   └── AuthContext.tsx        # Firebase Auth state & user profile synchronization
│   ├── services/
│   │   ├── subjectService.ts      # Real-time Firestore CRUD & snapshot queries
│   │   └── userService.ts         # User profile sync & Firestore document management
│   ├── utils/
│   │   ├── validation.ts          # Pure input sanitization & boundary checking
│   │   ├── dashboard.ts           # Pure study metrics & greeting calculations
│   │   └── palette.ts             # Controlled academic color palettes & Lucide icons
│   ├── components/
│   │   ├── auth/
│   │   │   └── LoginView.tsx      # Editorial sign-in with Google & demo preview
│   │   ├── layout/
│   │   │   └── AppShell.tsx       # Responsive sidebar, mobile drawer, & navigation
│   │   ├── overview/
│   │   │   └── OverviewView.tsx   # Dashboard with metrics, checklist, & recent subjects
│   │   ├── subjects/
│   │   │   ├── SubjectsView.tsx   # Subject CRUD, live search, color filters, & cards
│   │   │   ├── SubjectModal.tsx   # Validated subject creation & editing modal
│   │   │   └── DeleteConfirmModal.tsx # Explicit deletion confirmation modal
│   │   └── common/
│   │       └── ComingSoonView.tsx # Architectural roadmap for M2 & M3
│   ├── types/
│   │   └── index.ts               # Shared TypeScript domain contracts
│   ├── App.tsx                    # Main orchestrator component
│   └── main.tsx                   # React 19 entry point
├── firebase-blueprint.json        # Intermediate Representation (IR) schema
├── firestore.rules                # Hardened 8-Pillar Firestore Security Rules
└── security_spec.md               # Security invariants & Dirty Dozen attack tests
```

---

## 2. Firebase Authentication & Firestore Setup

### Supported Authentication
- **Google Sign-In**: Integrated using Firebase `signInWithPopup(auth, googleProvider)`.
- **Zero-Trust User Profiles**: On authentication, a document in `/users/{userId}` is synced or created with the authenticated identity. Document ID strictly matches `request.auth.uid`.
- **Preview & Demo Mode**: Supports instant interactive preview for testing or automated verification without unmocked popup credentials.

### Cloud Firestore Structure
- `/users/{userId}`: User account document (name, email, photoURL, timestamps).
- `/subjects/{subjectId}`: Course documents owned by the student (`userId == request.auth.uid`).

---

## 3. Firestore Security Rules & Access Control

Rules are defined in `firestore.rules` adhering to the 8 Pillars of Hardened ABAC Security:
1. **Default Deny Catch-All**: `match /{document=**} { allow read, write: if false; }` blocks any undeclared endpoints.
2. **Identity Integrity**: `data.userId == request.auth.uid` is enforced on all subject creations and mutations.
3. **Query Enforcer**: `allow list: if isSignedIn() && resource.data.userId == request.auth.uid;` forces client queries to isolate results by `userId`.
4. **Action-Based Update Protection**: `affectedKeys().hasOnly([...])` strictly controls field modifications, forbidding tampering with `id`, `userId`, or `createdAt`.
5. **Path Hardening & Resource Protection**: `isValidId()` blocks path injection attacks. All string fields have strict `.size()` bounds to prevent wallet exhaustion attacks.
6. **Temporal Integrity**: `createdAt` and `updatedAt` are validated against server timestamps.

---

## 4. Local Development & Setup

### Prerequisites
- Node.js 22+
- npm or bun

### Installation
```bash
# Clone the repository and install dependencies
npm install

# Start the Vite development server (port 3000)
npm run dev
```

### Build & Typecheck
```bash
# Type check with TypeScript compiler
npm run lint

# Production build
npm run build
```

---

## 5. Automated Testing

### Native Unit Tests
StudyMate decouples pure business logic (validation, calculation, formatting) from the UI components. Tests run natively in Node 22 without bundler overhead:
```bash
node --test
```
Covers:
- Subject form validation rules, bounds (2-60 chars for name, max 20 for code, max 280 for description, 0-168 for hours).
- Sanitization and fallback for invalid colors/icons.
- Dashboard metric aggregation and greeting logic.

### Visual & Browser Verification
Browser workflows and accessibility snapshots are verified via `@playwright/cli` (`playwright-cli`).

---

## 6. Milestone Roadmap

- **Milestone 1 (Current)**: Production-Oriented Web Foundation, Google Sign-in, User Profiles, Cloud Firestore CRUD for Subjects, Today's Checklist, Dashboard.
- **Milestone 2 (Next)**: Revision Room with SM-2 / FSRS Spaced Retrieval, Topic Decomposition, Mistake Archaeology, and Study Library flashcards.
- **Milestone 3**: AI Study Buddy powered by Gemini with high thinking mode (`thinkingLevel: HIGH`) for Socratic problem deconstruction.
