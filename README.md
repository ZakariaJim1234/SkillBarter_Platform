# ⚡ SkillBarter

A peer-to-peer skill exchange platform where people trade skills using credits instead of money.

> Designer helps someone with UI → that person teaches Python → a third user fixes their laptop

---

## Stack

| Layer    | Technology                        |
|----------|-----------------------------------|
| Frontend | React 18, React Router v6, Axios  |
| Backend  | Node.js, Express 4                |
| Database | MongoDB + Mongoose                |
| Auth     | JWT (7-day tokens)                |
| Styling  | Custom CSS (Syne + DM Sans fonts) |

---

## Project Structure

```
skillbarter/
├── backend/
│   ├── config/         # MongoDB connection
│   ├── middleware/      # JWT auth middleware
│   ├── models/          # Mongoose schemas
│   │   ├── User.js
│   │   ├── Skill.js
│   │   ├── UserSkill.js
│   │   ├── Request.js
│   │   ├── Offer.js
│   │   ├── Agreement.js
│   │   ├── Transaction.js
│   │   ├── Review.js
│   │   ├── Dispute.js
│   │   └── Message.js
│   ├── routes/          # Express route handlers
│   ├── services/        # Business logic
│   │   ├── creditService.js     # Escrow & transfer logic
│   │   └── reputationService.js # Score calculation
│   ├── seed.js          # Database seeder
│   └── server.js
│
└── frontend/
    └── src/
        ├── components/  # Navbar
        ├── context/     # AuthContext (global user state)
        ├── pages/       # All page components
        └── utils/       # Axios instance with auth headers
```

---

## Getting Started


### 1. Backend Setup

```bash
cd backend
npm install

# Start server
npm run dev        # with nodemon (dev)
```

Server runs on **http://localhost:5000**


### 2. Frontend Setup

```bash
cd frontend
npm install
npm start
```

App runs on **http://localhost:3000**

The frontend proxies `/api` calls to `localhost:5000` (configured in package.json).

---


## Core Features

### Credit Economy
- New users receive **20 starter credits**
- Credits are **reserved** (escrowed) when a request is posted
- Credits are **released** if a request is cancelled
- Credits **transfer** automatically when requester confirms completion
- All credit moves happen inside MongoDB transactions (ACID-safe)

### Marketplace Flow
```
Post Request → Receive Offers → Negotiate (Chat) → Accept Offer
→ Agreement Created → Provider Marks Complete → Requester Confirms
→ Credits Transfer → Reviews Unlocked → Reputation Updates
```

### Reputation Algorithm
```
reputation = (avgRating × 0.6) + (completedTasks × 0.3) + (responseRate × 0.1)
```

### Dispute Resolution
- Either party can open a dispute on an active agreement
- Admin resolves with three outcomes: provider wins, requester wins, or 50/50 split
- Credits are distributed accordingly

---

## API Reference

| Method | Endpoint                          | Auth     | Description                    |
|--------|-----------------------------------|----------|--------------------------------|
| POST   | /api/auth/register                | —        | Register + get JWT             |
| POST   | /api/auth/login                   | —        | Login + get JWT                |
| GET    | /api/auth/me                      | ✓        | Get own profile                |
| GET    | /api/users                        | —        | Browse marketplace (filterable)|
| GET    | /api/users/:id                    | —        | Public profile + skills        |
| POST   | /api/users/skills                 | ✓        | Add a skill offering           |
| DELETE | /api/users/skills/:id             | ✓        | Remove a skill                 |
| GET    | /api/skills                       | —        | List all skill categories      |
| GET    | /api/requests                     | —        | Browse requests (filterable)   |
| POST   | /api/requests                     | ✓        | Post a request (reserves credits) |
| GET    | /api/requests/my                  | ✓        | My requests                    |
| PUT    | /api/requests/:id/cancel          | ✓        | Cancel + release credits       |
| GET    | /api/requests/:id/messages        | ✓        | Chat messages                  |
| POST   | /api/requests/:id/messages        | ✓        | Send chat message              |
| POST   | /api/offers                       | ✓        | Submit an offer                |
| PUT    | /api/offers/:id/accept            | ✓        | Accept offer → creates agreement |
| PUT    | /api/offers/:id/reject            | ✓        | Reject offer                   |
| GET    | /api/agreements/my                | ✓        | My agreements                  |
| PUT    | /api/agreements/:id/mark-complete | ✓        | Provider: mark done            |
| PUT    | /api/agreements/:id/confirm       | ✓        | Requester: confirm + pay       |
| POST   | /api/reviews                      | ✓        | Leave a review                 |
| POST   | /api/disputes                     | ✓        | Open a dispute                 |
| GET    | /api/disputes                     | Admin    | List all disputes              |
| PUT    | /api/disputes/:id/resolve         | Admin    | Resolve dispute                |
| GET    | /api/transactions/my              | ✓        | Transaction history            |

---

## Making an Admin

Admin Gmail: ironman@gmail.com

Admin Password: qwerty

---

## Next Steps (Possible Extensions)

- **WebSockets** — Real-time chat with Socket.io
- **Notifications** — In-app or email alerts for offers/completions
- **Skill matching** — Recommend providers based on history and reputation
- **Skill chain visualization** — Graph of barter chains (A→B→C→A)
- **Admin dashboard** — Full analytics panel with Recharts
- **Rate limiting** — express-rate-limit to prevent spam
- **File uploads** — Cloudinary for avatars and deliverable attachments
- **Mobile app** — React Native sharing the same backend
