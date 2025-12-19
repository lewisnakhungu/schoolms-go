import { useAuth } from '../context/AuthContext';
import StudentDashboard from './StudentDashboard';
import SchoolAdminDashboard from './SchoolAdminDashboard';
import TeacherDashboard from './TeacherDashboard';

export default function DashboardHome() {
    const { role } = useAuth();

    if (role === 'STUDENT') {
        return <StudentDashboard />;
    }

    if (role === 'SCHOOLADMIN') {
        return <SchoolAdminDashboard />;
    }

    if (role === 'TEACHER') {
        return <TeacherDashboard />;
    }

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Welcome</h1>
            <p>Please select an option from the menu.</p>
        </div>
    );
}

