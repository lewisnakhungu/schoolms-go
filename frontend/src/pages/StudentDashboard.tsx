import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { CreditCard, BookOpen, Clock, Loader2, AlertCircle, CheckCircle, User, School, Bell, GraduationCap, UserCheck, Calendar } from 'lucide-react';

interface StudentProfile {
    student: {
        id: number;
        enrollment_number: string;
        status: string;
        admission_date?: string;
        email: string;
        full_name: string;
    };
    school: {
        id: number;
        name: string;
    };
    class?: {
        id: number;
        name: string;
    };
    teacher?: {
        id: number;
        email: string;
        full_name: string;
    };
    notifications: Array<{
        id: number;
        title: string;
        message: string;
        category: string;
        created_at: string;
    }>;
    finance: {
        total_fees: number;
        total_payments: number;
        balance: number;
    };
}

export default function StudentDashboard() {
    const { user } = useAuth();
    const [profile, setProfile] = useState<StudentProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await api.get('/students/me');
                setProfile(response.data);
            } catch (err: any) {
                console.error("Failed to fetch profile", err);
                if (err.response?.status === 404) {
                    setError('Student profile not found. Please contact your school administrator.');
                } else {
                    setError('Failed to load profile');
                }
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 text-primary-600 animate-spin" />
            </div>
        );
    }

    const studentName = profile?.student.full_name || user?.email?.split('@')[0] || 'Student';
    const isInGoodStanding = profile && profile.finance.balance <= 0;

    const getStatusBadge = (status: string) => {
        const styles: Record<string, { bg: string, text: string, icon: any }> = {
            'PENDING': { bg: 'bg-amber-100', text: 'text-amber-800', icon: Clock },
            'ENROLLED': { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle },
            'DISCHARGED': { bg: 'bg-slate-100', text: 'text-slate-600', icon: AlertCircle }
        };
        return styles[status] || styles['PENDING'];
    };

    const statusInfo = profile ? getStatusBadge(profile.student.status) : getStatusBadge('PENDING');
    const StatusIcon = statusInfo.icon;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Student Dashboard</h1>
                    <p className="text-slate-500 mt-1">
                        Welcome back, <span className="font-semibold text-primary-600">{studentName}</span>
                    </p>
                </div>
                <div className="text-sm font-medium text-slate-500 bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-100">
                    {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
            </div>

            {error && (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-100 text-amber-700 text-sm flex items-center gap-3">
                    <AlertCircle className="h-5 w-5 flex-shrink-0" />
                    {error}
                </div>
            )}

            {profile && (
                <>
                    {/* Status Banner */}
                    <div className={`p-4 rounded-2xl ${statusInfo.bg} flex items-center gap-3`}>
                        <StatusIcon className={`h-6 w-6 ${statusInfo.text}`} />
                        <div>
                            <p className={`font-semibold ${statusInfo.text}`}>
                                Status: {profile.student.status}
                            </p>
                            {profile.student.admission_date && (
                                <p className={`text-sm ${statusInfo.text} opacity-75`}>
                                    Admitted: {new Date(profile.student.admission_date).toLocaleDateString()}
                                </p>
                            )}
                        </div>
                        {profile.student.enrollment_number && (
                            <div className="ml-auto text-right">
                                <p className={`text-xs ${statusInfo.text} opacity-75`}>Enrollment #</p>
                                <p className={`font-mono font-bold ${statusInfo.text}`}>{profile.student.enrollment_number}</p>
                            </div>
                        )}
                    </div>

                    {/* School & Class Info */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* School Card */}
                        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-2 bg-primary-50 rounded-xl">
                                    <School className="h-5 w-5 text-primary-600" />
                                </div>
                                <span className="font-semibold text-slate-700">My School</span>
                            </div>
                            <p className="text-xl font-bold text-slate-900">{profile.school.name}</p>
                        </div>

                        {/* Class Card */}
                        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-2 bg-indigo-50 rounded-xl">
                                    <GraduationCap className="h-5 w-5 text-indigo-600" />
                                </div>
                                <span className="font-semibold text-slate-700">My Class</span>
                            </div>
                            {profile.class ? (
                                <p className="text-xl font-bold text-slate-900">{profile.class.name}</p>
                            ) : (
                                <p className="text-slate-400 italic">Not assigned yet</p>
                            )}
                        </div>
                    </div>

                    {/* Teacher Card */}
                    {profile.class && (
                        <div className="bg-gradient-to-r from-violet-50 to-purple-50 p-5 rounded-2xl border border-violet-100">
                            <div className="flex items-center gap-4">
                                <div className="h-14 w-14 bg-violet-100 rounded-full flex items-center justify-center">
                                    <User className="h-7 w-7 text-violet-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-violet-600 font-medium">Class Teacher</p>
                                    {profile.teacher ? (
                                        <>
                                            <p className="text-lg font-bold text-slate-900">{profile.teacher.full_name || profile.teacher.email}</p>
                                            {profile.teacher.full_name && (
                                                <p className="text-sm text-slate-500">{profile.teacher.email}</p>
                                            )}
                                        </>
                                    ) : (
                                        <p className="text-slate-400 italic">No teacher assigned</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Finance Stats */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {/* Balance Card */}
                        <div className={`p-5 rounded-2xl shadow-sm border transition-shadow hover:shadow-md relative overflow-hidden ${isInGoodStanding ? 'bg-green-50 border-green-100' : 'bg-white border-slate-100'
                            }`}>
                            <div className="flex items-center space-x-3 mb-3">
                                <div className={`p-2 rounded-xl ${isInGoodStanding ? 'bg-green-100' : 'bg-primary-50'}`}>
                                    <CreditCard className={`h-5 w-5 ${isInGoodStanding ? 'text-green-600' : 'text-primary-600'}`} />
                                </div>
                                <span className="font-semibold text-slate-700">Fee Balance</span>
                            </div>
                            <div className="text-2xl sm:text-3xl font-bold text-slate-900">
                                KES {Math.abs(profile.finance.balance).toLocaleString()}
                            </div>
                            <p className="text-sm text-slate-500 mt-2 flex items-center gap-1">
                                {isInGoodStanding ? (
                                    <>
                                        <CheckCircle className="h-4 w-4 text-green-500" />
                                        Account in good standing
                                    </>
                                ) : (
                                    profile.finance.balance > 0 ? 'Amount owing' : ''
                                )}
                            </p>
                        </div>

                        {/* Total Fees Card */}
                        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                            <div className="flex items-center space-x-3 mb-3">
                                <div className="p-2 bg-indigo-50 rounded-xl">
                                    <BookOpen className="h-5 w-5 text-indigo-600" />
                                </div>
                                <span className="font-semibold text-slate-700">Total Fees</span>
                            </div>
                            <div className="text-2xl sm:text-3xl font-bold text-slate-900">
                                KES {profile.finance.total_fees.toLocaleString()}
                            </div>
                            <p className="text-sm text-slate-500 mt-2">This academic year</p>
                        </div>

                        {/* Total Payments Card */}
                        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                            <div className="flex items-center space-x-3 mb-3">
                                <div className="p-2 bg-violet-50 rounded-xl">
                                    <Clock className="h-5 w-5 text-violet-600" />
                                </div>
                                <span className="font-semibold text-slate-700">Total Paid</span>
                            </div>
                            <div className="text-2xl sm:text-3xl font-bold text-slate-900">
                                KES {profile.finance.total_payments.toLocaleString()}
                            </div>
                            <p className="text-sm text-slate-500 mt-2">Payments made</p>
                        </div>
                    </div>

                    {/* Notifications */}
                    {profile.notifications.length > 0 && (
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
                            <div className="flex items-center gap-2 mb-4">
                                <Bell className="h-5 w-5 text-primary-600" />
                                <h2 className="text-lg font-bold text-slate-900">Recent Notifications</h2>
                            </div>
                            <div className="space-y-3">
                                {profile.notifications.map((notif) => (
                                    <div key={notif.id} className="p-4 bg-slate-50 rounded-xl">
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <p className="font-medium text-slate-900">{notif.title}</p>
                                                <p className="text-sm text-slate-500 mt-1">{notif.message}</p>
                                            </div>
                                            <span className="text-xs text-slate-400 whitespace-nowrap">
                                                {new Date(notif.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Account Info */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
                        <h2 className="text-lg font-bold text-slate-900 mb-4">Account Information</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="p-4 bg-slate-50 rounded-xl">
                                <p className="text-sm text-slate-500">Email</p>
                                <p className="font-medium text-slate-900">{profile.student.email}</p>
                            </div>
                            <div className="p-4 bg-slate-50 rounded-xl">
                                <p className="text-sm text-slate-500">Student ID</p>
                                <p className="font-medium text-slate-900">{profile.student.id}</p>
                            </div>
                            <div className="p-4 bg-slate-50 rounded-xl">
                                <p className="text-sm text-slate-500">School</p>
                                <p className="font-medium text-slate-900">{profile.school.name}</p>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* Help Notice */}
            <div className="bg-primary-50 rounded-2xl p-5 border border-primary-100">
                <h3 className="font-semibold text-primary-900 mb-2">Need Help?</h3>
                <p className="text-sm text-primary-700">
                    If you have questions about your fees, classes, or account, please contact your school administrator or class teacher for assistance.
                </p>
            </div>
        </div>
    );
}
