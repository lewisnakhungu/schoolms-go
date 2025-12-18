# SchoolMS - School Management System

A multi-tenant school management system built with Go (Gin) and React (TypeScript).

## Quick Start

### Backend
```bash
./run_backend.sh
```

### Frontend
```bash
cd frontend && npm run dev
```

### Default Superadmin Credentials
- **Email:** `super@school.com`
- **Password:** `SuperPassword123!`

---

## API Reference

Base URL: `http://localhost:8080/api/v1`

### Authentication

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/auth/signup` | Register with invite code | None |
| `POST` | `/auth/login` | Login and get JWT token | None |

**POST /auth/signup**
```json
{
  "email": "student@school.com",
  "password": "password123",
  "invite_code": "uuid-invite-code"
}
```

**POST /auth/login**
```json
{
  "email": "admin@school.com",
  "password": "password123"
}
```

---

### Superadmin Routes
*Requires: `SUPERADMIN` role*

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/superadmin/schools` | List all schools |
| `POST` | `/superadmin/schools` | Create school + admin |

**POST /superadmin/schools**
```json
{
  "name": "Tech High School",
  "address": "123 Main St",
  "contact_info": "info@techhigh.edu",
  "admin_email": "admin@techhigh.edu"
}
```

---

### Invite Management
*Requires: `SCHOOLADMIN` role*

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/invites` | List school's invites |
| `POST` | `/invites` | Create invite code |

**POST /invites**
```json
{
  "role": "STUDENT"  // or "TEACHER"
}
```

---

### Class Management
*Requires: `SCHOOLADMIN` role*

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/classes` | List school's classes |
| `POST` | `/classes` | Create a class |

**POST /classes**
```json
{
  "name": "Grade 10A",
  "teacher_id": 5
}
```

---

### Student Management
*Requires: `SCHOOLADMIN` or `TEACHER` role*

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/students` | List school's students |
| `PUT` | `/students/:id` | Update student (assign class) |

**PUT /students/:id**
```json
{
  "class_id": 1
}
```

---

### Finance
*Requires: `SCHOOLADMIN` or `TEACHER` role*

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/finance/fees` | Create fee structure |
| `POST` | `/finance/payments` | Record a payment |
| `GET` | `/finance/students/:id/balance` | Get student balance |

**POST /finance/fees**
```json
{
  "class_id": 1,
  "amount": 500.00,
  "academic_year": "2024"
}
```

**POST /finance/payments**
```json
{
  "student_id": 1,
  "amount": 200.00,
  "method": "CASH",
  "reference": "REC-001"
}
```

---

### Reports
*Requires: `SCHOOLADMIN` role*

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/reports/defaulters` | List fee defaulters (JSON) |
| `GET` | `/reports/defaulters/print` | Printable defaulters report (HTML) |

---

## Tech Stack

**Backend:** Go, Gin, GORM, SQLite/PostgreSQL, JWT  
**Frontend:** React, TypeScript, Tailwind CSS v4, Vite

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DB_HOST` | PostgreSQL host | *(uses SQLite if not set)* |
| `DB_USER` | PostgreSQL user | - |
| `DB_PASSWORD` | PostgreSQL password | - |
| `DB_NAME` | PostgreSQL database | - |
| `DB_PORT` | PostgreSQL port | `5432` |
| `JWT_SECRET` | JWT signing secret | `dev-secret...` |
| `SUPERADMIN_EMAIL` | Initial superadmin email | - |
| `SUPERADMIN_PASSWORD` | Initial superadmin password | - |
| `PORT` | Server port | `8080` |
