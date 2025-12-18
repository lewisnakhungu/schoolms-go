# SchoolMS Frontend

Modern React frontend for the SchoolMS School Management System.

## Tech Stack

- **React 18** with TypeScript
- **Tailwind CSS v4** for styling
- **Vite** for fast development
- **Axios** for API calls
- **Lucide React** for icons

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Project Structure

```
src/
├── context/           # React Context providers
│   └── AuthContext.tsx
├── layouts/           # Page layouts
│   └── DashboardLayout.tsx
├── pages/             # Page components
│   ├── Login.tsx
│   ├── Signup.tsx
│   ├── SuperAdminDashboard.tsx
│   ├── SchoolAdminDashboard.tsx
│   ├── StudentDashboard.tsx
│   ├── ClassesPage.tsx
│   ├── StudentsPage.tsx
│   ├── FinancePage.tsx
│   └── ReportsPage.tsx
├── services/          # API services
│   └── api.ts
├── index.css          # Global styles
└── main.tsx           # App entry point
```

## Features

- 🔐 JWT-based authentication
- 🎨 Premium UI with modern design
- 📱 Fully responsive (mobile-first)
- 🌙 Role-based dashboards
- 💰 Finance management interface
- 📊 Reports with print support

## Environment

The frontend connects to the backend at `http://localhost:8080/api/v1` by default.
