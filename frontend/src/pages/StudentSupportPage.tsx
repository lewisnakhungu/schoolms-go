import { useState, useEffect } from 'react';
import { Plus, Loader2, MessageSquare, AlertCircle, Clock, CheckCircle2, Send } from 'lucide-react';
import api from '../services/api';

interface Ticket {
    id: number;
    subject: string;
    description: string;
    category: string;
    status: string;
    priority: string;
    response: string;
    created_at: string;
}

export default function StudentSupportPage() {
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
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const fetchTickets = async () => {
        setLoading(true);
        try {
            const response = await api.get('/tickets/my');
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
            setSuccess('Ticket submitted successfully! We will get back to you soon.');
            fetchTickets();
            setTimeout(() => setSuccess(''), 5000);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to submit ticket');
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
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Need Help?</h1>
                    <p className="text-slate-500">Submit a ticket and we'll assist you</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="inline-flex items-center px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl shadow-sm transition-colors font-medium"
                >
                    <Plus className="h-5 w-5 mr-2" />
                    New Request
                </button>
            </div>

            {error && (
                <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" />
                    {error}
                </div>
            )}

            {success && (
                <div className="p-4 rounded-xl bg-green-50 border border-green-100 text-green-600 text-sm flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5" />
                    {success}
                </div>
            )}

            {/* Quick Actions */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <button
                    onClick={() => { setFormData({ ...formData, category: 'PASSWORD_RESET' }); setShowModal(true); }}
                    className="p-4 bg-white rounded-2xl border border-slate-100 hover:border-primary-200 hover:bg-primary-50/50 transition-all text-left"
                >
                    <span className="text-2xl mb-2 block">🔑</span>
                    <p className="font-medium text-slate-900">Password Reset</p>
                    <p className="text-xs text-slate-500">Can't access account</p>
                </button>
                <button
                    onClick={() => { setFormData({ ...formData, category: 'TECHNICAL' }); setShowModal(true); }}
                    className="p-4 bg-white rounded-2xl border border-slate-100 hover:border-primary-200 hover:bg-primary-50/50 transition-all text-left"
                >
                    <span className="text-2xl mb-2 block">🔧</span>
                    <p className="font-medium text-slate-900">Technical Issue</p>
                    <p className="text-xs text-slate-500">Something not working</p>
                </button>
                <button
                    onClick={() => { setFormData({ ...formData, category: 'BILLING' }); setShowModal(true); }}
                    className="p-4 bg-white rounded-2xl border border-slate-100 hover:border-primary-200 hover:bg-primary-50/50 transition-all text-left"
                >
                    <span className="text-2xl mb-2 block">💳</span>
                    <p className="font-medium text-slate-900">Payment Issue</p>
                    <p className="text-xs text-slate-500">Fees or payments</p>
                </button>
                <button
                    onClick={() => { setFormData({ ...formData, category: 'OTHER' }); setShowModal(true); }}
                    className="p-4 bg-white rounded-2xl border border-slate-100 hover:border-primary-200 hover:bg-primary-50/50 transition-all text-left"
                >
                    <span className="text-2xl mb-2 block">📝</span>
                    <p className="font-medium text-slate-900">Other</p>
                    <p className="text-xs text-slate-500">General questions</p>
                </button>
            </div>

            {/* Tickets List */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100">
                <div className="p-4 border-b border-slate-100">
                    <h2 className="font-semibold text-slate-900">My Requests</h2>
                </div>
                {tickets.length === 0 ? (
                    <div className="p-8 text-center text-slate-400">
                        <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p>No requests yet</p>
                        <p className="text-sm">Submit a request if you need help</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {tickets.map((ticket) => (
                            <div
                                key={ticket.id}
                                className="p-4 hover:bg-slate-50/50 cursor-pointer transition-colors"
                                onClick={() => setSelectedTicket(ticket)}
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-lg">{getCategoryIcon(ticket.category)}</span>
                                            <h3 className="font-medium text-slate-900 truncate">{ticket.subject}</h3>
                                        </div>
                                        <p className="text-sm text-slate-500 line-clamp-1">{ticket.description}</p>
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(ticket.status)}`}>
                                            {ticket.status.replace('_', ' ')}
                                        </span>
                                        <span className="text-xs text-slate-400 flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            {new Date(ticket.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                                {ticket.response && (
                                    <div className="mt-2 p-2 bg-green-50 rounded-lg text-sm text-green-700 border border-green-100">
                                        <span className="font-medium">Response:</span> {ticket.response}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Create Ticket Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
                        <h2 className="text-xl font-bold text-slate-900">Submit a Request</h2>

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
                                    <option value="BILLING">💳 Payment Issue</option>
                                    <option value="OTHER">📝 Other</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Subject</label>
                                <input
                                    required
                                    className="w-full border border-slate-200 p-3 rounded-xl focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none"
                                    value={formData.subject}
                                    onChange={e => setFormData({ ...formData, subject: e.target.value })}
                                    placeholder="Brief description of your issue"
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
                                    placeholder="Please describe your issue in detail..."
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

            {/* View Ticket Modal */}
            {selectedTicket && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
                        <div className="flex items-start justify-between">
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="text-2xl">{getCategoryIcon(selectedTicket.category)}</span>
                                    <h2 className="text-xl font-bold text-slate-900">{selectedTicket.subject}</h2>
                                </div>
                            </div>
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(selectedTicket.status)}`}>
                                {selectedTicket.status.replace('_', ' ')}
                            </span>
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

                        {!selectedTicket.response && (
                            <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
                                <p className="text-amber-700 text-sm">
                                    ⏳ Waiting for response. We'll get back to you soon!
                                </p>
                            </div>
                        )}

                        <button
                            onClick={() => setSelectedTicket(null)}
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
