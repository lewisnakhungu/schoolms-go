import { useState, useEffect } from 'react';
import api from '../services/api';
import { Users, Loader2, RefreshCw, UserCheck, BookOpen, Plus, UserMinus, FileText, Search, Filter, DollarSign, AlertCircle } from 'lucide-react';

interface Student {
    id: number;
    enrollment_number: string;
    status: string;
    admission_date?: string;
    discharge_date?: string;
    discharge_reason?: string;
    User: { id: number; email: string; full_name?: string };
    Class: { id: number; name: string } | null;
    class_id: number | null;
}

interface Class {
    id: number;
    name: string;
}

interface FinancialReport {
    student: Student;
    total_fees: number;
    total_payments: number;
    balance: number;
    payments: any[];
    fee_structures: any[];
}

export default function StudentsPage() {
    const [students, setStudents] = useState<Student[]>([]);
    const [classes, setClasses] = useState<Class[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    // Modals
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [showAdmitModal, setShowAdmitModal] = useState(false);
    const [showDischargeModal, setShowDischargeModal] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

    // Form states
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteClassId, setInviteClassId] = useState<number | ''>('');
    const [admitClassId, setAdmitClassId] = useState<number | ''>('');
    const [admitEnrollmentNo, setAdmitEnrollmentNo] = useState('');
    const [dischargeReason, setDischargeReason] = useState('');
    const [financialReport, setFinancialReport] = useState<FinancialReport | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [studentsRes, classesRes] = await Promise.all([
                api.get('/students' + (statusFilter ? `?status=${statusFilter}` : '')),
                api.get('/classes')
            ]);
            setStudents(studentsRes.data || []);
            setClasses(classesRes.data || []);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [statusFilter]);

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');
        try {
            const res = await api.post('/invites', {
                email: inviteEmail,
                role: 'STUDENT',
                class_id: inviteClassId || undefined
            });
            setSuccess(`Invite sent! Code: ${res.data.code}`);
            setShowInviteModal(false);
            setInviteEmail('');
            setInviteClassId('');
            setTimeout(() => setSuccess(''), 5000);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to send invite');
        } finally {
            setSubmitting(false);
        }
    };

    const handleAdmit = async () => {
        if (!selectedStudent) return;
        setSubmitting(true);
        setError('');
        try {
            await api.post(`/students/${selectedStudent.id}/admit`, {
                class_id: admitClassId || undefined,
                enrollment_number: admitEnrollmentNo || undefined
            });
            setSuccess('Student admitted successfully!');
            setShowAdmitModal(false);
            setSelectedStudent(null);
            setAdmitClassId('');
            setAdmitEnrollmentNo('');
            fetchData();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to admit student');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDischarge = async () => {
        if (!selectedStudent || !dischargeReason) return;
        setSubmitting(true);
        setError('');
        try {
            await api.post(`/students/${selectedStudent.id}/discharge`, {
                reason: dischargeReason
            });
            setSuccess('Student discharged');
            setShowDischargeModal(false);
            setSelectedStudent(null);
            setDischargeReason('');
            fetchData();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to discharge student');
        } finally {
            setSubmitting(false);
        }
    };

    const openFinancialReport = async (student: Student) => {
        setSelectedStudent(student);
        try {
            const res = await api.get(`/students/${student.id}/financial-report`);
            setFinancialReport(res.data);
            setShowReportModal(true);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to load report');
        }
    };

    const openAdmitModal = (student: Student) => {
        setSelectedStudent(student);
        setAdmitClassId(student.Class?.id || '');
        setAdmitEnrollmentNo(student.enrollment_number || '');
        setShowAdmitModal(true);
    };

    const openDischargeModal = (student: Student) => {
        setSelectedStudent(student);
        setDischargeReason('');
        setShowDischargeModal(true);
    };

    const filteredStudents = students.filter(s => {
        const search = searchTerm.toLowerCase();
        return s.User?.email?.toLowerCase().includes(search) ||
            s.User?.full_name?.toLowerCase().includes(search) ||
            s.enrollment_number?.toLowerCase().includes(search);
    });

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            'PENDING': 'bg-amber-100 text-amber-800',
            'ENROLLED': 'bg-green-100 text-green-800',
            'DISCHARGED': 'bg-slate-100 text-slate-600'
        };
        return styles[status] || 'bg-slate-100 text-slate-600';
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
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Students</h1>
                    <p className="text-slate-500 mt-1">{students.length} students total</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowInviteModal(true)}
                        className="inline-flex items-center px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-medium transition-colors"
                    >
                        <Plus className="h-5 w-5 mr-2" />
                        Invite Student
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
                <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" />
                    {error}
                    <button onClick={() => setError('')} className="ml-auto text-red-400 hover:text-red-600">×</button>
                </div>
            )}

            {success && (
                <div className="p-4 rounded-xl bg-green-50 border border-green-100 text-green-600 text-sm">
                    {success}
                </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <StatCard label="Total" value={students.length} color="primary" />
                <StatCard label="Enrolled" value={students.filter(s => s.status === 'ENROLLED').length} color="green" />
                <StatCard label="Pending" value={students.filter(s => s.status === 'PENDING').length} color="amber" />
                <StatCard label="Discharged" value={students.filter(s => s.status === 'DISCHARGED').length} color="slate" />
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search by name or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none"
                    />
                </div>
                <div className="relative">
                    <Filter className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="pl-10 pr-8 py-2.5 border border-slate-200 rounded-xl focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none appearance-none bg-white"
                    >
                        <option value="">All Status</option>
                        <option value="PENDING">Pending</option>
                        <option value="ENROLLED">Enrolled</option>
                        <option value="DISCHARGED">Discharged</option>
                    </select>
                </div>
            </div>

            {/* Students Table */}
            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                {filteredStudents.length === 0 ? (
                    <div className="p-12 text-center">
                        <Users className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-slate-700 mb-2">No Students Yet</h3>
                        <p className="text-slate-500 mb-4">Invite students to get started.</p>
                        <button
                            onClick={() => setShowInviteModal(true)}
                            className="inline-flex items-center px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-medium transition-colors"
                        >
                            <Plus className="h-5 w-5 mr-2" />
                            Invite Student
                        </button>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm min-w-[800px]">
                            <thead className="bg-slate-50 text-slate-500 font-medium">
                                <tr>
                                    <th className="px-6 py-4 text-left">Student</th>
                                    <th className="px-6 py-4 text-left">Enrollment #</th>
                                    <th className="px-6 py-4 text-left">Class</th>
                                    <th className="px-6 py-4 text-left">Status</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredStudents.map((student) => (
                                    <tr key={student.id} className="hover:bg-slate-50/50">
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="font-medium text-slate-900">{student.User?.full_name || student.User?.email}</p>
                                                {student.User?.full_name && <p className="text-xs text-slate-500">{student.User.email}</p>}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600">{student.enrollment_number || '-'}</td>
                                        <td className="px-6 py-4">
                                            {student.Class ? (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-medium">
                                                    <BookOpen className="h-3 w-3" />
                                                    {student.Class.name}
                                                </span>
                                            ) : (
                                                <span className="text-slate-400 text-sm">Unassigned</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusBadge(student.status)}`}>
                                                {student.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex justify-end gap-1">
                                                {student.status === 'PENDING' && (
                                                    <button
                                                        onClick={() => openAdmitModal(student)}
                                                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                        title="Admit Student"
                                                    >
                                                        <UserCheck className="h-4 w-4" />
                                                    </button>
                                                )}
                                                {student.status === 'ENROLLED' && (
                                                    <>
                                                        <button
                                                            onClick={() => openAdmitModal(student)}
                                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                            title="Edit Class"
                                                        >
                                                            <BookOpen className="h-4 w-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => openFinancialReport(student)}
                                                            className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                                                            title="Financial Report"
                                                        >
                                                            <DollarSign className="h-4 w-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => openDischargeModal(student)}
                                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                            title="Discharge"
                                                        >
                                                            <UserMinus className="h-4 w-4" />
                                                        </button>
                                                    </>
                                                )}
                                                {student.status === 'DISCHARGED' && (
                                                    <span className="text-xs text-slate-400 px-2" title={student.discharge_reason}>
                                                        {student.discharge_date && new Date(student.discharge_date).toLocaleDateString()}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Invite Modal */}
            {showInviteModal && (
                <Modal title="Invite Student" onClose={() => setShowInviteModal(false)}>
                    <form onSubmit={handleInvite} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Email Address</label>
                            <input
                                required
                                type="email"
                                value={inviteEmail}
                                onChange={(e) => setInviteEmail(e.target.value)}
                                className="w-full border border-slate-200 p-3 rounded-xl focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none"
                                placeholder="student@example.com"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Pre-assign Class (Optional)</label>
                            <select
                                value={inviteClassId}
                                onChange={(e) => setInviteClassId(e.target.value ? parseInt(e.target.value) : '')}
                                className="w-full border border-slate-200 p-3 rounded-xl focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none"
                            >
                                <option value="">-- Select later --</option>
                                {classes.map((cls) => (
                                    <option key={cls.id} value={cls.id}>{cls.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex gap-3 pt-2">
                            <button type="button" onClick={() => setShowInviteModal(false)} className="flex-1 px-4 py-3 border border-slate-200 rounded-xl hover:bg-slate-50 font-medium text-slate-700">Cancel</button>
                            <button type="submit" disabled={submitting} className="flex-1 px-4 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 font-medium flex items-center justify-center gap-2">
                                {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="h-5 w-5" />}
                                Send Invite
                            </button>
                        </div>
                    </form>
                </Modal>
            )}

            {/* Admit Modal */}
            {showAdmitModal && selectedStudent && (
                <Modal title={selectedStudent.status === 'PENDING' ? 'Admit Student' : 'Update Enrollment'} onClose={() => setShowAdmitModal(false)}>
                    <div className="space-y-4">
                        <p className="text-slate-600">
                            {selectedStudent.status === 'PENDING' ? 'Admitting' : 'Updating'} <span className="font-semibold">{selectedStudent.User?.full_name || selectedStudent.User?.email}</span>
                        </p>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Assign Class</label>
                            <select
                                value={admitClassId}
                                onChange={(e) => setAdmitClassId(e.target.value ? parseInt(e.target.value) : '')}
                                className="w-full border border-slate-200 p-3 rounded-xl focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none"
                            >
                                <option value="">-- Select Class --</option>
                                {classes.map((cls) => (
                                    <option key={cls.id} value={cls.id}>{cls.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Enrollment Number</label>
                            <input
                                value={admitEnrollmentNo}
                                onChange={(e) => setAdmitEnrollmentNo(e.target.value)}
                                className="w-full border border-slate-200 p-3 rounded-xl focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none"
                                placeholder="Auto-generated if empty"
                            />
                        </div>
                        <div className="flex gap-3 pt-2">
                            <button onClick={() => setShowAdmitModal(false)} className="flex-1 px-4 py-3 border border-slate-200 rounded-xl hover:bg-slate-50 font-medium text-slate-700">Cancel</button>
                            <button onClick={handleAdmit} disabled={submitting} className="flex-1 px-4 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 font-medium flex items-center justify-center gap-2">
                                {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <UserCheck className="h-5 w-5" />}
                                {selectedStudent.status === 'PENDING' ? 'Admit' : 'Update'}
                            </button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Discharge Modal */}
            {showDischargeModal && selectedStudent && (
                <Modal title="Discharge Student" onClose={() => setShowDischargeModal(false)}>
                    <div className="space-y-4">
                        <p className="text-slate-600">
                            Discharging <span className="font-semibold">{selectedStudent.User?.full_name || selectedStudent.User?.email}</span>
                        </p>
                        <div className="p-3 bg-red-50 rounded-xl text-red-700 text-sm">
                            ⚠️ This action will remove the student from active enrollment.
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Reason for Discharge</label>
                            <textarea
                                required
                                rows={3}
                                value={dischargeReason}
                                onChange={(e) => setDischargeReason(e.target.value)}
                                className="w-full border border-slate-200 p-3 rounded-xl focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none resize-none"
                                placeholder="e.g., Graduated, Transferred, etc."
                            />
                        </div>
                        <div className="flex gap-3 pt-2">
                            <button onClick={() => setShowDischargeModal(false)} className="flex-1 px-4 py-3 border border-slate-200 rounded-xl hover:bg-slate-50 font-medium text-slate-700">Cancel</button>
                            <button onClick={handleDischarge} disabled={submitting || !dischargeReason} className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 font-medium flex items-center justify-center gap-2 disabled:opacity-50">
                                {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <UserMinus className="h-5 w-5" />}
                                Discharge
                            </button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Financial Report Modal */}
            {showReportModal && financialReport && (
                <Modal title="Financial Report" onClose={() => { setShowReportModal(false); setFinancialReport(null); }} wide>
                    <div className="space-y-4">
                        <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
                            <div className="h-12 w-12 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-bold text-lg">
                                {financialReport.student.User?.full_name?.charAt(0) || 'S'}
                            </div>
                            <div>
                                <p className="font-semibold text-slate-900">{financialReport.student.User?.full_name || financialReport.student.User?.email}</p>
                                <p className="text-sm text-slate-500">{financialReport.student.enrollment_number} • {financialReport.student.Class?.name || 'No Class'}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div className="p-4 bg-blue-50 rounded-xl text-center">
                                <p className="text-2xl font-bold text-blue-700">KES {financialReport.total_fees.toLocaleString()}</p>
                                <p className="text-sm text-blue-600">Total Fees</p>
                            </div>
                            <div className="p-4 bg-green-50 rounded-xl text-center">
                                <p className="text-2xl font-bold text-green-700">KES {financialReport.total_payments.toLocaleString()}</p>
                                <p className="text-sm text-green-600">Paid</p>
                            </div>
                            <div className={`p-4 rounded-xl text-center ${financialReport.balance > 0 ? 'bg-red-50' : 'bg-green-50'}`}>
                                <p className={`text-2xl font-bold ${financialReport.balance > 0 ? 'text-red-700' : 'text-green-700'}`}>
                                    KES {Math.abs(financialReport.balance).toLocaleString()}
                                </p>
                                <p className={`text-sm ${financialReport.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                    {financialReport.balance > 0 ? 'Balance Due' : 'Overpaid'}
                                </p>
                            </div>
                        </div>

                        {financialReport.payments.length > 0 && (
                            <div>
                                <h4 className="font-semibold text-slate-900 mb-2">Payment History</h4>
                                <div className="space-y-2 max-h-48 overflow-y-auto">
                                    {financialReport.payments.map((p: any, i: number) => (
                                        <div key={i} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg text-sm">
                                            <span className="text-slate-600">{new Date(p.payment_date).toLocaleDateString()}</span>
                                            <span className="font-medium text-green-700">+ KES {p.amount.toLocaleString()}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <button onClick={() => { setShowReportModal(false); setFinancialReport(null); }} className="w-full px-4 py-3 border border-slate-200 rounded-xl hover:bg-slate-50 font-medium text-slate-700">
                            Close
                        </button>
                    </div>
                </Modal>
            )}
        </div>
    );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
    const colorClasses: Record<string, string> = {
        primary: 'bg-primary-50 text-primary-700',
        green: 'bg-green-50 text-green-700',
        amber: 'bg-amber-50 text-amber-700',
        slate: 'bg-slate-100 text-slate-600'
    };
    return (
        <div className={`p-4 rounded-xl ${colorClasses[color]}`}>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-sm font-medium opacity-80">{label}</p>
        </div>
    );
}

function Modal({ title, onClose, children, wide }: { title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className={`bg-white rounded-2xl ${wide ? 'max-w-2xl' : 'max-w-md'} w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto`}>
                <h2 className="text-xl font-bold text-slate-900">{title}</h2>
                {children}
            </div>
        </div>
    );
}
