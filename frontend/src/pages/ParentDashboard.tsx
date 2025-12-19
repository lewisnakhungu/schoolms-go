import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Loader2, Users, Award, ClipboardCheck, CreditCard, TrendingUp, AlertCircle, User, ChevronRight, Calendar } from 'lucide-react';

interface Child {
    id: number;
    name: string;
    email: string;
    enrollment_number: string;
    class_name: string;
    relation: string;
    recent_grades: Array<{
        subject: string;
        score: number;
        max_score: number;
    }>;
    attendance_rate: number;
    fee_balance: number;
}

interface ChildDetails {
    grades: Array<{ subject: string; score: number; max_score: number; term: string }>;
    attendance: { summary: { present: number; absent: number; late: number; attendance_rate: number } };
    fees: { total_fees: number; total_payments: number; balance: number };
}

export default function ParentDashboard() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [children, setChildren] = useState<Child[]>([]);
    const [selectedChild, setSelectedChild] = useState<number | null>(null);
    const [childDetails, setChildDetails] = useState<ChildDetails | null>(null);
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchDashboard();
    }, []);

    useEffect(() => {
        if (selectedChild) {
            fetchChildDetails(selectedChild);
        }
    }, [selectedChild]);

    const fetchDashboard = async () => {
        setLoading(true);
        try {
            const res = await api.get('/parent/dashboard');
            setChildren(res.data.children || []);
            if (res.data.children?.length > 0) {
                setSelectedChild(res.data.children[0].id);
            }
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const fetchChildDetails = async (studentId: number) => {
        setDetailsLoading(true);
        try {
            const [gradesRes, attendanceRes, feesRes] = await Promise.all([
                api.get(`/parent/child/${studentId}/grades`),
                api.get(`/parent/child/${studentId}/attendance`),
                api.get(`/parent/child/${studentId}/fees`)
            ]);
            setChildDetails({
                grades: gradesRes.data.grades || [],
                attendance: attendanceRes.data,
                fees: feesRes.data
            });
        } catch (err) {
            console.error('Failed to fetch child details');
        } finally {
            setDetailsLoading(false);
        }
    };

    const formatCurrency = (amount: number) => `KES ${amount?.toLocaleString() || 0}`;

    const getGradeColor = (score: number, max: number) => {
        const percent = (score / max) * 100;
        if (percent >= 80) return 'text-green-600 bg-green-50';
        if (percent >= 60) return 'text-blue-600 bg-blue-50';
        if (percent >= 40) return 'text-amber-600 bg-amber-50';
        return 'text-red-600 bg-red-50';
    };

    const selectedChildData = children.find(c => c.id === selectedChild);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 text-primary-600 animate-spin" />
            </div>
        );
    }

    if (children.length === 0) {
        return (
            <div className="text-center py-12">
                <Users className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-slate-900 mb-2">No Children Linked</h2>
                <p className="text-slate-500">Contact the school admin to link your children to your account.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Parent Portal</h1>
                <p className="text-slate-500">Track your children's academic progress</p>
            </div>

            {error && (
                <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" />
                    {error}
                </div>
            )}

            {/* Children Selector */}
            <div className="flex gap-3 overflow-x-auto pb-2">
                {children.map((child) => (
                    <button
                        key={child.id}
                        onClick={() => setSelectedChild(child.id)}
                        className={`flex-shrink-0 p-4 rounded-2xl border-2 transition-all min-w-[200px] text-left ${selectedChild === child.id
                                ? 'bg-primary-50 border-primary-500'
                                : 'bg-white border-slate-100 hover:border-primary-200'
                            }`}
                    >
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-xl ${selectedChild === child.id ? 'bg-primary-100' : 'bg-slate-100'}`}>
                                <User className={`h-5 w-5 ${selectedChild === child.id ? 'text-primary-600' : 'text-slate-500'}`} />
                            </div>
                            <div>
                                <p className="font-semibold text-slate-900">{child.name || child.email}</p>
                                <p className="text-xs text-slate-500">{child.class_name} • {child.relation}</p>
                            </div>
                        </div>
                    </button>
                ))}
            </div>

            {/* Overview Cards */}
            {selectedChildData && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-gradient-to-br from-green-500 to-green-600 p-5 rounded-2xl text-white">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 bg-white/20 rounded-xl">
                                <ClipboardCheck className="h-5 w-5" />
                            </div>
                            <span className="font-medium opacity-90">Attendance</span>
                        </div>
                        <p className="text-3xl font-bold">{selectedChildData.attendance_rate?.toFixed(1) || 0}%</p>
                        <p className="text-sm opacity-80 mt-1">This month</p>
                    </div>

                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-5 rounded-2xl text-white">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 bg-white/20 rounded-xl">
                                <Award className="h-5 w-5" />
                            </div>
                            <span className="font-medium opacity-90">Recent Grades</span>
                        </div>
                        <p className="text-3xl font-bold">{selectedChildData.recent_grades?.length || 0}</p>
                        <p className="text-sm opacity-80 mt-1">Subjects graded</p>
                    </div>

                    <div className={`p-5 rounded-2xl text-white ${selectedChildData.fee_balance > 0
                            ? 'bg-gradient-to-br from-red-500 to-red-600'
                            : 'bg-gradient-to-br from-emerald-500 to-emerald-600'
                        }`}>
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 bg-white/20 rounded-xl">
                                <CreditCard className="h-5 w-5" />
                            </div>
                            <span className="font-medium opacity-90">Fee Balance</span>
                        </div>
                        <p className="text-3xl font-bold">{formatCurrency(selectedChildData.fee_balance)}</p>
                        <p className="text-sm opacity-80 mt-1">
                            {selectedChildData.fee_balance > 0 ? 'Outstanding balance' : 'All paid up! ✓'}
                        </p>
                    </div>
                </div>
            )}

            {/* Detailed View */}
            {detailsLoading ? (
                <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 text-primary-600 animate-spin" />
                </div>
            ) : childDetails && (
                <div className="grid lg:grid-cols-2 gap-6">
                    {/* Grades */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                        <div className="p-5 border-b border-slate-100 flex items-center gap-2">
                            <Award className="h-5 w-5 text-primary-600" />
                            <h2 className="font-bold text-slate-900">Academic Performance</h2>
                        </div>
                        <div className="divide-y divide-slate-100">
                            {childDetails.grades.length === 0 ? (
                                <p className="p-6 text-center text-slate-400">No grades recorded yet</p>
                            ) : (
                                childDetails.grades.slice(0, 6).map((grade, i) => (
                                    <div key={i} className="p-4 flex items-center justify-between">
                                        <div>
                                            <p className="font-medium text-slate-900">{grade.subject}</p>
                                            <p className="text-xs text-slate-400">{grade.term}</p>
                                        </div>
                                        <div className={`px-3 py-1 rounded-lg font-bold ${getGradeColor(grade.score, grade.max_score)}`}>
                                            {grade.score}/{grade.max_score}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Attendance Summary */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                        <div className="p-5 border-b border-slate-100 flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-primary-600" />
                            <h2 className="font-bold text-slate-900">Attendance This Month</h2>
                        </div>
                        <div className="p-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-green-50 p-4 rounded-xl text-center">
                                    <p className="text-2xl font-bold text-green-600">{childDetails.attendance.summary?.present || 0}</p>
                                    <p className="text-sm text-green-700">Present</p>
                                </div>
                                <div className="bg-red-50 p-4 rounded-xl text-center">
                                    <p className="text-2xl font-bold text-red-600">{childDetails.attendance.summary?.absent || 0}</p>
                                    <p className="text-sm text-red-700">Absent</p>
                                </div>
                                <div className="bg-amber-50 p-4 rounded-xl text-center">
                                    <p className="text-2xl font-bold text-amber-600">{childDetails.attendance.summary?.late || 0}</p>
                                    <p className="text-sm text-amber-700">Late</p>
                                </div>
                                <div className="bg-primary-50 p-4 rounded-xl text-center">
                                    <p className="text-2xl font-bold text-primary-600">
                                        {childDetails.attendance.summary?.attendance_rate?.toFixed(1) || 0}%
                                    </p>
                                    <p className="text-sm text-primary-700">Rate</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Fee Details */}
                    <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                        <div className="p-5 border-b border-slate-100 flex items-center gap-2">
                            <CreditCard className="h-5 w-5 text-primary-600" />
                            <h2 className="font-bold text-slate-900">Fee Summary</h2>
                        </div>
                        <div className="p-6">
                            <div className="grid sm:grid-cols-3 gap-4">
                                <div className="bg-slate-50 p-4 rounded-xl">
                                    <p className="text-sm text-slate-500 mb-1">Total Fees</p>
                                    <p className="text-xl font-bold text-slate-900">{formatCurrency(childDetails.fees.total_fees)}</p>
                                </div>
                                <div className="bg-green-50 p-4 rounded-xl">
                                    <p className="text-sm text-green-600 mb-1">Amount Paid</p>
                                    <p className="text-xl font-bold text-green-700">{formatCurrency(childDetails.fees.total_payments)}</p>
                                </div>
                                <div className={`p-4 rounded-xl ${childDetails.fees.balance > 0 ? 'bg-red-50' : 'bg-emerald-50'}`}>
                                    <p className={`text-sm mb-1 ${childDetails.fees.balance > 0 ? 'text-red-600' : 'text-emerald-600'}`}>Balance Due</p>
                                    <p className={`text-xl font-bold ${childDetails.fees.balance > 0 ? 'text-red-700' : 'text-emerald-700'}`}>
                                        {formatCurrency(childDetails.fees.balance)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
