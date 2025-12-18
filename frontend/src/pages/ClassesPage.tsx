import { useState, useEffect } from 'react';
import api from '../services/api';
import { BookOpen, Plus, Loader2, RefreshCw, Users } from 'lucide-react';

interface Class {
    ID: number;
    name: string;
    Teacher?: { email: string } | null;
    CreatedAt: string;
}

export default function ClassesPage() {
    const [classes, setClasses] = useState<Class[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [className, setClassName] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const fetchClasses = async () => {
        setLoading(true);
        try {
            const response = await api.get('/classes');
            setClasses(response.data || []);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to load classes');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchClasses();
    }, []);

    const handleCreateClass = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');
        try {
            await api.post('/classes', { name: className });
            setClassName('');
            setShowModal(false);
            fetchClasses();
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to create class');
        } finally {
            setSubmitting(false);
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
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Classes</h1>
                    <p className="text-slate-500 mt-1">Manage your school's classes</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 transition-colors shadow-sm"
                    >
                        <Plus className="h-4 w-4" />
                        <span>Add Class</span>
                    </button>
                    <button
                        onClick={fetchClasses}
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

            {/* Classes Grid */}
            {classes.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
                    <BookOpen className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-slate-700 mb-2">No Classes Yet</h3>
                    <p className="text-slate-500 mb-4">Create your first class to get started.</p>
                    <button
                        onClick={() => setShowModal(true)}
                        className="px-4 py-2 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 transition-colors"
                    >
                        Create Class
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {classes.map((cls) => (
                        <div key={cls.ID} className="bg-white rounded-2xl border border-slate-100 p-6 hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between mb-4">
                                <div className="p-3 bg-indigo-50 rounded-xl">
                                    <BookOpen className="h-6 w-6 text-indigo-600" />
                                </div>
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-1">{cls.name}</h3>
                            <p className="text-sm text-slate-500 flex items-center gap-1">
                                <Users className="h-4 w-4" />
                                {cls.Teacher?.email || 'No teacher assigned'}
                            </p>
                            <div className="mt-4 pt-4 border-t border-slate-100">
                                <p className="text-xs text-slate-400">
                                    Created {new Date(cls.CreatedAt).toLocaleDateString()}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
                        <h2 className="text-xl font-bold text-slate-900">Create New Class</h2>
                        <form onSubmit={handleCreateClass} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Class Name</label>
                                <input
                                    type="text"
                                    required
                                    value={className}
                                    onChange={(e) => setClassName(e.target.value)}
                                    placeholder="e.g., Grade 10A"
                                    className="w-full border border-slate-200 p-3 rounded-xl focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none"
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 px-4 py-3 border border-slate-200 rounded-xl hover:bg-slate-50 font-medium text-slate-700"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-1 px-4 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 font-medium flex items-center justify-center gap-2"
                                >
                                    {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="h-5 w-5" />}
                                    Create
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
