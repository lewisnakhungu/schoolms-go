import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Loader2, DollarSign, TrendingUp, Users, AlertTriangle, CreditCard, ArrowUpRight, Clock, Plus, AlertCircle } from 'lucide-react';

interface DashboardStats {
    total_fees_expected: number;
    total_collected: number;
    outstanding_balance: number;
    collection_rate: number;
    total_students: number;
    total_payments: number;
    defaulters_count: number;
    recent_payments: Array<{
        id: number;
        amount: number;
        method: string;
        reference: string;
        created_at: string;
        Student?: { User?: { email: string; full_name?: string } };
    }>;
}

interface FeeStructure {
    id: number;
    class_id: number;
    amount: number;
    academic_year: string;
    Class?: { name: string };
}

interface Student {
    id: number;
    enrollment_number: string;
    User?: { email: string; full_name?: string };
    Class?: { name: string };
}

export default function FinanceDashboard() {
    const { user } = useAuth();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [fees, setFees] = useState<FeeStructure[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Modals
    const [showFeeModal, setShowFeeModal] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [feeForm, setFeeForm] = useState({ class_id: '', amount: '', academic_year: new Date().getFullYear().toString() });
    const [paymentForm, setPaymentForm] = useState({ student_id: '', amount: '', method: 'CASH', reference: '' });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [statsRes, feesRes, studentsRes] = await Promise.all([
                api.get('/finance/dashboard-stats'),
                api.get('/finance/fees'),
                api.get('/students')
            ]);
            setStats(statsRes.data);
            setFees(feesRes.data || []);
            setStudents(studentsRes.data || []);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const handleAddFee = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await api.post('/finance/fees', {
                class_id: parseInt(feeForm.class_id),
                amount: parseFloat(feeForm.amount),
                academic_year: feeForm.academic_year
            });
            setSuccess('Fee structure added!');
            setShowFeeModal(false);
            setFeeForm({ class_id: '', amount: '', academic_year: new Date().getFullYear().toString() });
            fetchData();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to add fee');
        } finally {
            setSubmitting(false);
        }
    };

    const handleRecordPayment = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await api.post('/finance/payments', {
                student_id: parseInt(paymentForm.student_id),
                amount: parseFloat(paymentForm.amount),
                method: paymentForm.method,
                reference: paymentForm.reference
            });
            setSuccess('Payment recorded!');
            setShowPaymentModal(false);
            setPaymentForm({ student_id: '', amount: '', method: 'CASH', reference: '' });
            fetchData();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to record payment');
        } finally {
            setSubmitting(false);
        }
    };

    const formatCurrency = (amount: number) => `KES ${amount.toLocaleString()}`;

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
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Finance Dashboard</h1>
                    <p className="text-slate-500">Manage fees, payments, and financial reports</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setShowFeeModal(true)}
                        className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl shadow-sm transition-colors font-medium"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Fee
                    </button>
                    <button
                        onClick={() => setShowPaymentModal(true)}
                        className="inline-flex items-center px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl shadow-sm transition-colors font-medium"
                    >
                        <CreditCard className="h-4 w-4 mr-2" />
                        Record Payment
                    </button>
                </div>
            </div>

            {error && (
                <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" />
                    {error}
                    <button onClick={() => setError('')} className="ml-auto">×</button>
                </div>
            )}

            {success && (
                <div className="p-4 rounded-xl bg-green-50 border border-green-100 text-green-600 text-sm">
                    ✅ {success}
                </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-green-500 to-green-600 p-5 rounded-2xl text-white">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-white/20 rounded-xl">
                            <DollarSign className="h-5 w-5" />
                        </div>
                        <span className="font-medium opacity-90">Total Collected</span>
                    </div>
                    <p className="text-3xl font-bold">{formatCurrency(stats?.total_collected || 0)}</p>
                    <p className="text-sm opacity-80 mt-1">{stats?.total_payments} payments</p>
                </div>

                <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-5 rounded-2xl text-white">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-white/20 rounded-xl">
                            <TrendingUp className="h-5 w-5" />
                        </div>
                        <span className="font-medium opacity-90">Expected Fees</span>
                    </div>
                    <p className="text-3xl font-bold">{formatCurrency(stats?.total_fees_expected || 0)}</p>
                    <p className="text-sm opacity-80 mt-1">{stats?.total_students} students</p>
                </div>

                <div className="bg-gradient-to-br from-amber-500 to-amber-600 p-5 rounded-2xl text-white">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-white/20 rounded-xl">
                            <AlertTriangle className="h-5 w-5" />
                        </div>
                        <span className="font-medium opacity-90">Outstanding</span>
                    </div>
                    <p className="text-3xl font-bold">{formatCurrency(stats?.outstanding_balance || 0)}</p>
                    <p className="text-sm opacity-80 mt-1">{stats?.defaulters_count} defaulters</p>
                </div>

                <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-5 rounded-2xl text-white">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-white/20 rounded-xl">
                            <Users className="h-5 w-5" />
                        </div>
                        <span className="font-medium opacity-90">Collection Rate</span>
                    </div>
                    <p className="text-3xl font-bold">{(stats?.collection_rate || 0).toFixed(1)}%</p>
                    <p className="text-sm opacity-80 mt-1">of total fees</p>
                </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
                {/* Recent Payments */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100">
                    <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                        <h2 className="font-bold text-slate-900 flex items-center gap-2">
                            <Clock className="h-5 w-5 text-primary-600" />
                            Recent Payments
                        </h2>
                    </div>
                    {stats?.recent_payments?.length === 0 ? (
                        <div className="p-8 text-center text-slate-400">
                            <CreditCard className="h-12 w-12 mx-auto mb-3 opacity-50" />
                            <p>No payments yet</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {stats?.recent_payments?.map((payment) => (
                                <div key={payment.id} className="p-4 flex items-center gap-4">
                                    <div className="p-2 bg-green-50 rounded-xl">
                                        <ArrowUpRight className="h-4 w-4 text-green-600" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-slate-900 truncate">
                                            {payment.Student?.User?.full_name || payment.Student?.User?.email}
                                        </p>
                                        <p className="text-xs text-slate-400">{payment.method} • {payment.reference || 'No ref'}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-green-600">{formatCurrency(payment.amount)}</p>
                                        <p className="text-xs text-slate-400">{new Date(payment.created_at).toLocaleDateString()}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Fee Structures */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100">
                    <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                        <h2 className="font-bold text-slate-900 flex items-center gap-2">
                            <DollarSign className="h-5 w-5 text-primary-600" />
                            Fee Structures
                        </h2>
                    </div>
                    {fees.length === 0 ? (
                        <div className="p-8 text-center text-slate-400">
                            <DollarSign className="h-12 w-12 mx-auto mb-3 opacity-50" />
                            <p>No fee structures</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {fees.slice(0, 5).map((fee) => (
                                <div key={fee.id} className="p-4 flex items-center justify-between">
                                    <div>
                                        <p className="font-medium text-slate-900">{fee.Class?.name || 'Unknown Class'}</p>
                                        <p className="text-xs text-slate-400">{fee.academic_year}</p>
                                    </div>
                                    <p className="font-bold text-slate-900">{formatCurrency(fee.amount)}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Add Fee Modal */}
            {showFeeModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
                        <h2 className="text-xl font-bold text-slate-900">Add Fee Structure</h2>
                        <form onSubmit={handleAddFee} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Class</label>
                                <select
                                    required
                                    className="w-full border border-slate-200 p-3 rounded-xl focus:border-primary-500 outline-none"
                                    value={feeForm.class_id}
                                    onChange={(e) => setFeeForm({ ...feeForm, class_id: e.target.value })}
                                >
                                    <option value="">Select class</option>
                                    {Array.from(new Set(fees.map(f => f.Class?.name))).filter(Boolean).map((name) => {
                                        const fee = fees.find(f => f.Class?.name === name);
                                        return fee ? (
                                            <option key={fee.class_id} value={fee.class_id}>{name}</option>
                                        ) : null;
                                    })}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Amount (KES)</label>
                                <input
                                    required
                                    type="number"
                                    className="w-full border border-slate-200 p-3 rounded-xl focus:border-primary-500 outline-none"
                                    value={feeForm.amount}
                                    onChange={(e) => setFeeForm({ ...feeForm, amount: e.target.value })}
                                    placeholder="50000"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Academic Year</label>
                                <input
                                    required
                                    className="w-full border border-slate-200 p-3 rounded-xl focus:border-primary-500 outline-none"
                                    value={feeForm.academic_year}
                                    onChange={(e) => setFeeForm({ ...feeForm, academic_year: e.target.value })}
                                    placeholder="2024"
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setShowFeeModal(false)} className="flex-1 px-4 py-3 border border-slate-200 rounded-xl hover:bg-slate-50 font-medium text-slate-700">Cancel</button>
                                <button disabled={submitting} type="submit" className="flex-1 px-4 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 font-medium">
                                    {submitting ? 'Saving...' : 'Add Fee'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Record Payment Modal */}
            {showPaymentModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
                        <h2 className="text-xl font-bold text-slate-900">Record Payment</h2>
                        <form onSubmit={handleRecordPayment} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Student</label>
                                <select
                                    required
                                    className="w-full border border-slate-200 p-3 rounded-xl focus:border-primary-500 outline-none"
                                    value={paymentForm.student_id}
                                    onChange={(e) => setPaymentForm({ ...paymentForm, student_id: e.target.value })}
                                >
                                    <option value="">Select student</option>
                                    {students.map((s) => (
                                        <option key={s.id} value={s.id}>
                                            {s.User?.full_name || s.User?.email} - {s.enrollment_number}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Amount (KES)</label>
                                <input
                                    required
                                    type="number"
                                    className="w-full border border-slate-200 p-3 rounded-xl focus:border-primary-500 outline-none"
                                    value={paymentForm.amount}
                                    onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                                    placeholder="10000"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Payment Method</label>
                                <select
                                    className="w-full border border-slate-200 p-3 rounded-xl focus:border-primary-500 outline-none"
                                    value={paymentForm.method}
                                    onChange={(e) => setPaymentForm({ ...paymentForm, method: e.target.value })}
                                >
                                    <option value="CASH">Cash</option>
                                    <option value="MPESA">M-Pesa</option>
                                    <option value="BANK">Bank Transfer</option>
                                    <option value="CHEQUE">Cheque</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Reference (optional)</label>
                                <input
                                    className="w-full border border-slate-200 p-3 rounded-xl focus:border-primary-500 outline-none"
                                    value={paymentForm.reference}
                                    onChange={(e) => setPaymentForm({ ...paymentForm, reference: e.target.value })}
                                    placeholder="Receipt/Transaction ID"
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setShowPaymentModal(false)} className="flex-1 px-4 py-3 border border-slate-200 rounded-xl hover:bg-slate-50 font-medium text-slate-700">Cancel</button>
                                <button disabled={submitting} type="submit" className="flex-1 px-4 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 font-medium">
                                    {submitting ? 'Recording...' : 'Record Payment'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
