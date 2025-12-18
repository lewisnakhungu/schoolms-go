import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Users, BookOpen, CreditCard, AlertTriangle, Plus, Loader2, RefreshCw, UserPlus } from 'lucide-react';

interface Student {
    ID: number;
    enrollment_number: string;
    User: { email: string };
    Class: { name: string } | null;
}

interface Class {
    ID: number;
    name: string;
}

interface Invite {
    ID: number;
    code: string;
    role: string;
    is_used: boolean;
    expires_at: string;
}

interface Defaulter {
    StudentName: string;
    EnrollmentNumber: string;
    Class: string;
    Balance: number;
}

export default function SchoolAdminDashboard() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [students, setStudents] = useState<Student[]>([]);
    const [classes, setClasses] = useState<Class[]>([]);
    const [invites, setInvites] = useState<Invite[]>([]);
    const [defaulters, setDefaulters] = useState<Defaulter[]>([]);
    const [error, setError] = useState('');

    // Invite modal state
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [inviteRole, setInviteRole] = useState<'STUDENT' | 'TEACHER'>('STUDENT');
    const [creatingInvite, setCreatingInvite] = useState(false);
    const [newInviteCode, setNewInviteCode] = useState('');

    const fetchData = async () => {
        setLoading(true);
        setError('');
        try {
            const [studentsRes, classesRes, invitesRes, defaultersRes] = await Promise.all([
                api.get('/students'),
                api.get('/classes'),
                api.get('/invites'),
                api.get('/reports/defaulters')
            ]);
            setStudents(studentsRes.data || []);
            setClasses(classesRes.data || []);
            setInvites(invitesRes.data || []);
            setDefaulters(defaultersRes.data || []);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to load data');
            console.error('Dashboard fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleCreateInvite = async () => {
        setCreatingInvite(true);
        try {
            const response = await api.post('/invites', { role: inviteRole });
            setNewInviteCode(response.data.code);
            setInvites(prev => [response.data, ...prev]);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to create invite');
        } finally {
            setCreatingInvite(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 text-primary-600 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">School Dashboard</h1>
                    <p className="text-slate-500 mt-1">Welcome, <span className="font-semibold text-primary-600">{user?.email?.split('@')[0] || 'Admin'}</span></p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowInviteModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 transition-colors shadow-sm"
                    >
                        <UserPlus className="h-4 w-4" />
                        <span className="hidden sm:inline">Generate Invite</span>
                    </button>
                    <button
                        onClick={fetchData}
                        className="p-2 text-slate-500 hover:text-primary-600 hover:bg-slate-100 rounded-xl transition-colors"
                        title="Refresh Data"
                    >
                        <RefreshCw className="h-5 w-5" />
                    </button>
                </div>
            </div>

            {error && (
                <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm">
                    {error}
                </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard icon={<Users />} label="Students" value={students.length} color="primary" />
                <StatCard icon={<BookOpen />} label="Classes" value={classes.length} color="indigo" />
                <StatCard icon={<CreditCard />} label="Invites" value={invites.filter(i => !i.is_used).length} color="violet" />
                <StatCard icon={<AlertTriangle />} label="Defaulters" value={defaulters.length} color="amber" />
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Students List */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 sm:p-6">
                    <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-4">
                        <Users className="h-5 w-5 text-slate-400" />
                        Recent Students
                    </h2>
                    {students.length === 0 ? (
                        <p className="text-slate-400 text-sm py-4 text-center">No students enrolled yet.</p>
                    ) : (
                        <div className="overflow-x-auto -mx-4 sm:mx-0">
                            <table className="w-full text-sm min-w-[400px]">
                                <thead>
                                    <tr className="text-left text-slate-500 border-b border-slate-100">
                                        <th className="pb-2 px-4 sm:px-0">Email</th>
                                        <th className="pb-2">Enrollment #</th>
                                        <th className="pb-2">Class</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {students.slice(0, 5).map((s) => (
                                        <tr key={s.ID} className="border-b border-slate-50 hover:bg-slate-50/50">
                                            <td className="py-3 px-4 sm:px-0 font-medium text-slate-900">{s.User?.email || 'N/A'}</td>
                                            <td className="py-3 text-slate-600">{s.enrollment_number || '-'}</td>
                                            <td className="py-3 text-slate-600">{s.Class?.name || 'Unassigned'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Defaulters List */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 sm:p-6">
                    <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-4">
                        <AlertTriangle className="h-5 w-5 text-amber-500" />
                        Fee Defaulters
                    </h2>
                    {defaulters.length === 0 ? (
                        <p className="text-slate-400 text-sm py-4 text-center">No defaulters found. 🎉</p>
                    ) : (
                        <div className="overflow-x-auto -mx-4 sm:mx-0">
                            <table className="w-full text-sm min-w-[400px]">
                                <thead>
                                    <tr className="text-left text-slate-500 border-b border-slate-100">
                                        <th className="pb-2 px-4 sm:px-0">Student</th>
                                        <th className="pb-2">Class</th>
                                        <th className="pb-2 text-right">Balance</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {defaulters.slice(0, 5).map((d, i) => (
                                        <tr key={i} className="border-b border-slate-50 hover:bg-slate-50/50">
                                            <td className="py-3 px-4 sm:px-0 font-medium text-slate-900">{d.StudentName}</td>
                                            <td className="py-3 text-slate-600">{d.Class || '-'}</td>
                                            <td className="py-3 text-right font-semibold text-red-600">${d.Balance.toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Invite Modal */}
            {showInviteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
                        <h3 className="text-xl font-bold text-slate-900">Generate Invite Code</h3>

                        {newInviteCode ? (
                            <div className="space-y-4">
                                <p className="text-slate-600">Share this code with the user:</p>
                                <div className="bg-primary-50 p-4 rounded-xl text-center">
                                    <span className="font-mono text-lg font-bold text-primary-700 tracking-wider">{newInviteCode}</span>
                                </div>
                                <button
                                    onClick={() => { setShowInviteModal(false); setNewInviteCode(''); }}
                                    className="w-full py-3 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200 transition-colors"
                                >
                                    Done
                                </button>
                            </div>
                        ) : (
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Role</label>
                                    <select
                                        value={inviteRole}
                                        onChange={(e) => setInviteRole(e.target.value as 'STUDENT' | 'TEACHER')}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none"
                                    >
                                        <option value="STUDENT">Student</option>
                                        <option value="TEACHER">Teacher</option>
                                    </select>
                                </div>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setShowInviteModal(false)}
                                        className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleCreateInvite}
                                        disabled={creatingInvite}
                                        className="flex-1 py-3 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 transition-colors flex items-center justify-center gap-2"
                                    >
                                        {creatingInvite ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="h-5 w-5" />}
                                        Generate
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
    const colorClasses: Record<string, string> = {
        primary: 'bg-primary-50 text-primary-600',
        indigo: 'bg-indigo-50 text-indigo-600',
        violet: 'bg-violet-50 text-violet-600',
        amber: 'bg-amber-50 text-amber-600',
    };
    return (
        <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
            <div className={`inline-flex items-center justify-center p-2 rounded-lg ${colorClasses[color]} mb-3`}>
                {icon}
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-slate-900">{value}</div>
            <div className="text-sm text-slate-500">{label}</div>
        </div>
    );
}
