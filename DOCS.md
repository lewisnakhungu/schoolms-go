# SchoolMS - Feature Documentation & Maintenance Guide

> **Kenya & TVET Edition** - Comprehensive School Management System

---

## Table of Contents

1. [System Overview](#system-overview)
2. [User Roles](#user-roles)
3. [Core Features](#core-features)
4. [Kenya-Specific Features](#kenya-specific-features)
5. [API Reference](#api-reference)
6. [Frontend Pages](#frontend-pages)
7. [Testing Guide](#testing-guide)
8. [Maintenance Procedures](#maintenance-procedures)
9. [Troubleshooting](#troubleshooting)

---

## System Overview

### Architecture
```
┌─────────────────────────────────────────────────────────────────┐
│                     Frontend (React + TypeScript)               │
│    Port: 5173 (dev)  |  Styled with Tailwind CSS v4             │
└─────────────────────────────────────────────────────────────────┘
                              │ REST API + JWT
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Backend (Go + Gin)                         │
│    Port: 8080  |  JWT Auth  |  GORM ORM                         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                 Database (PostgreSQL / SQLite)                  │
│    Multi-tenant via school_id scoping                           │
└─────────────────────────────────────────────────────────────────┘
```

### Running the System

```bash
# Backend (Terminal 1)
cd backend && ./run_backend.sh

# Frontend (Terminal 2)  
cd frontend && npm run dev
```

### Default Credentials

| Role | Email | Password |
|------|-------|----------|
| SuperAdmin | super@school.com | SuperPassword123! |

---

## User Roles

### 1. SuperAdmin
**Purpose**: System-wide administration across all schools

**Capabilities**:
- Create and manage schools
- Create SchoolAdmin accounts
- View all schools' data
- Manage system-wide tickets
- Generate invite codes for admins

**Dashboard**: `SuperAdminDashboard.tsx`

---

### 2. SchoolAdmin
**Purpose**: Full control of a single school

**Capabilities**:
- Manage students, teachers, classes
- Configure fee structures and vote heads
- Mark attendance (bulk operations)
- Manage timetables
- Send notifications to users
- View finance dashboards
- Import students via CSV/Excel
- Generate invite codes for staff

**Dashboard**: `SchoolAdminDashboard.tsx`

---

### 3. Teacher
**Purpose**: Classroom management

**Capabilities**:
- Mark attendance for assigned classes
- Enter grades for subjects they teach
- Upload class content/materials
- View class roster

**Dashboard**: `TeacherDashboard.tsx`

---

### 4. Finance
**Purpose**: Financial operations

**Capabilities**:
- Record payments
- View fee balances
- Generate defaulter reports
- View payment history
- **Print receipts (Thermal & A4 PDF)**
- Finance analytics dashboard

**Dashboard**: `FinanceDashboard.tsx`

---

### 5. Parent
**Purpose**: Monitor children's progress

**Capabilities**:
- View linked children's profiles
- Check attendance records
- View grades and report cards
- Check fee balance status
- Submit support tickets

**Dashboard**: `ParentDashboard.tsx`

---

### 6. Student
**Purpose**: Access own academic data

**Capabilities**:
- View grades
- View timetable
- Access class materials
- Submit support tickets
- View notifications

**Dashboard**: `StudentDashboard.tsx`

---

## Core Features

### 1. Authentication & Authorization

**Files**:
- Backend: `routes/auth.go`
- Frontend: `context/AuthContext.tsx`, `pages/Login.tsx`, `pages/Signup.tsx`

**How it works**:
1. User enters email/password on login page
2. Backend verifies credentials and returns JWT token
3. Token stored in localStorage
4. Token sent with every API request via Axios interceptor
5. Backend middleware validates token and extracts role

**Signup Flow**:
1. Admin generates invite code (time-limited, single-use)
2. New user enters invite code + email + password
3. Backend validates invite code validity
4. User account created with role from invite code

**Maintenance**:
```bash
# Invite codes expire after configured time
# Check backend/models/invite.go for expiry settings
```

---

### 2. Attendance Management

**Files**:
- Backend: `routes/attendance.go`
- Frontend: `pages/AttendancePage.tsx`

**Features**:
- Select class and date
- Mark individual student attendance (Present/Absent/Late)
- Bulk mark all as present
- View statistics (present/absent/late counts)
- Historical attendance view

**API Endpoints**:
```bash
POST /api/v1/attendance/mark         # Mark single student
POST /api/v1/attendance/bulk         # Bulk mark class
GET  /api/v1/attendance/class/:id    # Get class attendance
GET  /api/v1/attendance/stats        # Attendance statistics
```

---

### 3. Timetable Management

**Files**:
- Backend: `routes/timetable.go`
- Frontend: `pages/TimetablePage.tsx`

**Features**:
- Weekly grid view (Mon-Fri)
- 8 periods per day
- Add/Edit/Delete periods
- Assign subject and teacher
- Color-coded subjects

**API Endpoints**:
```bash
GET    /api/v1/timetable          # Get all periods
POST   /api/v1/timetable          # Create period
PUT    /api/v1/timetable/:id      # Update period
DELETE /api/v1/timetable/:id      # Delete period
```

---

### 4. Finance Management

**Files**:
- Backend: `routes/finance.go`
- Frontend: `pages/FinancePage.tsx`, `pages/FinanceDashboard.tsx`

**Features**:
- Fee structures per class/term
- Record payments
- Track balances
- Defaulter reports
- Payment history

**API Endpoints**:
```bash
POST /api/v1/finance/fees            # Create fee structure
POST /api/v1/finance/payments        # Record payment
GET  /api/v1/finance/balances        # Get student balances
GET  /api/v1/finance/dashboard-stats # Finance overview
GET  /api/v1/finance/receipts/:id    # Get receipt (A4 PDF)
GET  /api/v1/finance/receipts/:id/thermal  # Thermal printer format
```

**Receipt Features**:
- School logo and header
- Vote head breakdown showing allocation
- Payment method (Cash/M-PESA/Bank)
- "Served By" signature line
- Unique receipt number
- Thermal (58mm/80mm) and A4 PDF formats

---

### 5. Grades Management

**Files**:
- Backend: `routes/student.go` (grades section)
- Frontend: `pages/GradesPage.tsx`

**Features**:
- Enter grades per subject/term
- View student report cards
- Calculate averages
- Rank students

---

### 6. Class Content (Materials)

**Files**:
- Backend: `routes/content.go`
- Frontend: `pages/ClassContentPage.tsx`

**Features**:
- Teachers upload materials
- File storage
- Students access materials by class

---

### 7. Support Tickets

**Files**:
- Backend: `routes/tickets.go`
- Frontend: `pages/TicketsPage.tsx`, `pages/StudentSupportPage.tsx`

**Features**:
- Students/parents submit tickets
- Admin responds
- Status tracking (Open/In Progress/Closed)

---

### 8. Notifications

**Files**:
- Backend: `routes/notifications.go`
- Frontend: `pages/NotificationsPage.tsx`

**Features**:
- Admin sends notifications
- Target: All users, specific role, specific class
- Read/unread status
- In-app notification bell

---

### 9. Analytics Dashboard

**Files**:
- Backend: `routes/analytics.go`
- Frontend: `components/Charts.tsx`, dashboards

**Features**:
- Enrollment trends
- Finance charts
- Attendance rates
- Revenue vs expenses

---

### 10. Audit Logs & Compliance

**Files**:
- Backend: `models/audit.go`
- Frontend: `pages/AuditLogPage.tsx` *(planned)*

**Purpose**: System integrity and accountability for principals and auditors.

**What is logged**:
| Action | Description |
|--------|-------------|
| `CREATE_PAYMENT` | New payment recorded |
| `DELETE_PAYMENT` | Payment deleted/reversed |
| `UPDATE_FEE_STRUCTURE` | Fee structure modified |
| `UPDATE_GRADE` | Student grade changed |
| `DELETE_STUDENT` | Student record deleted |
| `LOGIN` | User login (success/failure) |
| `ROLE_CHANGE` | User role modification |

**Audit Log Entry Structure**:
```json
{
  "id": 1,
  "user_id": 5,
  "action": "UPDATE_GRADE",
  "entity_type": "Grade",
  "entity_id": 123,
  "old_value": "{\"score\": 75}",
  "new_value": "{\"score\": 85}",
  "ip_address": "192.168.1.10",
  "created_at": "2024-12-19T10:30:00Z"
}
```

**API Endpoints**:
```bash
GET /api/v1/audit-logs               # List logs (Admin only)
GET /api/v1/audit-logs/export        # Export for external auditors
```

**Filtering Options**:
- By User
- By Action Type
- By Date Range
- By Entity Type

**Maintenance**:
- Logs are immutable (cannot be deleted)
- Retention period: Configurable in `models/audit.go`
- Export to CSV/PDF for TSC or Ministry audits

---

### 11. Internal Memos (Official Communications)

**Files**:
- Backend: `routes/memos.go` *(planned)*
- Frontend: `pages/MemosPage.tsx` *(planned)*

**Purpose**: Distinguish official administrative communications from simple notifications.

**Memos vs Notifications**:
| Memos | Notifications |
|-------|---------------|
| Official documents | Simple alerts |
| Rich text (formatting) | Plain text |
| Attachments (PDFs, circulars) | No attachments |
| Requires acknowledgment | Read status only |
| Example: "2025 Fee Structure" | Example: "Meeting at 2pm" |

**Features**:
- Rich text editor (bold, lists, tables)
- File attachments (Ministry circulars, exam schedules)
- Target: All staff, specific department, all parents
- Acknowledgment tracking (who has read)
- Archive and search

**Use Cases**:
- Ministry of Education circulars
- New fee structure announcements
- Exam schedules with timetable PDF
- Staff policy updates

**API Endpoints**:
```bash
GET    /api/v1/memos               # List memos
POST   /api/v1/memos               # Create memo
GET    /api/v1/memos/:id           # Get memo with attachments
POST   /api/v1/memos/:id/acknowledge # Mark as read
```

---

## Kenya-Specific Features

### 1. Vote Head Accounting

**Files**:
- Backend: `routes/vote_head.go`, `services/vote_head_allocation.go`
- Frontend: `pages/VoteHeadPage.tsx`

**What is it?**
Kenya schools allocate fees to specific "vote heads" (Tuition, R&MI, Activity, etc.) in priority order.

**How it works**:
1. Admin creates vote heads with priorities (1 = highest)
2. When payment comes in, funds allocated to vote head 1 first
3. Once vote head 1 is cleared, remaining goes to vote head 2
4. Overpayment creates credit (negative balance)

**API Endpoints**:
```bash
GET    /api/v1/vote-heads              # List vote heads
POST   /api/v1/vote-heads              # Create vote head
PUT    /api/v1/vote-heads/:id          # Update vote head
DELETE /api/v1/vote-heads/:id          # Deactivate
PUT    /api/v1/vote-heads/reorder      # Change priority order
GET    /api/v1/vote-heads/balance/:id  # Student vote head breakdown
```

**Maintenance**:
- Inactive vote heads are excluded from payment allocation
- Priority order determines allocation sequence
- View `services/vote_head_allocation.go` for allocation logic

---

### 2. M-PESA Integration

**Files**:
- Backend: `routes/mpesa.go`
- Model: `models/vote_head.go` (MPESATransaction)

**What is it?**
Safaricom M-PESA C2B (Customer to Business) integration for receiving mobile money payments.

**How it works**:
1. Parent pays via M-PESA to school paybill
2. Safaricom sends validation request to `/api/v1/mpesa/validation`
3. Backend validates student admission number in BillRefNumber
4. Safaricom sends confirmation to `/api/v1/mpesa/confirmation`
5. Payment recorded and allocated to vote heads automatically

**Environment Variables**:
```bash
MPESA_CONSUMER_KEY=your_consumer_key
MPESA_CONSUMER_SECRET=your_consumer_secret
MPESA_SHORTCODE=your_paybill_number
MPESA_PASSKEY=your_passkey
MPESA_CALLBACK_URL=https://yourserver.com/api/v1/mpesa
```

**Maintenance**:
- Register C2B URLs on Safaricom Daraja portal
- Test in sandbox before production
- Monitor `mpesa_transactions` table for failed payments
- **Certificate Rotation**: Safaricom passkeys/certificates expire periodically. If payments fail with "Initiator Authentication Error", regenerate security credentials on Daraja portal.
- Check certificate expiry dates quarterly

---

### 3. TVET (Technical Vocational) Support

**Files**:
- Backend: `routes/tvet.go`, `models/tvet.go`
- Frontend: `pages/IndustrialAttachmentPage.tsx`

**What is it?**
Features specific to Technical and Vocational Education Training institutions.

**Features**:
- Intake Groups (instead of just classes)
- Courses and Modules
- Industrial Attachments tracking
  - Company information
  - Supervisor details
  - Status (Planned/Ongoing/Completed)
  - Grading (Logbook, Supervisor, Final)

**API Endpoints**:
```bash
# Intake Groups
GET/POST /api/v1/tvet/intakes

# Courses
GET/POST /api/v1/tvet/courses

# Modules
GET/POST /api/v1/tvet/modules

# Industrial Attachments
GET    /api/v1/tvet/attachments
POST   /api/v1/tvet/attachments
PUT    /api/v1/tvet/attachments/:id
```

---

### 4. SMS Gateway (Africa's Talking)

**Files**:
- Backend: `services/sms.go`, `routes/sms.go`
- Model: `models/audit.go` (SMSLog)

**What is it?**
Send SMS notifications to parents for fee reminders, attendance alerts, etc.

**Features**:
- Single SMS
- Bulk SMS to class/school
- Fee reminder templates
- SMS delivery logging

**Environment Variables**:
```bash
AT_API_KEY=your_africas_talking_api_key
AT_USERNAME=your_username
AT_SENDER_ID=your_sender_id  # Optional
```

**API Endpoints**:
```bash
POST /api/v1/sms/send              # Send single SMS
POST /api/v1/sms/broadcast         # Bulk SMS
POST /api/v1/sms/fee-reminder      # Auto fee reminders
```

---

### 5. Excel/CSV Import

**Files**:
- Backend: `routes/import.go`
- Frontend: `pages/ImportPage.tsx`

**What is it?**
Bulk import students from Excel or CSV files.

**How it works**:
1. Upload CSV/Excel file
2. Preview endpoint validates and shows preview
3. If valid, confirm import
4. Students created with default password

**Required Columns**:
- `adm_no` - Admission number (required)
- `name` or `student_name` (required)
- `email` (optional, auto-generated if missing)
- `class_name` (optional)
- `phone` (optional)

**API Endpoints**:
```bash
POST /api/v1/import/students/preview   # Validate and preview
POST /api/v1/import/students/confirm   # Execute import
```

**Default Password**: `changeme123`

---

## API Reference

### Authentication Header
All protected routes require:
```
Authorization: Bearer <jwt_token>
```

### Response Format
```json
{
  "data": { ... },
  "error": "Error message if any",
  "message": "Success message"
}
```

### Complete Endpoint List

| Module | Method | Endpoint | Description |
|--------|--------|----------|-------------|
| **Auth** | POST | /auth/signup | Register with invite code |
| | POST | /auth/login | Login, returns JWT |
| **Students** | GET | /students | List students |
| | POST | /students | Create student |
| | PUT | /students/:id | Update student |
| | DELETE | /students/:id | Delete student |
| **Classes** | GET | /classes | List classes |
| | POST | /classes | Create class |
| **Attendance** | POST | /attendance/mark | Mark attendance |
| | POST | /attendance/bulk | Bulk mark |
| | GET | /attendance/class/:id | Get class attendance |
| **Timetable** | GET | /timetable | Get all periods |
| | POST | /timetable | Create period |
| | PUT | /timetable/:id | Update period |
| | DELETE | /timetable/:id | Delete period |
| **Finance** | POST | /finance/fees | Create fee structure |
| | POST | /finance/payments | Record payment |
| | GET | /finance/balances | Get balances |
| **Vote Heads** | GET | /vote-heads | List vote heads |
| | POST | /vote-heads | Create vote head |
| | PUT | /vote-heads/reorder | Change priorities |
| **TVET** | GET | /tvet/attachments | List attachments |
| | POST | /tvet/attachments | Create attachment |
| **Import** | POST | /import/students/preview | Preview import |
| | POST | /import/students/confirm | Execute import |
| **SMS** | POST | /sms/send | Send SMS |
| | POST | /sms/broadcast | Bulk SMS |
| **M-PESA** | POST | /mpesa/validation | C2B validation |
| | POST | /mpesa/confirmation | C2B confirmation |

---

## Frontend Pages

| Page | Route | Purpose |
|------|-------|---------|
| LandingPage | / | Public landing page |
| Login | /login | User authentication |
| Signup | /signup | User registration |
| DashboardHome | /dashboard | Role-specific dashboard |
| StudentsPage | /dashboard/students | Manage students |
| ClassesPage | /dashboard/classes | Manage classes |
| AttendancePage | /dashboard/attendance | Mark attendance |
| TimetablePage | /dashboard/timetable | Manage schedule |
| FinancePage | /dashboard/finance | Payments & fees |
| VoteHeadPage | /dashboard/vote-heads | Kenya vote heads |
| ImportPage | /dashboard/import | CSV/Excel import |
| IndustrialAttachmentPage | /dashboard/attachments | TVET attachments |
| GradesPage | /dashboard/grades | Student grades |
| NotificationsPage | /dashboard/notifications | Send notifications |
| ReportsPage | /dashboard/reports | Generate reports |
| TicketsPage | /dashboard/tickets | Support tickets |

---

## Testing Guide

### Run All Tests

```bash
# Frontend Component Tests (164 tests)
cd frontend && npm run test

# Frontend E2E Tests (22 tests)
cd frontend && npm run test:e2e

# Backend Service Tests (9 tests)
cd backend && go test ./services/... -v
```

### Test Locations

| Type | Location | Count |
|------|----------|-------|
| Login | frontend/src/pages/Login.test.tsx | 26 |
| Signup | frontend/src/pages/Signup.test.tsx | 36 |
| VoteHead | frontend/src/pages/VoteHeadPage.test.tsx | 28 |
| Import | frontend/src/pages/ImportPage.test.tsx | 24 |
| Attachments | frontend/src/pages/IndustrialAttachmentPage.test.tsx | 8 |
| Attendance | frontend/src/pages/AttendancePage.test.tsx | 6 |
| Toast | frontend/src/components/Toast.test.tsx | 10 |
| AuthContext | frontend/src/context/AuthContext.test.tsx | 24 |
| API | frontend/src/services/api.test.ts | 13 |
| E2E | frontend/e2e/*.spec.ts | 22 |
| Backend | backend/services/vote_head_allocation_test.go | 9 |

---

## Maintenance Procedures

### 1. Adding a New User Role

1. Update `models/user.go` - add role constant
2. Update `middleware/auth.go` - add role to RBAC rules
3. Update `frontend/src/context/AuthContext.tsx` - add role type
4. Update `frontend/src/layouts/DashboardLayout.tsx` - add sidebar items
5. Create new dashboard page `frontend/src/pages/NewRoleDashboard.tsx`
6. Update routing in `frontend/src/main.tsx`

### 2. Adding a New API Endpoint

1. Create handler in `backend/routes/feature.go`
2. Register route in `backend/main.go`
3. Add any new models in `backend/models/`
4. Run migrations: models auto-migrate on startup
5. Add tests in `backend/routes/feature_test.go`

### 3. Adding a New Frontend Page

1. Create component in `frontend/src/pages/NewPage.tsx`
2. Add route in `frontend/src/main.tsx`
3. Add sidebar item in `frontend/src/layouts/DashboardLayout.tsx`
4. Create tests in `frontend/src/pages/NewPage.test.tsx`

### 4. Database Migrations

GORM handles migrations automatically on startup:
```go
// backend/models/db.go
db.AutoMigrate(&User{}, &Student{}, &NewModel{}, ...)
```

For manual migrations:
```bash
# PostgreSQL
psql -h localhost -U postgres -d schoolms

# SQLite (dev)
sqlite3 backend/schoolms.db
```

### 5. Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| DB_HOST | Production | PostgreSQL host |
| DB_USER | Production | Database user |
| DB_PASSWORD | Production | Database password |
| DB_NAME | Production | Database name |
| JWT_SECRET | Yes | JWT signing key |
| MPESA_* | Optional | M-PESA integration |
| AT_* | Optional | Africa's Talking SMS |

---

## Troubleshooting

### Common Issues

**1. CORS Errors**
```bash
# Check backend/main.go CORS configuration
# Ensure frontend URL is whitelisted
```

**2. JWT Token Expired**
```bash
# User will be redirected to login
# Token expiry configured in backend/routes/auth.go
```

**3. Database Connection Failed**
```bash
# Check DATABASE_URL or DB_* environment variables
# For dev, SQLite file should be in backend/
```

**4. M-PESA Callbacks Not Working**
```bash
# Ensure server is publicly accessible
# Check Daraja portal for registered URLs
# View mpesa_transactions table for errors
```

**5. SMS Not Sending**
```bash
# Check Africa's Talking API credentials
# View sms_logs table for delivery status
# Check AT dashboard for errors
```

**6. Import Failing**
```bash
# Check file format (CSV/XLSX)
# Ensure required columns exist
# Check for duplicate admission numbers
# For large files (>1000 rows), consider chunked import
```

**7. M-PESA Certificate/Passkey Expired**
```bash
# Error: "Initiator Authentication Error" or "Bad Request"
# Solution:
# 1. Login to Daraja portal (developer.safaricom.co.ke)
# 2. Go to your app > Security Credentials
# 3. Generate new credentials
# 4. Update MPESA_PASSKEY in environment variables
# 5. Restart backend server
```

**8. Large Excel Import Timeout**
```bash
# For files with >1000 rows:
# 1. Split into multiple smaller files
# 2. Or use batch import feature
# Future: Queue-based background processing (planned)
```

---

## File Structure Reference

```
schoolms-go/
├── backend/
│   ├── main.go              # Entry point, route registration
│   ├── middleware/
│   │   └── auth.go          # JWT + RBAC middleware
│   ├── models/
│   │   ├── db.go            # Database connection + migrations
│   │   ├── user.go          # User, School models
│   │   ├── vote_head.go     # Kenya vote heads
│   │   ├── tvet.go          # TVET models
│   │   └── audit.go         # Audit logs, SMS logs
│   ├── routes/
│   │   ├── auth.go          # Login, signup
│   │   ├── student.go       # Student CRUD + grades
│   │   ├── attendance.go    # Attendance marking
│   │   ├── finance.go       # Fees, payments
│   │   ├── vote_head.go     # Vote head management
│   │   ├── mpesa.go         # M-PESA callbacks
│   │   ├── tvet.go          # TVET routes
│   │   ├── sms.go           # SMS sending
│   │   └── import.go        # CSV/Excel import
│   └── services/
│       ├── vote_head_allocation.go  # Payment allocation logic
│       └── sms.go                   # SMS service
├── frontend/
│   ├── src/
│   │   ├── main.tsx         # React entry + routing
│   │   ├── context/
│   │   │   └── AuthContext.tsx  # Auth state management
│   │   ├── layouts/
│   │   │   └── DashboardLayout.tsx  # Sidebar + navigation
│   │   ├── pages/           # All page components
│   │   ├── components/
│   │   │   ├── Toast.tsx    # Notifications
│   │   │   └── Charts.tsx   # Analytics charts
│   │   └── services/
│   │       └── api.ts       # Axios instance
│   └── e2e/                 # Playwright E2E tests
└── DOCS.md                  # This file
```

---

## Contact & Support

For issues or questions:
- GitHub: [@lewisnakhungu](https://github.com/lewisnakhungu)
- Repository: [schoolms-go](https://github.com/lewisnakhungu/schoolms-go)

---

*Last Updated: December 2024*
