import { useState, useEffect } from 'react';
import { Plus, Loader2, Bell, Send, Users, User, BookOpen, AlertCircle, Trash2 } from 'lucide-react';
import api from '../services/api';

interface Notification {
    id: number;
    target_type: string;
    target_id?: number;
    title: string;
    message: string;
    category: string;
    created_at: string;
    sender?: { email: string; full_name?: string };
}

interface Class {
    id: number;
    name: string;
}

interface Student {
    id: number;
    User?: { email: string; full_name?: string };
}

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [classes, setClasses] = useState<Class[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        target_type: 'ALL',
        target_id: null as number | null,
        title: '',
        message: '',
        category: 'ANNOUNCEMENT'
    });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const fetchData = async () => {
        setLoading(true);
        try {
            const [notifRes, classRes, studentRes] = await Promise.all([
                api.get('/notifications'),
                api.get('/classes'),
                api.get('/students')
            ]);
            setNotifications(notifRes.data || []);
            setClasses(classRes.data || []);
            setStudents(studentRes.data || []);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');

        try {
            const payload = {
                ...formData,
                target_id: formData.target_type !== 'ALL' ? formData.target_id : null
            };
            await api.post('/notifications', payload);
            setFormData({ target_type: 'ALL', target_id: null, title: '', message: '', category: 'ANNOUNCEMENT' });
            setShowModal(false);
            setSuccess('Notification sent successfully!');
            fetchData();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to send notification');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Delete this notification?')) return;
        try {
            await api.delete(`/notifications/${id}`);
            fetchData();
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to delete');
        }
    };

    const getCategoryBadge = (category: string) => {
        const styles: Record<string, { bg: string; icon: string }> = {
            'FEE_REMINDER': { bg: 'bg-amber-100 text-amber-800', icon: '💰' },
            'ANNOUNCEMENT': { bg: 'bg-blue-100 text-blue-800', icon: '📢' },
            'ALERT': { bg: 'bg-red-100 text-red-800', icon: '⚠️' }
        };
        return styles[category] || { bg: 'bg-slate-100 text-slate-600', icon: '📝' };
    };

    const getTargetLabel = (notif: Notification) => {
        if (notif.target_type === 'ALL') return 'All Students';
        if (notif.target_type === 'CLASS') {
            const cls = classes.find(c => c.id === notif.target_id);
            return cls ? `Class: ${cls.name}` : 'Class';
        }
        if (notif.target_type === 'STUDENT') {
            const student = students.find(s => s.id === notif.target_id);
            return student?.User?.email || 'Student';
        }
        return 'Unknown';
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Notifications</h1>
                    <p className="text-slate-500">Send announcements and reminders to students</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="inline-flex items-center px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl shadow-sm transition-colors font-medium"
                >
                    <Plus className="h-5 w-5 mr-2" />
                    New Notification
                </button>
            </div>

            {error && (
                <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" />
                    {error}
                </div>
            )}

            {success && (
                <div className="p-4 rounded-xl bg-green-50 border border-green-100 text-green-600 text-sm">
                    {success}
                </div>
            )}

            {/* Notifications List */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 divide-y divide-slate-100">
                {notifications.length === 0 ? (
                    <div className="p-8 text-center text-slate-400">
                        <Bell className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p>No notifications sent yet</p>
                    </div>
                ) : (
                    notifications.map((notif) => {
                        const cat = getCategoryBadge(notif.category);
                        return (
                            <div key={notif.id} className="p-4 sm:p-6 hover:bg-slate-50/50 transition-colors">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-xl">{cat.icon}</span>
                                            <h3 className="font-semibold text-slate-900">{notif.title}</h3>
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${cat.bg}`}>
                                                {notif.category.replace('_', ' ')}
                                            </span>
                                        </div>
                                        <p className="text-sm text-slate-600 mb-2">{notif.message}</p>
                                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                                            <span className="flex items-center gap-1">
                                                {notif.target_type === 'ALL' && <Users className="h-3 w-3" />}
                                                {notif.target_type === 'CLASS' && <BookOpen className="h-3 w-3" />}
                                                {notif.target_type === 'STUDENT' && <User className="h-3 w-3" />}
                                                {getTargetLabel(notif)}
                                            </span>
                                            <span>{new Date(notif.created_at).toLocaleString()}</span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleDelete(notif.id)}
                                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Create Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
                        <h2 className="text-xl font-bold text-slate-900">Send Notification</h2>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Send To</label>
                                <select
                                    className="w-full border border-slate-200 p-3 rounded-xl focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none"
                                    value={formData.target_type}
                                    onChange={e => setFormData({ ...formData, target_type: e.target.value, target_id: null })}
                                >
                                    <option value="ALL">👥 All Students</option>
                                    <option value="CLASS">📚 Specific Class</option>
                                    <option value="STUDENT">👤 Specific Student</option>
                                </select>
                            </div>

                            {formData.target_type === 'CLASS' && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Select Class</label>
                                    <select
                                        required
                                        className="w-full border border-slate-200 p-3 rounded-xl focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none"
                                        value={formData.target_id || ''}
                                        onChange={e => setFormData({ ...formData, target_id: parseInt(e.target.value) })}
                                    >
                                        <option value="">Select a class...</option>
                                        {classes.map(c => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {formData.target_type === 'STUDENT' && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Select Student</label>
                                    <select
                                        required
                                        className="w-full border border-slate-200 p-3 rounded-xl focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none"
                                        value={formData.target_id || ''}
                                        onChange={e => setFormData({ ...formData, target_id: parseInt(e.target.value) })}
                                    >
                                        <option value="">Select a student...</option>
                                        {students.map(s => (
                                            <option key={s.id} value={s.id}>{s.User?.email || `Student #${s.id}`}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Category</label>
                                <select
                                    className="w-full border border-slate-200 p-3 rounded-xl focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none"
                                    value={formData.category}
                                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                                >
                                    <option value="ANNOUNCEMENT">📢 Announcement</option>
                                    <option value="FEE_REMINDER">💰 Fee Reminder</option>
                                    <option value="ALERT">⚠️ Alert</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Title</label>
                                <input
                                    required
                                    className="w-full border border-slate-200 p-3 rounded-xl focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none"
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="Notification title"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Message</label>
                                <textarea
                                    required
                                    rows={4}
                                    className="w-full border border-slate-200 p-3 rounded-xl focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none resize-none"
                                    value={formData.message}
                                    onChange={e => setFormData({ ...formData, message: e.target.value })}
                                    placeholder="Write your message..."
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 px-4 py-3 border border-slate-200 rounded-xl hover:bg-slate-50 font-medium text-slate-700 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    disabled={submitting}
                                    type="submit"
                                    className="flex-1 px-4 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 font-medium transition-colors flex items-center justify-center gap-2"
                                >
                                    {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                                    Send
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
