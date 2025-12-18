import { useState, useEffect } from 'react';
import api from '../services/api';
import { CreditCard, Plus, Loader2, RefreshCw, DollarSign, Receipt, BookOpen } from 'lucide-react';

interface Class {
    ID: number;
    name: string;
}

interface Student {
    ID: number;
    User: { email: string };
    Class: { name: string } | null;
}



export default function FinancePage() {
    const [classes, setClasses] = useState<Class[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Fee modal state
    const [showFeeModal, setShowFeeModal] = useState(false);
    const [feeClassId, setFeeClassId] = useState<number | ''>('');
    const [feeAmount, setFeeAmount] = useState('');
    const [feeYear, setFeeYear] = useState(new Date().getFullYear().toString());
    const [submittingFee, setSubmittingFee] = useState(false);

    // Payment modal state
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [paymentStudentId, setPaymentStudentId] = useState<number | ''>('');
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('CASH');
    const [paymentReference, setPaymentReference] = useState('');
    const [submittingPayment, setSubmittingPayment] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [classesRes, studentsRes] = await Promise.all([
                api.get('/classes'),
                api.get('/students')
            ]);
            setClasses(classesRes.data || []);
            setStudents(studentsRes.data || []);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleCreateFee = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!feeClassId || !feeAmount) return;
        setSubmittingFee(true);
        setError('');
        setSuccess('');
        try {
            await api.post('/finance/fees', {
                class_id: feeClassId,
                amount: parseFloat(feeAmount),
                academic_year: feeYear
            });
            setSuccess('Fee structure created successfully!');
            setShowFeeModal(false);
            setFeeClassId('');
            setFeeAmount('');
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to create fee structure');
        } finally {
            setSubmittingFee(false);
        }
    };

    const handleRecordPayment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!paymentStudentId || !paymentAmount) return;
        setSubmittingPayment(true);
        setError('');
        setSuccess('');
        try {
            await api.post('/finance/payments', {
                student_id: paymentStudentId,
                amount: parseFloat(paymentAmount),
                method: paymentMethod,
                reference: paymentReference
            });
            setSuccess('Payment recorded successfully!');
            setShowPaymentModal(false);
            setPaymentStudentId('');
            setPaymentAmount('');
            setPaymentReference('');
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to record payment');
        } finally {
            setSubmittingPayment(false);
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
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Finance</h1>
                    <p className="text-slate-500 mt-1">Manage fees and payments</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowFeeModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors shadow-sm"
                    >
                        <DollarSign className="h-4 w-4" />
                        <span className="hidden sm:inline">Add Fee Structure</span>
                        <span className="sm:hidden">Fee</span>
                    </button>
                    <button
                        onClick={() => setShowPaymentModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors shadow-sm"
                    >
                        <Receipt className="h-4 w-4" />
                        <span className="hidden sm:inline">Record Payment</span>
                        <span className="sm:hidden">Pay</span>
                    </button>
                    <button
                        onClick={fetchData}
                        className="p-2 text-slate-500 hover:text-primary-600 hover:bg-slate-100 rounded-xl transition-colors"
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

            {success && (
                <div className="p-4 rounded-xl bg-green-50 border border-green-100 text-green-600 text-sm">
                    {success}
                </div>
            )}

            {/* Quick Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white p-6 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-indigo-50 rounded-xl">
                            <BookOpen className="h-5 w-5 text-indigo-600" />
                        </div>
                        <span className="font-medium text-slate-700">Classes</span>
                    </div>
                    <p className="text-2xl font-bold text-slate-900">{classes.length}</p>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-primary-50 rounded-xl">
                            <CreditCard className="h-5 w-5 text-primary-600" />
                        </div>
                        <span className="font-medium text-slate-700">Students</span>
                    </div>
                    <p className="text-2xl font-bold text-slate-900">{students.length}</p>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-green-50 rounded-xl">
                            <DollarSign className="h-5 w-5 text-green-600" />
                        </div>
                        <span className="font-medium text-slate-700">Academic Year</span>
                    </div>
                    <p className="text-2xl font-bold text-slate-900">{new Date().getFullYear()}</p>
                </div>
            </div>

            {/* Instructions */}
            <div className="bg-primary-50 rounded-2xl p-6 border border-primary-100">
                <h3 className="font-semibold text-primary-900 mb-2">How Finance Works</h3>
                <ol className="list-decimal list-inside text-sm text-primary-700 space-y-1">
                    <li><strong>Create Fee Structures</strong> for each class (e.g., Grade 10 = $500/year)</li>
                    <li><strong>Record Payments</strong> when students pay their fees</li>
                    <li>View <strong>Defaulters</strong> in the Reports section to see unpaid balances</li>
                </ol>
            </div>

            {/* Fee Structure Modal */}
            {showFeeModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
                        <h2 className="text-xl font-bold text-slate-900">Create Fee Structure</h2>
                        <form onSubmit={handleCreateFee} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Class</label>
                                <select
                                    value={feeClassId}
                                    onChange={(e) => setFeeClassId(e.target.value ? parseInt(e.target.value) : '')}
                                    required
                                    className="w-full border border-slate-200 p-3 rounded-xl focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none"
                                >
                                    <option value="">-- Select class --</option>
                                    {classes.map((cls) => (
                                        <option key={cls.ID} value={cls.ID}>{cls.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Amount ($)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    required
                                    value={feeAmount}
                                    onChange={(e) => setFeeAmount(e.target.value)}
                                    placeholder="500.00"
                                    className="w-full border border-slate-200 p-3 rounded-xl focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Academic Year</label>
                                <input
                                    type="text"
                                    required
                                    value={feeYear}
                                    onChange={(e) => setFeeYear(e.target.value)}
                                    placeholder="2024"
                                    className="w-full border border-slate-200 p-3 rounded-xl focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none"
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowFeeModal(false)}
                                    className="flex-1 px-4 py-3 border border-slate-200 rounded-xl hover:bg-slate-50 font-medium text-slate-700"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submittingFee}
                                    className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-medium flex items-center justify-center gap-2"
                                >
                                    {submittingFee ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="h-5 w-5" />}
                                    Create
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Payment Modal */}
            {showPaymentModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
                        <h2 className="text-xl font-bold text-slate-900">Record Payment</h2>
                        <form onSubmit={handleRecordPayment} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Student</label>
                                <select
                                    value={paymentStudentId}
                                    onChange={(e) => setPaymentStudentId(e.target.value ? parseInt(e.target.value) : '')}
                                    required
                                    className="w-full border border-slate-200 p-3 rounded-xl focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none"
                                >
                                    <option value="">-- Select student --</option>
                                    {students.map((s) => (
                                        <option key={s.ID} value={s.ID}>
                                            {s.User?.email} {s.Class ? `(${s.Class.name})` : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Amount ($)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    required
                                    value={paymentAmount}
                                    onChange={(e) => setPaymentAmount(e.target.value)}
                                    placeholder="100.00"
                                    className="w-full border border-slate-200 p-3 rounded-xl focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Payment Method</label>
                                <select
                                    value={paymentMethod}
                                    onChange={(e) => setPaymentMethod(e.target.value)}
                                    className="w-full border border-slate-200 p-3 rounded-xl focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none"
                                >
                                    <option value="CASH">Cash</option>
                                    <option value="BANK_TRANSFER">Bank Transfer</option>
                                    <option value="MOBILE_MONEY">Mobile Money</option>
                                    <option value="CHECK">Check</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Reference (Optional)</label>
                                <input
                                    type="text"
                                    value={paymentReference}
                                    onChange={(e) => setPaymentReference(e.target.value)}
                                    placeholder="REC-001 or Transaction ID"
                                    className="w-full border border-slate-200 p-3 rounded-xl focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none"
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowPaymentModal(false)}
                                    className="flex-1 px-4 py-3 border border-slate-200 rounded-xl hover:bg-slate-50 font-medium text-slate-700"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submittingPayment}
                                    className="flex-1 px-4 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 font-medium flex items-center justify-center gap-2"
                                >
                                    {submittingPayment ? <Loader2 className="h-5 w-5 animate-spin" /> : <Receipt className="h-5 w-5" />}
                                    Record
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
