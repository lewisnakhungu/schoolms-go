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
import './index.css';

const App = () => {
    return (
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
                    </Route>

                    <Route path="/superadmin" element={<DashboardLayout />}>
                        <Route index element={<SuperAdminDashboard />} />
                    </Route>

                    <Route path="/" element={<Navigate to="/login" replace />} />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
};

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
);
