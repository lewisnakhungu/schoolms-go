import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Outlet, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { LogOut, School, Users, CreditCard, FileText, Menu, X, ChevronRight, LayoutDashboard, BookOpen, MessageSquare, Bell, HelpCircle, Award, DollarSign, TrendingUp, ClipboardCheck } from 'lucide-react';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

export default function DashboardLayout() {
    const { isAuthenticated, logout, role } = useAuth();
    const navigate = useNavigate();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    if (!isAuthenticated) {
        return <Navigate to="/login" />;
    }

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans flex">
            {/* Sidebar Desktop */}
            <aside className="hidden lg:flex flex-col w-72 bg-white border-r border-slate-200 fixed h-full z-20">
                <div className="p-8 pb-4 flex items-center space-x-3">
                    <div className="bg-primary-50 p-2 rounded-xl">
                        <School className="h-6 w-6 text-primary-600" />
                    </div>
                    <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-700 to-primary-900">SchoolMS</span>
                </div>

                <div className="px-6 py-2">
                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Menu</div>
                    <nav className="space-y-1">
                        {role === 'SCHOOLADMIN' && (
                            <>
                                <NavItem icon={<LayoutDashboard />} label="Overview" to="/dashboard" />
                                <NavItem icon={<Users />} label="Students" to="/dashboard/students" />
                                <NavItem icon={<BookOpen />} label="Classes" to="/dashboard/classes" />
                                <NavItem icon={<ClipboardCheck />} label="Attendance" to="/dashboard/attendance" />
                                <NavItem icon={<CreditCard />} label="Finance" to="/dashboard/finance" />
                                <NavItem icon={<FileText />} label="Reports" to="/dashboard/reports" />
                                <NavItem icon={<Bell />} label="Notifications" to="/dashboard/notifications" />
                                <NavItem icon={<MessageSquare />} label="Support" to="/dashboard/tickets" />
                            </>
                        )}
                        {role === 'STUDENT' && (
                            <>
                                <NavItem icon={<LayoutDashboard />} label="My Dashboard" to="/dashboard" />
                                <NavItem icon={<Award />} label="My Grades" to="/dashboard/grades" />
                                <NavItem icon={<HelpCircle />} label="Get Help" to="/dashboard/support" />
                            </>
                        )}
                        {role === 'TEACHER' && (
                            <>
                                <NavItem icon={<LayoutDashboard />} label="Dashboard" to="/dashboard" />
                                <NavItem icon={<BookOpen />} label="My Classes" to="/dashboard/classes" />
                                <NavItem icon={<Users />} label="My Students" to="/dashboard/students" />
                                <NavItem icon={<ClipboardCheck />} label="Attendance" to="/dashboard/attendance" />
                                <NavItem icon={<Award />} label="Grades" to="/dashboard/grades" />
                            </>
                        )}
                        {role === 'SUPERADMIN' && (
                            <>
                                <NavItem icon={<School />} label="All Schools" to="/superadmin" />
                                <NavItem icon={<MessageSquare />} label="Tickets" to="/superadmin/tickets" />
                            </>
                        )}
                        {role === 'FINANCE' && (
                            <>
                                <NavItem icon={<LayoutDashboard />} label="Dashboard" to="/dashboard" />
                                <NavItem icon={<DollarSign />} label="Fees" to="/dashboard/finance" />
                                <NavItem icon={<TrendingUp />} label="Reports" to="/dashboard/reports" />
                            </>
                        )}
                        {role === 'PARENT' && (
                            <>
                                <NavItem icon={<LayoutDashboard />} label="My Children" to="/dashboard" />
                                <NavItem icon={<Award />} label="Grades" to="/dashboard/grades" />
                                <NavItem icon={<ClipboardCheck />} label="Attendance" to="/dashboard/attendance" />
                                <NavItem icon={<CreditCard />} label="Fees" to="/dashboard/finance" />
                            </>
                        )}
                    </nav>
                </div>

                <div className="mt-auto p-6 border-t border-slate-100">
                    <div className="flex items-center p-3 bg-slate-50 rounded-xl mb-4">
                        <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold">
                            {role?.charAt(0)}
                        </div>
                        <div className="ml-3 overflow-hidden">
                            <p className="text-sm font-medium text-slate-900 truncate">Current User</p>
                            <p className="text-xs text-slate-500 truncate">{role}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="flex items-center space-x-3 w-full px-4 py-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all text-sm font-medium"
                    >
                        <LogOut className="h-4 w-4" />
                        <span>Sign Out</span>
                    </button>
                </div>
            </aside>

            {/* Mobile Header */}
            <div className="lg:hidden fixed top-0 w-full bg-white/80 backdrop-blur-md z-30 border-b border-slate-200 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    <School className="h-6 w-6 text-primary-600" />
                    <span className="font-bold text-slate-900">SchoolMS</span>
                </div>
                <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg">
                    <Menu className="h-6 w-6" />
                </button>
            </div>

            {/* Mobile Sidebar Overlay */}
            <AnimatePresence>
                {isSidebarOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsSidebarOpen(false)}
                            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
                        />
                        <motion.aside
                            initial={{ x: "-100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "-100%" }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            className="fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-2xl lg:hidden flex flex-col"
                        >
                            <div className="p-6 flex items-center justify-between border-b border-slate-100">
                                <span className="text-xl font-bold text-slate-900">Menu</span>
                                <button onClick={() => setIsSidebarOpen(false)}>
                                    <X className="h-6 w-6 text-slate-400" />
                                </button>
                            </div>
                            <nav className="p-4 space-y-1">
                                {role === 'SCHOOLADMIN' && (
                                    <>
                                        <NavItem icon={<LayoutDashboard />} label="Overview" to="/dashboard" onClick={() => setIsSidebarOpen(false)} />
                                        <NavItem icon={<Users />} label="Students" to="/dashboard/students" onClick={() => setIsSidebarOpen(false)} />
                                        <NavItem icon={<BookOpen />} label="Classes" to="/dashboard/classes" onClick={() => setIsSidebarOpen(false)} />
                                        <NavItem icon={<CreditCard />} label="Finance" to="/dashboard/finance" onClick={() => setIsSidebarOpen(false)} />
                                        <NavItem icon={<FileText />} label="Reports" to="/dashboard/reports" onClick={() => setIsSidebarOpen(false)} />
                                        <NavItem icon={<Bell />} label="Notifications" to="/dashboard/notifications" onClick={() => setIsSidebarOpen(false)} />
                                        <NavItem icon={<MessageSquare />} label="Support" to="/dashboard/tickets" onClick={() => setIsSidebarOpen(false)} />
                                    </>
                                )}
                                {role === 'STUDENT' && (
                                    <>
                                        <NavItem icon={<LayoutDashboard />} label="My Dashboard" to="/dashboard" onClick={() => setIsSidebarOpen(false)} />
                                        <NavItem icon={<Award />} label="My Grades" to="/dashboard/grades" onClick={() => setIsSidebarOpen(false)} />
                                        <NavItem icon={<HelpCircle />} label="Get Help" to="/dashboard/support" onClick={() => setIsSidebarOpen(false)} />
                                    </>
                                )}
                                {role === 'TEACHER' && (
                                    <>
                                        <NavItem icon={<LayoutDashboard />} label="Dashboard" to="/dashboard" onClick={() => setIsSidebarOpen(false)} />
                                        <NavItem icon={<BookOpen />} label="My Classes" to="/dashboard/classes" onClick={() => setIsSidebarOpen(false)} />
                                        <NavItem icon={<Users />} label="My Students" to="/dashboard/students" onClick={() => setIsSidebarOpen(false)} />
                                        <NavItem icon={<Award />} label="Grades" to="/dashboard/grades" onClick={() => setIsSidebarOpen(false)} />
                                    </>
                                )}
                                {role === 'SUPERADMIN' && (
                                    <>
                                        <NavItem icon={<School />} label="All Schools" to="/superadmin" onClick={() => setIsSidebarOpen(false)} />
                                        <NavItem icon={<MessageSquare />} label="Tickets" to="/superadmin/tickets" onClick={() => setIsSidebarOpen(false)} />
                                    </>
                                )}
                                {role === 'FINANCE' && (
                                    <>
                                        <NavItem icon={<LayoutDashboard />} label="Dashboard" to="/dashboard" onClick={() => setIsSidebarOpen(false)} />
                                        <NavItem icon={<DollarSign />} label="Fees" to="/dashboard/finance" onClick={() => setIsSidebarOpen(false)} />
                                        <NavItem icon={<TrendingUp />} label="Reports" to="/dashboard/reports" onClick={() => setIsSidebarOpen(false)} />
                                    </>
                                )}
                            </nav>
                            <div className="mt-auto p-6 border-t border-slate-100">
                                <button
                                    onClick={handleLogout}
                                    className="flex items-center justify-center space-x-2 w-full px-4 py-3 bg-slate-100 text-slate-700 rounded-xl font-medium"
                                >
                                    <LogOut className="h-5 w-5" />
                                    <span>Sign Out</span>
                                </button>
                            </div>
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>

            {/* Main Content Area */}
            <main className="flex-1 lg:ml-72 min-h-screen pt-16 lg:pt-0">
                <div className="max-w-7xl mx-auto p-6 lg:p-10">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}

const NavItem = ({ icon, label, to, onClick }: { icon: React.ReactNode, label: string, to: string, onClick?: () => void }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const isActive = location.pathname.startsWith(to) || (to === '/dashboard' && location.pathname === '/dashboard');

    return (
        <button
            onClick={() => {
                navigate(to);
                if (onClick) onClick();
            }}
            className={clsx(
                "flex items-center space-x-3 w-full px-4 py-3 rounded-xl transition-all duration-200 group",
                isActive
                    ? "bg-primary-50 text-primary-700 font-semibold"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
            )}
        >
            <span className={clsx("transition-colors [&>svg]:h-5 [&>svg]:w-5", isActive ? "text-primary-600" : "text-slate-400 group-hover:text-slate-600")}>
                {icon}
            </span>
            <span>{label}</span>
            {isActive && <ChevronRight className="ml-auto h-4 w-4 text-primary-400" />}
        </button>
    );
};
