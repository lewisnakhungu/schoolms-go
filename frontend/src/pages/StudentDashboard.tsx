import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { CreditCard, BookOpen, Clock, Loader2, AlertCircle, CheckCircle } from 'lucide-react';

export default function StudentDashboard() {
    const { user } = useAuth();
    const [balance, setBalance] = useState<number | null>(null);
    const [totalFees, setTotalFees] = useState<number>(0);
    const [totalPayments, setTotalPayments] = useState<number>(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchBalance = async () => {
            if (user?.id) {
                try {
                    // Use /my-balance endpoint which identifies student from JWT token
                    const response = await api.get('/finance/my-balance');
                    setBalance(response.data.balance);
                    setTotalFees(response.data.total_fees || 0);
                    setTotalPayments(response.data.total_payments || 0);
                } catch (err: any) {
                    console.error("Failed to fetch balance", err);
                    if (err.response?.status === 404) {
                        setError('Student profile not found. Please contact your school administrator.');
                    } else {
                        setBalance(0);
                    }
                } finally {
                    setLoading(false);
                }
            } else {
                setLoading(false);
            }
        };
        fetchBalance();
    }, [user]);

    const studentName = user?.email?.split('@')[0] || 'Student';
    const isInGoodStanding = balance !== null && balance <= 0;

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

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                {/* Balance Card */}
                <div className={`p-4 sm:p-6 rounded-2xl shadow-sm border transition-shadow hover:shadow-md relative overflow-hidden ${isInGoodStanding ? 'bg-green-50 border-green-100' : 'bg-white border-slate-100'
                    }`}>
                    <div className="flex items-center space-x-3 mb-3">
                        <div className={`p-2 rounded-xl ${isInGoodStanding ? 'bg-green-100' : 'bg-primary-50'}`}>
                            <CreditCard className={`h-5 w-5 ${isInGoodStanding ? 'text-green-600' : 'text-primary-600'}`} />
                        </div>
                        <span className="font-semibold text-slate-700">Fee Balance</span>
                    </div>
                    <div className="text-2xl sm:text-3xl font-bold text-slate-900">
                        {loading ? (
                            <Loader2 className="h-6 w-6 text-slate-300 animate-spin" />
                        ) : (
                            `$${Math.abs(balance || 0).toFixed(2)}`
                        )}
                    </div>
                    <p className="text-sm text-slate-500 mt-2 flex items-center gap-1">
                        {isInGoodStanding ? (
                            <>
                                <CheckCircle className="h-4 w-4 text-green-500" />
                                Account in good standing
                            </>
                        ) : (
                            balance !== null && balance > 0 ? 'Amount owing' : ''
                        )}
                    </p>
                </div>

                {/* Total Fees Card */}
                <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                    <div className="flex items-center space-x-3 mb-3">
                        <div className="p-2 bg-indigo-50 rounded-xl">
                            <BookOpen className="h-5 w-5 text-indigo-600" />
                        </div>
                        <span className="font-semibold text-slate-700">Total Fees</span>
                    </div>
                    <div className="text-2xl sm:text-3xl font-bold text-slate-900">
                        {loading ? <Loader2 className="h-6 w-6 text-slate-300 animate-spin" /> : `$${totalFees.toFixed(2)}`}
                    </div>
                    <p className="text-sm text-slate-500 mt-2">This academic year</p>
                </div>

                {/* Total Payments Card */}
                <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                    <div className="flex items-center space-x-3 mb-3">
                        <div className="p-2 bg-violet-50 rounded-xl">
                            <Clock className="h-5 w-5 text-violet-600" />
                        </div>
                        <span className="font-semibold text-slate-700">Total Paid</span>
                    </div>
                    <div className="text-2xl sm:text-3xl font-bold text-slate-900">
                        {loading ? <Loader2 className="h-6 w-6 text-slate-300 animate-spin" /> : `$${totalPayments.toFixed(2)}`}
                    </div>
                    <p className="text-sm text-slate-500 mt-2">Payments made</p>
                </div>
            </div>

            {/* Info Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 sm:p-6">
                <h2 className="text-lg font-bold text-slate-900 mb-4">Account Information</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50 rounded-xl">
                        <p className="text-sm text-slate-500">Email</p>
                        <p className="font-medium text-slate-900">{user?.email || 'N/A'}</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-xl">
                        <p className="text-sm text-slate-500">School ID</p>
                        <p className="font-medium text-slate-900">{user?.school_id || 'N/A'}</p>
                    </div>
                </div>
            </div>

            {/* Notice */}
            <div className="bg-primary-50 rounded-2xl p-4 sm:p-6 border border-primary-100">
                <h3 className="font-semibold text-primary-900 mb-2">Need Help?</h3>
                <p className="text-sm text-primary-700">
                    If you have questions about your fees or payments, please contact your school administrator for assistance.
                </p>
            </div>
        </div>
    );
}
