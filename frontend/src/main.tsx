import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Login from './pages/Login';
import Signup from './pages/Signup';
import DashboardLayout from './layouts/DashboardLayout';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import StudentsPage from './pages/StudentsPage';
import ClassesPage from './pages/ClassesPage';
import FinancePage from './pages/FinancePage';
import ReportsPage from './pages/ReportsPage';
import DashboardHome from './pages/DashboardHome';
import TicketsPage from './pages/TicketsPage';
import NotificationsPage from './pages/NotificationsPage';
import StudentSupportPage from './pages/StudentSupportPage';
import ClassContentPage from './pages/ClassContentPage';
import GradesPage from './pages/GradesPage';
import AttendancePage from './pages/AttendancePage';
import TimetablePage from './pages/TimetablePage';
import VoteHeadPage from './pages/VoteHeadPage';
import IndustrialAttachmentPage from './pages/IndustrialAttachmentPage';
import ImportPage from './pages/ImportPage';
import AuditLogPage from './pages/AuditLogPage';
import LandingPage from './pages/LandingPage';
import { ToastProvider } from './components/Toast';
import './index.css';

const App = () => {
    return (
        <ToastProvider>
            <AuthProvider>
                <BrowserRouter>
                    <Routes>
                        <Route path="/login" element={<Login />} />
                        <Route path="/signup" element={<Signup />} />

                        <Route path="/dashboard" element={<DashboardLayout />}>
                            <Route index element={<DashboardHome />} />
                            <Route path="students" element={<StudentsPage />} />
                            <Route path="classes" element={<ClassesPage />} />
                            <Route path="finance" element={<FinancePage />} />
                            <Route path="reports" element={<ReportsPage />} />
                            <Route path="tickets" element={<TicketsPage />} />
                            <Route path="notifications" element={<NotificationsPage />} />
                            <Route path="support" element={<StudentSupportPage />} />
                            <Route path="classes/:classId/content" element={<ClassContentPage />} />
                            <Route path="grades" element={<GradesPage />} />
                            <Route path="attendance" element={<AttendancePage />} />
                            <Route path="timetable" element={<TimetablePage />} />
                            <Route path="vote-heads" element={<VoteHeadPage />} />
                            <Route path="attachments" element={<IndustrialAttachmentPage />} />
                            <Route path="import" element={<ImportPage />} />
                            <Route path="audit-logs" element={<AuditLogPage />} />
                        </Route>

                        <Route path="/superadmin" element={<DashboardLayout />}>
                            <Route index element={<SuperAdminDashboard />} />
                            <Route path="tickets" element={<TicketsPage />} />
                        </Route>

                        <Route path="/" element={<LandingPage />} />
                    </Routes>
                </BrowserRouter>
            </AuthProvider>
        </ToastProvider>
    );
};

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
);

