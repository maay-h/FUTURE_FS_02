# 🚀 Rameez CRM - Lead Management System

A full-stack CRM system with dark navy UI, built with **React + Node.js + SQLite**.

---

## 📁 File Structure

```
crm-app/
├── backend/
│   ├── db/
│   │   ├── database.js     ← SQLite schema & connection
│   │   └── seed.js         ← Seeds users, accounts (from CSV), leads, tasks
│   ├── middleware/
│   │   └── auth.js         ← JWT authentication middleware
│   ├── routes/
│   │   ├── auth.js         ← Login, register, /me endpoints
│   │   ├── leads.js        ← Leads CRUD + kanban + stats
│   │   ├── activities.js   ← Activities CRUD
│   │   ├── tasks.js        ← Tasks CRUD + calendar view
│   │   └── other.js        ← Accounts, users, payments, templates, triggers
│   ├── .env                ← Environment variables
│   ├── package.json
│   └── server.js           ← Express entry point
│
└── frontend/
    ├── public/
    │   └── index.html
    ├── src/
    │   ├── components/
    │   │   ├── Sidebar.js  ← Navigation sidebar
    │   │   └── UI.js       ← Reusable: Modal, Badge, Pagination, etc.
    │   ├── context/
    │   │   └── AuthContext.js  ← Global auth state
    │   ├── pages/
    │   │   ├── Login.js
    │   │   ├── Dashboard.js    ← Charts, stats, KPIs
    │   │   ├── Leads.js        ← Lead list with filters/search/CRUD
    │   │   ├── LeadModal.js    ← Add/Edit lead form
    │   │   ├── KanbanBoard.js  ← Pipeline kanban view
    │   │   ├── Activities.js
    │   │   ├── Tasks.js
    │   │   ├── Calendar.js
    │   │   ├── Customers.js    ← Accounts from CSV
    │   │   └── OtherPages.js   ← Users, Templates, Triggers, Sources, Settings
    │   ├── api.js              ← All Axios API calls
    │   ├── App.js              ← Routes + auth guards
    │   ├── index.js
    │   └── index.css           ← Dark navy CRM theme
    └── package.json
```

---

## ⚙️ Setup Instructions

### Prerequisites
- **Node.js** v18+ ([nodejs.org](https://nodejs.org))
- **npm** v9+

---

### 1️⃣ Backend Setup

```bash
cd crm-app/backend
npm install
```

**Configure environment** (already pre-filled, but review):
```bash
# .env file is already created with defaults
# Change JWT_SECRET in production!
```

**Seed the database** (creates SQLite DB + sample data from CSV):
```bash
npm run seed
```

**Start the backend server:**
```bash
npm run dev        # Development (with nodemon auto-reload)
# OR
npm start          # Production
```

Backend runs on: **http://localhost:5000**

---

### 2️⃣ Frontend Setup

```bash
cd crm-app/frontend
npm install
npm start
```

Frontend runs on: **http://localhost:3000**

> The frontend proxies API calls to `localhost:5000` automatically via the `"proxy"` field in `package.json`.

---

## 🔐 Default Login Credentials

| Role    | Email                | Password     |
|---------|----------------------|--------------|
| Admin   | admin@crm.com        | password123  |
| Manager | manager1@crm.com     | password123  |
| Agent   | agent1@crm.com       | password123  |

---

## 🌐 API Endpoints

### Auth
| Method | Endpoint                  | Description          |
|--------|---------------------------|----------------------|
| POST   | /api/auth/login           | Login                |
| POST   | /api/auth/register        | Create user (admin)  |
| GET    | /api/auth/me              | Current user         |
| PUT    | /api/auth/change-password | Change password      |

### Leads
| Method | Endpoint              | Description               |
|--------|-----------------------|---------------------------|
| GET    | /api/leads            | List with filters & pagination |
| GET    | /api/leads/kanban     | Grouped by status         |
| GET    | /api/leads/stats      | Dashboard KPIs            |
| GET    | /api/leads/:id        | Single lead               |
| POST   | /api/leads            | Create lead               |
| PUT    | /api/leads/:id        | Update lead               |
| DELETE | /api/leads/:id        | Delete lead               |

### Activities, Tasks, Accounts, Users, Payments
All follow standard REST: `GET /api/{resource}`, `POST`, `PUT /:id`, `DELETE /:id`

---

## 🏗️ Tech Stack

| Layer    | Technology                    |
|----------|-------------------------------|
| Frontend | React 18, React Router 6      |
| Charts   | Recharts                      |
| Backend  | Node.js, Express 4            |
| Database | SQLite (via better-sqlite3)   |
| Auth     | JWT (jsonwebtoken + bcryptjs) |
| HTTP     | Axios                         |

---

## 📧 Email Integration (Optional)

To enable actual email sending, add to `.env`:
```env
# Nodemailer SMTP settings (Gmail example)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@gmail.com
SMTP_PASS=your_app_password
EMAIL_FROM=Rameez CRM <your@gmail.com>
```

Then install and use nodemailer:
```bash
npm install nodemailer
```

---

## 🚀 Production Build

```bash
# Build frontend
cd frontend && npm run build

# Serve build from backend (add to server.js):
# app.use(express.static(path.join(__dirname, '../frontend/build')));
```

---

## 🗄️ Database

SQLite database is stored at `backend/db/crm.db`.
To reset and re-seed: delete `crm.db` and run `npm run seed` again.

---

*Built with ❤️ — CRM Lead Management System*
