import { useState, useEffect } from 'react';
import { Plus, Loader2, MessageSquare, AlertCircle, Clock, CheckCircle2, Send } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

interface Ticket {
    id: number;
    subject: string;
    description: string;
    category: string;
    status: string;
    priority: string;
    response: string;
    created_at: string;
    school?: { name: string };
    user?: { email: string };
}

export default function TicketsPage() {
    const { user } = useAuth();
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
    const [formData, setFormData] = useState({
        subject: '',
        description: '',
        category: 'TECHNICAL',
        priority: 'MEDIUM'
    });
    const [responseText, setResponseText] = useState('');
    const [responseStatus, setResponseStatus] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const isSuperAdmin = user?.role === 'SUPERADMIN';

    const fetchTickets = async () => {
        setLoading(true);
        try {
            const response = await api.get('/tickets');
            setTickets(response.data || []);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to load tickets');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTickets();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');

        try {
            await api.post('/tickets', formData);
            setFormData({ subject: '', description: '', category: 'TECHNICAL', priority: 'MEDIUM' });
            setShowModal(false);
            fetchTickets();
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to create ticket');
        } finally {
            setSubmitting(false);
        }
    };

    const handleRespond = async () => {
        if (!selectedTicket) return;
        setSubmitting(true);
        setError('');

        try {
            await api.put(`/tickets/${selectedTicket.id}`, {
                status: responseStatus || selectedTicket.status,
                response: responseText
            });
            setSelectedTicket(null);
            setResponseText('');
            setResponseStatus('');
            fetchTickets();
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to respond');
        } finally {
            setSubmitting(false);
        }
    };

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            'OPEN': 'bg-blue-100 text-blue-800',
            'IN_PROGRESS': 'bg-amber-100 text-amber-800',
            'RESOLVED': 'bg-green-100 text-green-800',
            'CLOSED': 'bg-slate-100 text-slate-800'
        };
        return styles[status] || 'bg-slate-100 text-slate-600';
    };

    const getPriorityBadge = (priority: string) => {
        const styles: Record<string, string> = {
            'HIGH': 'bg-red-100 text-red-800',
            'MEDIUM': 'bg-amber-100 text-amber-800',
            'LOW': 'bg-green-100 text-green-800'
        };
        return styles[priority] || 'bg-slate-100 text-slate-600';
    };

    const getCategoryIcon = (category: string) => {
        switch (category) {
            case 'PASSWORD_RESET': return '🔑';
            case 'TECHNICAL': return '🔧';
            case 'BILLING': return '💳';
            default: return '📝';
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
                        {isSuperAdmin ? 'Support Tickets' : 'My Support Tickets'}
                    </h1>
                    <p className="text-slate-500">
                        {isSuperAdmin ? 'Manage support requests from schools' : 'Submit and track support requests'}
                    </p>
                </div>
                {!isSuperAdmin && (
                    <button
                        onClick={() => setShowModal(true)}
                        className="inline-flex items-center px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl shadow-sm transition-colors font-medium"
                    >
                        <Plus className="h-5 w-5 mr-2" />
                        New Ticket
                    </button>
                )}
            </div>

            {error && (
                <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" />
                    {error}
                </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <StatCard label="Total" value={tickets.length} color="primary" />
                <StatCard label="Open" value={tickets.filter(t => t.status === 'OPEN').length} color="blue" />
                <StatCard label="In Progress" value={tickets.filter(t => t.status === 'IN_PROGRESS').length} color="amber" />
                <StatCard label="Resolved" value={tickets.filter(t => t.status === 'RESOLVED').length} color="green" />
            </div>

            {/* Tickets List */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 divide-y divide-slate-100">
                {tickets.length === 0 ? (
                    <div className="p-8 text-center text-slate-400">
                        <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p>No tickets found</p>
                    </div>
                ) : (
                    tickets.map((ticket) => (
                        <div
                            key={ticket.id}
                            className="p-4 sm:p-6 hover:bg-slate-50/50 cursor-pointer transition-colors"
                            onClick={() => setSelectedTicket(ticket)}
                        >
                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-xl">{getCategoryIcon(ticket.category)}</span>
                                        <h3 className="font-semibold text-slate-900 truncate">{ticket.subject}</h3>
                                    </div>
                                    <p className="text-sm text-slate-500 line-clamp-2">{ticket.description}</p>
                                    {isSuperAdmin && ticket.school && (
                                        <p className="text-xs text-slate-400 mt-1">From: {ticket.school.name}</p>
                                    )}
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityBadge(ticket.priority)}`}>
                                        {ticket.priority}
                                    </span>
                                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(ticket.status)}`}>
                                        {ticket.status.replace('_', ' ')}
                                    </span>
                                    <span className="text-xs text-slate-400 flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        {new Date(ticket.created_at).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                            {ticket.response && (
                                <div className="mt-3 p-3 bg-green-50 rounded-xl text-sm text-green-800 border border-green-100">
                                    <p className="font-medium mb-1">Response:</p>
                                    <p>{ticket.response}</p>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* Create Ticket Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
                        <h2 className="text-xl font-bold text-slate-900">Submit Support Ticket</h2>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Category</label>
                                <select
                                    className="w-full border border-slate-200 p-3 rounded-xl focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none"
                                    value={formData.category}
                                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                                >
                                    <option value="PASSWORD_RESET">🔑 Password Reset</option>
                                    <option value="TECHNICAL">🔧 Technical Issue</option>
                                    <option value="BILLING">💳 Billing</option>
                                    <option value="OTHER">📝 Other</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Priority</label>
                                <select
                                    className="w-full border border-slate-200 p-3 rounded-xl focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none"
                                    value={formData.priority}
                                    onChange={e => setFormData({ ...formData, priority: e.target.value })}
                                >
                                    <option value="LOW">Low</option>
                                    <option value="MEDIUM">Medium</option>
                                    <option value="HIGH">High</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Subject</label>
                                <input
                                    required
                                    className="w-full border border-slate-200 p-3 rounded-xl focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none"
                                    value={formData.subject}
                                    onChange={e => setFormData({ ...formData, subject: e.target.value })}
                                    placeholder="Brief description of the issue"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
                                <textarea
                                    required
                                    rows={4}
                                    className="w-full border border-slate-200 p-3 rounded-xl focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none resize-none"
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Provide details about your issue..."
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
                                    Submit
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* View/Respond Modal */}
            {selectedTicket && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-start justify-between">
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="text-2xl">{getCategoryIcon(selectedTicket.category)}</span>
                                    <h2 className="text-xl font-bold text-slate-900">{selectedTicket.subject}</h2>
                                </div>
                                {isSuperAdmin && selectedTicket.school && (
                                    <p className="text-sm text-slate-500 mt-1">From: {selectedTicket.school.name}</p>
                                )}
                            </div>
                            <div className="flex gap-2">
                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityBadge(selectedTicket.priority)}`}>
                                    {selectedTicket.priority}
                                </span>
                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(selectedTicket.status)}`}>
                                    {selectedTicket.status.replace('_', ' ')}
                                </span>
                            </div>
                        </div>

                        <div className="p-4 bg-slate-50 rounded-xl">
                            <p className="text-slate-700 whitespace-pre-wrap">{selectedTicket.description}</p>
                            <p className="text-xs text-slate-400 mt-2">
                                Submitted {new Date(selectedTicket.created_at).toLocaleString()}
                            </p>
                        </div>

                        {selectedTicket.response && (
                            <div className="p-4 bg-green-50 rounded-xl border border-green-100">
                                <p className="font-medium text-green-800 mb-2 flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4" />
                                    Response from Support
                                </p>
                                <p className="text-green-700">{selectedTicket.response}</p>
                            </div>
                        )}

                        {/* SuperAdmin Response Form */}
                        {isSuperAdmin && (
                            <div className="space-y-3 pt-2 border-t border-slate-100">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Update Status</label>
                                    <select
                                        className="w-full border border-slate-200 p-3 rounded-xl focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none"
                                        value={responseStatus || selectedTicket.status}
                                        onChange={e => setResponseStatus(e.target.value)}
                                    >
                                        <option value="OPEN">Open</option>
                                        <option value="IN_PROGRESS">In Progress</option>
                                        <option value="RESOLVED">Resolved</option>
                                        <option value="CLOSED">Closed</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Response</label>
                                    <textarea
                                        rows={3}
                                        className="w-full border border-slate-200 p-3 rounded-xl focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none resize-none"
                                        value={responseText}
                                        onChange={e => setResponseText(e.target.value)}
                                        placeholder="Add a response..."
                                    />
                                </div>
                                <button
                                    onClick={handleRespond}
                                    disabled={submitting}
                                    className="w-full px-4 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 font-medium transition-colors flex items-center justify-center gap-2"
                                >
                                    {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                                    Send Response
                                </button>
                            </div>
                        )}

                        <button
                            onClick={() => { setSelectedTicket(null); setResponseText(''); setResponseStatus(''); }}
                            className="w-full px-4 py-3 border border-slate-200 rounded-xl hover:bg-slate-50 font-medium text-slate-700 transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
    const colorClasses: Record<string, string> = {
        primary: 'bg-primary-50 text-primary-700',
        blue: 'bg-blue-50 text-blue-700',
        amber: 'bg-amber-50 text-amber-700',
        green: 'bg-green-50 text-green-700'
    };
    return (
        <div className={`p-4 rounded-xl ${colorClasses[color]}`}>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-sm font-medium opacity-80">{label}</p>
        </div>
    );
}
