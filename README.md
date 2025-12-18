<p align="center">
  <h1 align="center">🎓 SchoolMS</h1>
  <p align="center">
    <strong>A Modern Multi-Tenant School Management System</strong>
  </p>
  <p align="center">
    Built with Go (Gin) + React (TypeScript) + Tailwind CSS
  </p>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Go-1.21+-00ADD8?style=for-the-badge&logo=go&logoColor=white" alt="Go" />
  <img src="https://img.shields.io/badge/React-18+-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind-4.0-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind" />
  <img src="https://img.shields.io/badge/PostgreSQL-15+-336791?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker" />
</p>

---

## 📋 Overview

**SchoolMS** is a full-stack, production-ready school management system designed for multi-tenant SaaS deployment. It enables educational institutions to manage students, classes, finances, and generate reports—all within a secure, role-based access control system.

### ✨ Key Features

| Feature | Description |
|---------|-------------|
| 🏫 **Multi-Tenant Architecture** | Each school operates in complete isolation with their own data |
| 🔐 **Role-Based Access Control** | SuperAdmin, SchoolAdmin, Teacher, and Student roles |
| 📧 **Invite Code System** | Secure onboarding via time-limited invite codes |
| 💰 **Finance Management** | Fee structures, payment tracking, and balance calculations |
| 📊 **Reports & Analytics** | Defaulter reports with print-friendly HTML export |
| 🎨 **Modern UI/UX** | Premium design with Tailwind CSS v4 and responsive layout |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (React)                        │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌────────────┐ │
│  │   Login     │ │  Dashboard  │ │   Finance   │ │  Reports   │ │
│  └─────────────┘ └─────────────┘ └─────────────┘ └────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │ REST API (JWT Auth)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Backend (Go + Gin)                         │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌────────────┐ │
│  │ Middleware  │ │   Routes    │ │   Models    │ │   Utils    │ │
│  │  (Auth)     │ │  (API)      │ │  (GORM)     │ │  (JWT)     │ │
│  └─────────────┘ └─────────────┘ └─────────────┘ └────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Database (PostgreSQL/SQLite)                 │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌───────────┐  │
│  │ Schools │ │  Users  │ │ Classes │ │ Students│ │  Payments │  │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └───────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📁 Project Structure

```
schoolms-go/
├── 📂 backend/                  # Go Backend API
│   ├── 📂 middleware/           # HTTP Middleware
│   │   └── auth.go              # JWT Auth & Role Guards
│   ├── 📂 models/               # Database Models (GORM)
│   │   ├── db.go                # Database Connection
│   │   ├── user.go              # User Model
│   │   ├── school.go            # School Model
│   │   ├── class_student.go     # Class & Student Models
│   │   ├── finance.go           # Fee & Payment Models
│   │   └── invite.go            # Invite Code Model
│   ├── 📂 routes/               # API Route Handlers
│   │   ├── auth.go              # /auth/* endpoints
│   │   ├── superadmin.go        # /superadmin/* endpoints
│   │   ├── invite.go            # /invites/* endpoints
│   │   ├── class.go             # /classes/* endpoints
│   │   ├── student.go           # /students/* endpoints
│   │   ├── finance.go           # /finance/* endpoints
│   │   └── reports.go           # /reports/* endpoints
│   ├── 📂 utils/                # Utility Functions
│   │   ├── jwt.go               # JWT Token Generation
│   │   ├── seeder.go            # Database Seeder
│   │   └── errors.go            # Custom Error Types
│   ├── main.go                  # Application Entry Point
│   ├── Dockerfile               # Docker Image Build
│   └── swagger.yml              # API Documentation
│
├── 📂 frontend/                 # React Frontend Application
│   ├── 📂 src/
│   │   ├── 📂 context/          # React Context (Auth)
│   │   ├── 📂 layouts/          # Dashboard Layout
│   │   ├── 📂 pages/            # Page Components
│   │   │   ├── Login.tsx
│   │   │   ├── Signup.tsx
│   │   │   ├── SuperAdminDashboard.tsx
│   │   │   ├── SchoolAdminDashboard.tsx
│   │   │   ├── StudentDashboard.tsx
│   │   │   ├── ClassesPage.tsx
│   │   │   ├── StudentsPage.tsx
│   │   │   ├── FinancePage.tsx
│   │   │   └── ReportsPage.tsx
│   │   ├── 📂 services/         # API Client (Axios)
│   │   ├── index.css            # Tailwind + Theme
│   │   └── main.tsx             # App Entry Point
│   ├── package.json
│   └── vite.config.ts
│
├── docker-compose.yml           # Docker Compose Config
├── LICENSE                      # MIT License
└── README.md                    # This File
```

---

## 🚀 Quick Start

### Prerequisites

- **Go** 1.21+
- **Node.js** 18+
- **PostgreSQL** 15+ (optional, SQLite used by default)

### Option 1: Local Development

```bash
# Clone the repository
git clone https://github.com/lewisnakhungu/schoolms-go.git
cd schoolms-go

# Start the backend
cd backend && ./run_backend.sh

# In a new terminal, start the frontend
cd frontend && npm install && npm run dev
```

### Option 2: Docker Compose

```bash
docker-compose up --build
```

### Default Credentials

| Role | Email | Password |
|------|-------|----------|
| **SuperAdmin** | `super@school.com` | `SuperPassword123!` |

---

## 🔑 User Roles & Permissions

| Role | Capabilities |
|------|-------------|
| **SuperAdmin** | Create schools, create school admins, view all schools |
| **SchoolAdmin** | Manage classes, students, teachers, fees, payments, reports |
| **Teacher** | View students, record payments (future: grades) |
| **Student** | View own dashboard, fee balance, payment history |

---

## 📡 API Endpoints

### Authentication
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/auth/signup` | Register with invite code | ❌ |
| `POST` | `/auth/login` | Login and get JWT | ❌ |

### SuperAdmin
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/superadmin/schools` | List all schools |
| `POST` | `/superadmin/schools` | Create school + admin |

### School Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/invites` | List invite codes |
| `POST` | `/invites` | Create invite code |
| `GET` | `/classes` | List classes |
| `POST` | `/classes` | Create class |
| `GET` | `/students` | List students |
| `PUT` | `/students/:id` | Assign student to class |

### Finance
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/finance/fees` | Create fee structure |
| `POST` | `/finance/payments` | Record payment |
| `GET` | `/finance/students/:id/balance` | Get student balance (admin) |
| `GET` | `/finance/my-balance` | Get own balance (student) |

### Reports
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/reports/defaulters` | List fee defaulters (JSON) |
| `GET` | `/reports/defaulters/print` | Printable report (HTML) |

---

## 🛠️ Tech Stack

### Backend
| Technology | Purpose |
|------------|---------|
| **Go 1.21+** | Backend language |
| **Gin** | HTTP web framework |
| **GORM** | ORM for database operations |
| **JWT** | Authentication tokens |
| **PostgreSQL/SQLite** | Database |

### Frontend
| Technology | Purpose |
|------------|---------|
| **React 18** | UI framework |
| **TypeScript** | Type safety |
| **Tailwind CSS v4** | Styling |
| **Vite** | Build tool |
| **Axios** | HTTP client |
| **Lucide React** | Icons |

---

## 🔒 Security Features

- ✅ **JWT Authentication** with configurable expiry
- ✅ **Password Hashing** using bcrypt
- ✅ **Role-Based Access Control** at middleware level
- ✅ **Multi-Tenant Isolation** - data scoped by school_id
- ✅ **Invite Code System** - time-limited with single-use
- ✅ **CORS Configuration** for API security

---

## 📊 Database Schema

```
┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│   Schools    │───────│    Users     │───────│   Invites    │
│──────────────│       │──────────────│       │──────────────│
│ id           │       │ id           │       │ id           │
│ name         │       │ email        │       │ code (UUID)  │
│ address      │       │ password_hash│       │ role         │
│ contact_info │       │ role         │       │ school_id    │
│ subscription │       │ school_id    │       │ expires_at   │
└──────────────┘       └──────────────┘       │ is_used      │
       │                      │               └──────────────┘
       │                      │
       ▼                      ▼
┌──────────────┐       ┌──────────────┐
│   Classes    │───────│   Students   │
│──────────────│       │──────────────│
│ id           │       │ id           │
│ name         │       │ user_id      │
│ school_id    │       │ school_id    │
│ teacher_id   │       │ class_id     │
└──────────────┘       │ enrollment_# │
       │               └──────────────┘
       │                      │
       ▼                      ▼
┌──────────────┐       ┌──────────────┐
│ FeeStructures│       │   Payments   │
│──────────────│       │──────────────│
│ id           │       │ id           │
│ class_id     │       │ student_id   │
│ amount       │       │ amount       │
│ academic_year│       │ method       │
│ school_id    │       │ reference    │
└──────────────┘       │ school_id    │
                       └──────────────┘
```

---

## 🌍 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DB_HOST` | PostgreSQL host | SQLite if not set |
| `DB_USER` | PostgreSQL user | - |
| `DB_PASSWORD` | PostgreSQL password | - |
| `DB_NAME` | PostgreSQL database | - |
| `DB_PORT` | PostgreSQL port | `5432` |
| `JWT_SECRET` | JWT signing secret | Auto-generated |
| `SUPERADMIN_EMAIL` | Initial superadmin | `super@school.com` |
| `SUPERADMIN_PASSWORD` | Initial password | `SuperPassword123!` |
| `PORT` | Server port | `8080` |

---

## 🧪 Testing the API

```bash
# Run the test script
./test_api.sh
```

Or use the included `swagger.yml` with any OpenAPI client.

---

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

---

## 👨‍💻 Author

**Lewis Nakhungu**

- GitHub: [@lewisnakhungu](https://github.com/lewisnakhungu)

---

<p align="center">
  <strong>Built with ❤️ for educational excellence</strong>
</p>
