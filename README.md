<p align="center">
  <h1 align="center">🎓 SchoolMS</h1>
  <p align="center">
    <strong>A Complete Multi-Tenant School Management System</strong>
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
</p>

---

## ✨ Features

| Category | Features |
|----------|----------|
| **👥 User Roles** | SuperAdmin, SchoolAdmin, Teacher, Finance, Parent, Student |
| **📋 Attendance** | Daily marking, bulk operations, statistics, reports |
| **📅 Timetable** | Class schedules, weekly grid view, period management |
| **💰 Finance** | Fee structures, payments, defaulter reports, balance tracking |
| **👪 Parent Portal** | View children's grades, attendance, and fee status |
| **🎫 Support** | Ticket system with admin responses |
| **🔔 Notifications** | Admin-to-user notifications with read status |
| **📊 Analytics** | Enrollment trends, finance charts, attendance rates |
| **📁 Content** | Class materials, file uploads for teachers |
| **📝 Grades** | Subject grades, terms, report cards |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Frontend (React + TypeScript)               │
│  Landing | Dashboard | Attendance | Timetable | Finance | More  │
└────────────────────────────────────────────────────────────────┘
                              │ REST API + JWT
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Backend (Go + Gin)                         │
│  Auth | Students | Classes | Finance | Reports | Analytics      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                 Database (PostgreSQL / SQLite)                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start

### Prerequisites
- **Go** 1.21+
- **Node.js** 18+

### Run Locally

```bash
# Clone
git clone https://github.com/lewisnakhungu/schoolms-go.git
cd schoolms-go

# Backend (Terminal 1)
cd backend && ./run_backend.sh

# Frontend (Terminal 2)
cd frontend && npm install && npm run dev
```

### Default Login

| Role | Email | Password |
|------|-------|----------|
| SuperAdmin | `super@school.com` | `SuperPassword123!` |

---

## 👥 User Roles & Permissions

| Role | Dashboard | Capabilities |
|------|-----------|--------------|
| **SuperAdmin** | All Schools | Create schools, manage admins, system tickets |
| **SchoolAdmin** | Full Control | Students, classes, finance, timetable, notifications |
| **Teacher** | My Classes | Attendance, grades, content uploads |
| **Finance** | Finance | Fees, payments, defaulter reports |
| **Parent** | My Children | View grades, attendance, fee status |
| **Student** | My Dashboard | Grades, support tickets, materials |

---

## 📡 API Endpoints

### Core Routes
| Module | Endpoints |
|--------|-----------|
| **Auth** | `POST /auth/signup`, `POST /auth/login` |
| **Students** | `GET/POST/PUT /students` |
| **Classes** | `GET/POST /classes` |
| **Attendance** | `POST /attendance/mark`, `POST /attendance/bulk`, `GET /attendance/class/:id` |
| **Timetable** | `GET/POST/PUT/DELETE /timetable` |
| **Finance** | `POST /finance/fees`, `POST /finance/payments`, `GET /finance/dashboard-stats` |
| **Grades** | `POST /grades`, `GET /grades/my` |
| **Reports** | `GET /reports/defaulters`, `GET /reports/defaulters/print` |
| **Analytics** | `GET /analytics/dashboard`, `/enrollment`, `/finance`, `/attendance` |
| **Tickets** | `POST /tickets`, `GET /tickets`, `PUT /tickets/:id` |
| **Notifications** | `POST/GET /notifications` |
| **Parent Links** | `POST/GET/DELETE /parent-links` |

---

## 🛠️ Tech Stack

### Backend
| Tech | Usage |
|------|-------|
| Go + Gin | REST API |
| GORM | ORM |
| JWT | Authentication |
| PostgreSQL/SQLite | Database |

### Frontend
| Tech | Usage |
|------|-------|
| React 18 + TypeScript | UI |
| Tailwind CSS v4 | Styling |
| Vite | Build |
| Axios | HTTP |
| Lucide React | Icons |
| Framer Motion | Animations |

---

## 📁 Project Structure

```
schoolms-go/
├── backend/
│   ├── middleware/     # Auth, RBAC
│   ├── models/         # GORM models
│   ├── routes/         # API handlers
│   │   ├── auth.go
│   │   ├── student.go
│   │   ├── attendance.go
│   │   ├── timetable.go
│   │   ├── finance.go
│   │   ├── parent.go
│   │   ├── analytics.go
│   │   └── ...
│   └── main.go
│
├── frontend/
│   └── src/
│       ├── components/   # Charts, Toast, etc.
│       ├── context/      # AuthContext
│       ├── layouts/      # DashboardLayout
│       ├── pages/        # All page components
│       │   ├── LandingPage.tsx
│       │   ├── AttendancePage.tsx
│       │   ├── TimetablePage.tsx
│       │   ├── ParentDashboard.tsx
│       │   ├── FinanceDashboard.tsx
│       │   └── ...
│       └── services/     # API client
│
└── docker-compose.yml
```

---

## 🔒 Security

- ✅ JWT Authentication with bcrypt password hashing
- ✅ Role-Based Access Control (6 roles)
- ✅ Multi-Tenant Data Isolation (school_id scoping)
- ✅ Invite Code System (time-limited, single-use)
- ✅ CORS Configuration

---

## 🌍 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DB_HOST` | PostgreSQL host | SQLite |
| `JWT_SECRET` | JWT signing key | Auto-generated |
| `SUPERADMIN_EMAIL` | Initial admin | `super@school.com` |
| `SUPERADMIN_PASSWORD` | Initial password | `SuperPassword123!` |
| `PORT` | Server port | `8080` |

---

## 📝 License

MIT License - See [LICENSE](LICENSE)

---

## 👨‍💻 Author

**Lewis Nakhungu** - [@lewisnakhungu](https://github.com/lewisnakhungu)

---

<p align="center">
  <strong>Built with ❤️ for educational excellence</strong>
</p>
