import { useState, useEffect } from 'react';
import api from '../services/api';
import { Loader2, Plus, Building2, Calendar, MapPin, Phone, User, Check, Clock, X, Edit2, Save } from 'lucide-react';

interface Attachment {
    id: number;
    student_id: number;
    company_name: string;
    company_address: string;
    supervisor_name: string;
    supervisor_phone: string;
    start_date: string;
    duration_weeks: number;
    status: string;
    logbook_grade: string;
    supervisor_grade: string;
    final_grade: string;
    student?: { user?: { email: string } };
}

interface Student {
    id: number;
    enrollment_number: string;
    user?: { email: string };
}

const STATUS_COLORS: Record<string, string> = {
    PLANNED: 'bg-blue-100 text-blue-700',
    ONGOING: 'bg-amber-100 text-amber-700',
    COMPLETED: 'bg-green-100 text-green-700',
    CANCELLED: 'bg-red-100 text-red-700',
};

const GRADES = ['A', 'B', 'C', 'D', 'E'];

export default function IndustrialAttachmentPage() {
    const [loading, setLoading] = useState(true);
    const [attachments, setAttachments] = useState<Attachment[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [saving, setSaving] = useState(false);
    const [statusFilter, setStatusFilter] = useState('');
    const [form, setForm] = useState({
        student_id: 0,
        company_name: '',
        company_address: '',
        supervisor_name: '',
        supervisor_phone: '',
        duration_weeks: 12,
    });

    useEffect(() => {
        fetchAttachments();
        fetchStudents();
    }, [statusFilter]);

    const fetchAttachments = async () => {
        setLoading(true);
        try {
            const url = statusFilter ? `/tvet/attachments?status=${statusFilter}` : '/tvet/attachments';
            const res = await api.get(url);
            setAttachments(res.data || []);
        } catch (err) {
            console.error('Failed to fetch attachments');
        } finally {
            setLoading(false);
        }
    };

    const fetchStudents = async () => {
        try {
            const res = await api.get('/students');
            setStudents(res.data || []);
        } catch (err) {
            console.error('Failed to fetch students');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            if (editingId) {
                await api.put(`/tvet/attachments/${editingId}`, form);
            } else {
                await api.post('/tvet/attachments', form);
            }
            setShowModal(false);
            setEditingId(null);
            resetForm();
            fetchAttachments();
        } catch (err) {
            console.error('Failed to save');
        } finally {
            setSaving(false);
        }
    };

    const handleGrade = async (id: number, field: string, value: string) => {
        try {
            await api.put(`/tvet/attachments/${id}`, { [field]: value });
            fetchAttachments();
        } catch (err) {
            console.error('Failed to update grade');
        }
    };

    const handleStatusChange = async (id: number, status: string) => {
        try {
            await api.put(`/tvet/attachments/${id}`, { status });
            fetchAttachments();
        } catch (err) {
            console.error('Failed to update status');
        }
    };

    const resetForm = () => {
        setForm({
            student_id: 0,
            company_name: '',
            company_address: '',
            supervisor_name: '',
            supervisor_phone: '',
            duration_weeks: 12,
        });
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
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Industrial Attachments</h1>
                    <p className="text-slate-500">Track TVET student workplace training</p>
                </div>
                <button
                    onClick={() => { setEditingId(null); resetForm(); setShowModal(true); }}
                    className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    New Attachment
                </button>
            </div>

            {/* Filters */}
            <div className="flex gap-2">
                {['', 'PLANNED', 'ONGOING', 'COMPLETED'].map((status) => (
                    <button
                        key={status || 'all'}
                        onClick={() => setStatusFilter(status)}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${statusFilter === status
                                ? 'bg-primary-600 text-white'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                    >
                        {status || 'All'}
                    </button>
                ))}
            </div>

            {/* Attachments List */}
            <div className="grid gap-4">
                {attachments.length === 0 ? (
                    <div className="bg-white rounded-2xl p-8 text-center text-slate-400">
                        <Building2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p>No attachments found</p>
                    </div>
                ) : (
                    attachments.map((att) => (
                        <div key={att.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
                            <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                                {/* Main Info */}
                                <div className="flex-1">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h3 className="font-bold text-lg text-slate-900">{att.company_name}</h3>
                                            <p className="text-sm text-slate-500 flex items-center gap-1">
                                                <User className="h-3 w-3" />
                                                {att.student?.user?.email || `Student #${att.student_id}`}
                                            </p>
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[att.status] || 'bg-slate-100'}`}>
                                            {att.status}
                                        </span>
                                    </div>
                                    <div className="mt-3 grid sm:grid-cols-2 gap-2 text-sm">
                                        {att.company_address && (
                                            <p className="text-slate-600 flex items-center gap-2">
                                                <MapPin className="h-4 w-4 text-slate-400" />
                                                {att.company_address}
                                            </p>
                                        )}
                                        {att.supervisor_name && (
                                            <p className="text-slate-600 flex items-center gap-2">
                                                <User className="h-4 w-4 text-slate-400" />
                                                {att.supervisor_name}
                                            </p>
                                        )}
                                        {att.supervisor_phone && (
                                            <p className="text-slate-600 flex items-center gap-2">
                                                <Phone className="h-4 w-4 text-slate-400" />
                                                {att.supervisor_phone}
                                            </p>
                                        )}
                                        <p className="text-slate-600 flex items-center gap-2">
                                            <Clock className="h-4 w-4 text-slate-400" />
                                            {att.duration_weeks} weeks
                                        </p>
                                    </div>
                                </div>

                                {/* Grades */}
                                <div className="flex gap-3">
                                    <div className="text-center">
                                        <p className="text-xs text-slate-400 mb-1">Logbook</p>
                                        <select
                                            value={att.logbook_grade || ''}
                                            onChange={(e) => handleGrade(att.id, 'logbook_grade', e.target.value)}
                                            className="p-2 border rounded-lg text-center w-16"
                                        >
                                            <option value="">-</option>
                                            {GRADES.map((g) => <option key={g} value={g}>{g}</option>)}
                                        </select>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-xs text-slate-400 mb-1">Supervisor</p>
                                        <select
                                            value={att.supervisor_grade || ''}
                                            onChange={(e) => handleGrade(att.id, 'supervisor_grade', e.target.value)}
                                            className="p-2 border rounded-lg text-center w-16"
                                        >
                                            <option value="">-</option>
                                            {GRADES.map((g) => <option key={g} value={g}>{g}</option>)}
                                        </select>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-xs text-slate-400 mb-1">Final</p>
                                        <select
                                            value={att.final_grade || ''}
                                            onChange={(e) => handleGrade(att.id, 'final_grade', e.target.value)}
                                            className="p-2 border rounded-lg text-center w-16"
                                        >
                                            <option value="">-</option>
                                            {GRADES.map((g) => <option key={g} value={g}>{g}</option>)}
                                        </select>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2 lg:flex-col">
                                    {att.status === 'PLANNED' && (
                                        <button
                                            onClick={() => handleStatusChange(att.id, 'ONGOING')}
                                            className="p-2 bg-amber-50 text-amber-600 rounded-lg hover:bg-amber-100"
                                            title="Start"
                                        >
                                            <Clock className="h-4 w-4" />
                                        </button>
                                    )}
                                    {att.status === 'ONGOING' && (
                                        <button
                                            onClick={() => handleStatusChange(att.id, 'COMPLETED')}
                                            className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100"
                                            title="Complete"
                                        >
                                            <Check className="h-4 w-4" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Add Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-slate-900">New Attachment</h2>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Student</label>
                                <select
                                    required
                                    value={form.student_id}
                                    onChange={(e) => setForm({ ...form, student_id: parseInt(e.target.value) })}
                                    className="w-full p-3 border border-slate-200 rounded-xl"
                                >
                                    <option value={0}>Select Student</option>
                                    {students.map((s) => (
                                        <option key={s.id} value={s.id}>
                                            {s.enrollment_number} - {s.user?.email}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Company Name</label>
                                <input
                                    required
                                    value={form.company_name}
                                    onChange={(e) => setForm({ ...form, company_name: e.target.value })}
                                    className="w-full p-3 border border-slate-200 rounded-xl"
                                    placeholder="Kenya Power & Lighting"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Company Address</label>
                                <input
                                    value={form.company_address}
                                    onChange={(e) => setForm({ ...form, company_address: e.target.value })}
                                    className="w-full p-3 border border-slate-200 rounded-xl"
                                    placeholder="Nairobi, Kenya"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Supervisor</label>
                                    <input
                                        value={form.supervisor_name}
                                        onChange={(e) => setForm({ ...form, supervisor_name: e.target.value })}
                                        className="w-full p-3 border border-slate-200 rounded-xl"
                                        placeholder="John Doe"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                                    <input
                                        value={form.supervisor_phone}
                                        onChange={(e) => setForm({ ...form, supervisor_phone: e.target.value })}
                                        className="w-full p-3 border border-slate-200 rounded-xl"
                                        placeholder="0722000000"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Duration (weeks)</label>
                                <input
                                    type="number"
                                    value={form.duration_weeks}
                                    onChange={(e) => setForm({ ...form, duration_weeks: parseInt(e.target.value) })}
                                    className="w-full p-3 border border-slate-200 rounded-xl"
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex-1 py-3 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 flex items-center justify-center gap-2"
                                >
                                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                    Save
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
