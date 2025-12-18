import { useState, useEffect } from 'react';
import { Plus, School as SchoolIcon, Search, Loader2, RefreshCw, CheckCircle, XCircle, Edit2, Trash2, Key, Clock } from 'lucide-react';
import api from '../services/api';

interface User {
    email: string;
    role: string;
    full_name?: string;
    last_login_at?: string;
}

interface School {
    ID: number;
    name: string;
    address: string;
    contact_info: string;
    subscription_status: string;
    CreatedAt: string;
    Users?: User[];
}

export default function SuperAdminDashboard() {
    const [schools, setSchools] = useState<School[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        address: '',
        contact_info: '',
        admin_email: ''
    });
    const [editFormData, setEditFormData] = useState({
        name: '',
        address: '',
        contact_info: '',
        subscription_status: ''
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
            fetchSchools();
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to create school');
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = (school: School) => {
        setSelectedSchool(school);
        setEditFormData({
            name: school.name,
            address: school.address || '',
            contact_info: school.contact_info || '',
            subscription_status: school.subscription_status || 'ACTIVE'
        });
        setShowEditModal(true);
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedSchool) return;
        setSubmitting(true);
        setError('');

        try {
            await api.put(`/superadmin/schools/${selectedSchool.ID}`, editFormData);
            setShowEditModal(false);
            setSuccess('School updated successfully!');
            fetchSchools();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to update school');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = (school: School) => {
        setSelectedSchool(school);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (!selectedSchool) return;
        setSubmitting(true);
        setError('');

        try {
            await api.delete(`/superadmin/schools/${selectedSchool.ID}`);
            setShowDeleteModal(false);
            setSuccess('School deleted successfully!');
            fetchSchools();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to delete school');
        } finally {
            setSubmitting(false);
        }
    };

    const handleResetPassword = async (school: School) => {
        if (!confirm(`Reset password for ${school.name}'s admin?`)) return;

        try {
            const resp = await api.post(`/superadmin/schools/${school.ID}/reset-password`);
            alert(`New password for ${resp.data.admin_email}: ${resp.data.new_password}`);
            fetchSchools();
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to reset password');
        }
    };

    const getLastLoginStatus = (user?: User) => {
        if (!user?.last_login_at) {
            return { text: 'Never logged in', color: 'text-slate-400', bgColor: 'bg-slate-100' };
        }
        const lastLogin = new Date(user.last_login_at);
        const now = new Date();
        const diffHours = (now.getTime() - lastLogin.getTime()) / (1000 * 60 * 60);

        if (diffHours < 1) {
            return { text: 'Online now', color: 'text-green-600', bgColor: 'bg-green-100' };
        } else if (diffHours < 24) {
            return { text: 'Today', color: 'text-blue-600', bgColor: 'bg-blue-100' };
        } else if (diffHours < 168) { // 7 days
            return { text: `${Math.floor(diffHours / 24)}d ago`, color: 'text-amber-600', bgColor: 'bg-amber-100' };
        } else {
            return { text: 'Inactive', color: 'text-red-600', bgColor: 'bg-red-100' };
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

            {success && (
                <div className="p-4 rounded-xl bg-green-50 border border-green-100 text-green-600 text-sm">
                    {success}
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
                    <table className="w-full text-left text-sm min-w-[800px]">
                        <thead className="bg-slate-50 text-slate-500 font-medium">
                            <tr>
                                <th className="px-6 py-4">School Name</th>
                                <th className="px-6 py-4">Admin Email</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Last Active</th>
                                <th className="px-6 py-4">Created</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredSchools.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                                        No schools found.
                                    </td>
                                </tr>
                            ) : (
                                filteredSchools.map((school) => {
                                    const admin = school.Users?.find(u => u.role === 'SCHOOLADMIN');
                                    const loginStatus = getLastLoginStatus(admin);
                                    return (
                                        <tr key={school.ID} className="hover:bg-slate-50/50">
                                            <td className="px-6 py-4 font-medium text-slate-900">{school.name}</td>
                                            <td className="px-6 py-4 text-slate-600">
                                                {admin?.email || '-'}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${school.subscription_status === 'ACTIVE'
                                                    ? 'bg-green-100 text-green-800'
                                                    : school.subscription_status === 'TRIAL'
                                                        ? 'bg-blue-100 text-blue-800'
                                                        : 'bg-amber-100 text-amber-800'
                                                    }`}>
                                                    {school.subscription_status || 'PENDING'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${loginStatus.bgColor} ${loginStatus.color}`}>
                                                    <Clock className="h-3 w-3" />
                                                    {loginStatus.text}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-slate-500">
                                                {new Date(school.CreatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex justify-end gap-1">
                                                    <button
                                                        onClick={() => handleEdit(school)}
                                                        className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                        title="Edit School"
                                                    >
                                                        <Edit2 className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleResetPassword(school)}
                                                        className="p-2 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                                                        title="Reset Password"
                                                    >
                                                        <Key className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(school)}
                                                        className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Delete School"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
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

                        {success && generatedCreds ? (
                            <div className="bg-green-50 p-4 rounded-xl text-green-700 space-y-3">
                                <p className="font-medium">{success}</p>
                                <div className="bg-white p-3 rounded-lg border border-green-200">
                                    <p className="text-sm text-slate-600">Admin Password:</p>
                                    <p className="font-mono font-bold text-lg">{generatedCreds?.password}</p>
                                </div>
                                <button
                                    onClick={() => { setShowModal(false); setSuccess(''); setGeneratedCreds(null); }}
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

            {/* Edit Modal */}
            {showEditModal && selectedSchool && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
                        <h2 className="text-xl font-bold text-slate-900">Edit School</h2>

                        <form onSubmit={handleEditSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">School Name</label>
                                <input
                                    required
                                    className="w-full border border-slate-200 p-3 rounded-xl focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none"
                                    value={editFormData.name}
                                    onChange={e => setEditFormData({ ...editFormData, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Address</label>
                                <input
                                    className="w-full border border-slate-200 p-3 rounded-xl focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none"
                                    value={editFormData.address}
                                    onChange={e => setEditFormData({ ...editFormData, address: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Contact Info</label>
                                <input
                                    className="w-full border border-slate-200 p-3 rounded-xl focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none"
                                    value={editFormData.contact_info}
                                    onChange={e => setEditFormData({ ...editFormData, contact_info: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Subscription Status</label>
                                <select
                                    className="w-full border border-slate-200 p-3 rounded-xl focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none"
                                    value={editFormData.subscription_status}
                                    onChange={e => setEditFormData({ ...editFormData, subscription_status: e.target.value })}
                                >
                                    <option value="ACTIVE">Active</option>
                                    <option value="TRIAL">Trial</option>
                                    <option value="INACTIVE">Inactive</option>
                                </select>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowEditModal(false)}
                                    className="flex-1 px-4 py-3 border border-slate-200 rounded-xl hover:bg-slate-50 font-medium text-slate-700 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    disabled={submitting}
                                    type="submit"
                                    className="flex-1 px-4 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 font-medium transition-colors flex items-center justify-center gap-2"
                                >
                                    {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Edit2 className="h-5 w-5" />}
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && selectedSchool && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
                        <h2 className="text-xl font-bold text-slate-900">Delete School</h2>
                        <p className="text-slate-600">
                            Are you sure you want to delete <strong>{selectedSchool.name}</strong>? This will permanently remove:
                        </p>
                        <ul className="text-sm text-slate-500 list-disc list-inside space-y-1">
                            <li>All students and their records</li>
                            <li>All classes and teachers</li>
                            <li>All payment and fee records</li>
                            <li>All invite codes</li>
                        </ul>
                        <div className="p-3 bg-red-50 rounded-xl text-red-700 text-sm font-medium">
                            ⚠️ This action cannot be undone!
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button
                                type="button"
                                onClick={() => setShowDeleteModal(false)}
                                className="flex-1 px-4 py-3 border border-slate-200 rounded-xl hover:bg-slate-50 font-medium text-slate-700 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDelete}
                                disabled={submitting}
                                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 font-medium transition-colors flex items-center justify-center gap-2"
                            >
                                {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Trash2 className="h-5 w-5" />}
                                Delete School
                            </button>
                        </div>
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
