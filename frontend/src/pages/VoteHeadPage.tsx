import { useState, useEffect } from 'react';
import api from '../services/api';
import { Loader2, Plus, GripVertical, Trash2, Edit2, X, Save, DollarSign, ArrowUpDown } from 'lucide-react';

interface VoteHead {
    id: number;
    name: string;
    priority: number;
    is_active: boolean;
}

export default function VoteHeadPage() {
    const [loading, setLoading] = useState(true);
    const [voteHeads, setVoteHeads] = useState<VoteHead[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [name, setName] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchVoteHeads();
    }, []);

    const fetchVoteHeads = async () => {
        setLoading(true);
        try {
            const res = await api.get('/vote-heads');
            setVoteHeads(res.data || []);
        } catch (err) {
            console.error('Failed to fetch vote heads');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        setSaving(true);
        setError('');
        try {
            if (editingId) {
                await api.put(`/vote-heads/${editingId}`, { name });
            } else {
                await api.post('/vote-heads', { name });
            }
            setShowModal(false);
            setEditingId(null);
            setName('');
            fetchVoteHeads();
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to save');
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (vh: VoteHead) => {
        setEditingId(vh.id);
        setName(vh.name);
        setShowModal(true);
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Deactivate this vote head?')) return;
        try {
            await api.delete(`/vote-heads/${id}`);
            fetchVoteHeads();
        } catch (err) {
            console.error('Failed to delete');
        }
    };

    const handleReorder = async (id: number, direction: 'up' | 'down') => {
        const index = voteHeads.findIndex(vh => vh.id === id);
        if (index === -1) return;

        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= voteHeads.length) return;

        const newOrder = [...voteHeads];
        [newOrder[index], newOrder[newIndex]] = [newOrder[newIndex], newOrder[index]];

        // Update priorities
        const order = newOrder.map((vh, i) => ({ id: vh.id, priority: i + 1 }));

        try {
            await api.put('/vote-heads/reorder', { order });
            setVoteHeads(newOrder.map((vh, i) => ({ ...vh, priority: i + 1 })));
        } catch (err) {
            console.error('Failed to reorder');
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
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Vote Heads</h1>
                    <p className="text-slate-500">Kenya-style fee allocation buckets (priority order)</p>
                </div>
                <button
                    onClick={() => { setEditingId(null); setName(''); setShowModal(true); }}
                    className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Vote Head
                </button>
            </div>

            {/* Info Card */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100 rounded-2xl p-5">
                <div className="flex items-start gap-3">
                    <DollarSign className="h-6 w-6 text-green-600 mt-0.5" />
                    <div>
                        <h3 className="font-semibold text-green-800">Priority-Based Allocation</h3>
                        <p className="text-green-700 text-sm mt-1">
                            When payments come in, funds are allocated to vote heads in priority order.
                            Higher priority (lower number) gets paid first. Drag to reorder.
                        </p>
                    </div>
                </div>
            </div>

            {/* Vote Heads List */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50">
                    <div className="grid grid-cols-12 text-sm font-medium text-slate-500">
                        <div className="col-span-1">Priority</div>
                        <div className="col-span-7">Name</div>
                        <div className="col-span-2">Status</div>
                        <div className="col-span-2 text-right">Actions</div>
                    </div>
                </div>

                <div className="divide-y divide-slate-100">
                    {voteHeads.length === 0 ? (
                        <div className="p-8 text-center text-slate-400">
                            <DollarSign className="h-12 w-12 mx-auto mb-3 opacity-50" />
                            <p>No vote heads yet. Add your first one!</p>
                        </div>
                    ) : (
                        voteHeads.map((vh, index) => (
                            <div key={vh.id} className="p-4 grid grid-cols-12 items-center hover:bg-slate-50">
                                <div className="col-span-1">
                                    <div className="flex items-center gap-1">
                                        <span className="inline-flex items-center justify-center h-8 w-8 rounded-lg bg-primary-100 text-primary-700 font-bold">
                                            {vh.priority}
                                        </span>
                                        <div className="flex flex-col">
                                            <button
                                                onClick={() => handleReorder(vh.id, 'up')}
                                                disabled={index === 0}
                                                className="p-0.5 text-slate-400 hover:text-primary-600 disabled:opacity-30"
                                            >
                                                <ArrowUpDown className="h-3 w-3 rotate-180" />
                                            </button>
                                            <button
                                                onClick={() => handleReorder(vh.id, 'down')}
                                                disabled={index === voteHeads.length - 1}
                                                className="p-0.5 text-slate-400 hover:text-primary-600 disabled:opacity-30"
                                            >
                                                <ArrowUpDown className="h-3 w-3" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-span-7">
                                    <p className="font-medium text-slate-900">{vh.name}</p>
                                </div>
                                <div className="col-span-2">
                                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${vh.is_active
                                            ? 'bg-green-100 text-green-700'
                                            : 'bg-slate-100 text-slate-500'
                                        }`}>
                                        {vh.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
                                <div className="col-span-2 flex justify-end gap-2">
                                    <button
                                        onClick={() => handleEdit(vh)}
                                        className="p-2 text-slate-400 hover:text-primary-600 rounded-lg hover:bg-primary-50"
                                    >
                                        <Edit2 className="h-4 w-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(vh.id)}
                                        className="p-2 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-slate-900">
                                {editingId ? 'Edit Vote Head' : 'Add Vote Head'}
                            </h2>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {error && (
                            <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm">{error}</div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Vote Head Name
                                </label>
                                <input
                                    required
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="e.g., Tuition, R&MI, Activity Fee"
                                    className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none"
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
