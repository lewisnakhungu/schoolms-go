import { useState, useEffect } from 'react';
import { Plus, School as SchoolIcon, Search, Loader2, RefreshCw, CheckCircle, XCircle } from 'lucide-react';
import api from '../services/api';

interface School {
    ID: number;
    name: string;
    address: string;
    contact_info: string;
    subscription_status: string;
    CreatedAt: string;
    Users?: { email: string; role: string }[];
}

export default function SuperAdminDashboard() {
    const [schools, setSchools] = useState<School[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        address: '',
        contact_info: '',
        admin_email: ''
    });
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState('');
    const [generatedCreds, setGeneratedCreds] = useState<{ password: string } | null>(null);
    const [error, setError] = useState('');

    const fetchSchools = async () => {
        setLoading(true);
        try {
            const response = await api.get('/superadmin/schools');
            setSchools(response.data || []);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to load schools');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSchools();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setSuccess('');
        setGeneratedCreds(null);
        setError('');

        try {
            const resp = await api.post('/superadmin/schools', formData);
            setSuccess('School created successfully!');
            setGeneratedCreds(resp.data.credentials);
            setFormData({ name: '', address: '', contact_info: '', admin_email: '' });
            fetchSchools(); // Refresh list
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to create school');
        } finally {
            setSubmitting(false);
        }
    };

    const filteredSchools = schools.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.Users?.some(u => u.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const activeCount = schools.filter(s => s.subscription_status === 'ACTIVE').length;
    const pendingCount = schools.length - activeCount;

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
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Superadmin Overview</h1>
                    <p className="text-slate-500">Manage schools and subscription status</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowModal(true)}
                        className="inline-flex items-center px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl shadow-sm transition-colors font-medium"
                    >
                        <Plus className="h-5 w-5 mr-2" />
                        Add School
                    </button>
                    <button
                        onClick={fetchSchools}
                        className="p-2 text-slate-500 hover:text-primary-600 hover:bg-slate-100 rounded-xl transition-colors"
                        title="Refresh"
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

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                <StatCard title="Total Schools" value={schools.length} icon={<SchoolIcon className="text-primary-600" />} color="primary" />
                <StatCard title="Active Subscriptions" value={activeCount} icon={<CheckCircle className="text-green-600" />} color="green" />
                <StatCard title="Pending / Inactive" value={pendingCount} icon={<XCircle className="text-amber-600" />} color="amber" />
            </div>

            {/* Schools Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <h2 className="font-bold text-slate-900">Registered Schools</h2>
                    <div className="relative">
                        <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search schools..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none text-sm w-full sm:w-64"
                        />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm min-w-[600px]">
                        <thead className="bg-slate-50 text-slate-500 font-medium">
                            <tr>
                                <th className="px-6 py-4">School Name</th>
                                <th className="px-6 py-4">Admin Email</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Created</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredSchools.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center text-slate-400">
                                        No schools found.
                                    </td>
                                </tr>
                            ) : (
                                filteredSchools.map((school) => (
                                    <tr key={school.ID} className="hover:bg-slate-50/50">
                                        <td className="px-6 py-4 font-medium text-slate-900">{school.name}</td>
                                        <td className="px-6 py-4 text-slate-600">
                                            {school.Users?.find(u => u.role === 'SCHOOLADMIN')?.email || '-'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${school.subscription_status === 'ACTIVE'
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-amber-100 text-amber-800'
                                                }`}>
                                                {school.subscription_status || 'PENDING'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-500">
                                            {new Date(school.CreatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
                        <h2 className="text-xl font-bold text-slate-900">Provision New School</h2>

                        {success ? (
                            <div className="bg-green-50 p-4 rounded-xl text-green-700 space-y-3">
                                <p className="font-medium">{success}</p>
                                <div className="bg-white p-3 rounded-lg border border-green-200">
                                    <p className="text-sm text-slate-600">Admin Password:</p>
                                    <p className="font-mono font-bold text-lg">{generatedCreds?.password}</p>
                                </div>
                                <button
                                    onClick={() => { setShowModal(false); setSuccess(''); }}
                                    className="w-full bg-green-600 text-white py-3 rounded-xl font-medium hover:bg-green-700 transition-colors"
                                >
                                    Done
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">School Name</label>
                                    <input
                                        required
                                        className="w-full border border-slate-200 p-3 rounded-xl focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Address</label>
                                    <input
                                        className="w-full border border-slate-200 p-3 rounded-xl focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none"
                                        value={formData.address}
                                        onChange={e => setFormData({ ...formData, address: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Admin Email</label>
                                    <input
                                        required
                                        type="email"
                                        className="w-full border border-slate-200 p-3 rounded-xl focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none"
                                        value={formData.admin_email}
                                        onChange={e => setFormData({ ...formData, admin_email: e.target.value })}
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
                                        {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="h-5 w-5" />}
                                        Provision
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

function StatCard({ title, value, icon, color }: { title: string; value: number; icon: React.ReactNode; color: string }) {
    const colorClasses: Record<string, string> = {
        primary: 'bg-primary-50',
        green: 'bg-green-50',
        amber: 'bg-amber-50',
    };
    return (
        <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between hover:shadow-md transition-shadow">
            <div>
                <p className="text-sm font-medium text-slate-500">{title}</p>
                <p className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">{value}</p>
            </div>
            <div className={`h-12 w-12 ${colorClasses[color]} rounded-xl flex items-center justify-center`}>
                {icon}
            </div>
        </div>
    );
}
