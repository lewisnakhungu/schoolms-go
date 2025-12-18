# SchoolMS Backend

Go backend API for the SchoolMS School Management System.

## Tech Stack

- **Go 1.21+** with Gin framework
- **GORM** for ORM
- **PostgreSQL** / SQLite database
- **JWT** for authentication
- **bcrypt** for password hashing

## Getting Started

```bash
# Install dependencies
go mod download

# Run the server
go run main.go

# Or use the script
./run_backend.sh
```

## Project Structure

```
backend/
├── main.go              # Application entry point
├── middleware/
│   └── auth.go          # JWT & Role-based auth
├── models/
│   ├── db.go            # Database connection
│   ├── user.go          # User model
│   ├── school.go        # School model
│   ├── class_student.go # Class & Student models
│   ├── finance.go       # Fee & Payment models
│   └── invite.go        # Invite code model
├── routes/
│   ├── auth.go          # Authentication endpoints
│   ├── superadmin.go    # SuperAdmin endpoints
│   ├── invite.go        # Invite management
│   ├── class.go         # Class management
│   ├── student.go       # Student management
│   ├── finance.go       # Finance endpoints
│   └── reports.go       # Reports endpoints
├── utils/
│   ├── jwt.go           # JWT utilities
│   ├── seeder.go        # Database seeder
│   └── errors.go        # Custom error types
├── Dockerfile           # Docker build config
├── swagger.yml          # API documentation
└── test_api.sh          # API test script
```

## API Base URL

```
http://localhost:8080/api/v1
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DB_HOST` | PostgreSQL host | SQLite if not set |
| `DB_USER` | PostgreSQL user | - |
| `DB_PASSWORD` | PostgreSQL password | - |
| `DB_NAME` | PostgreSQL database | - |
| `DB_PORT` | PostgreSQL port | `5432` |
| `JWT_SECRET` | JWT signing secret | Auto-generated |
| `PORT` | Server port | `8080` |

## Testing

```bash
./test_api.sh
```
