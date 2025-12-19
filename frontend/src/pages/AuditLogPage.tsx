import { useState, useEffect } from 'react';
import api from '../services/api';
import { Loader2, Download, Filter, Calendar, Activity } from 'lucide-react';

interface AuditLog {
    id: number;
    user_id: number;
    action: string;
    entity: string;
    entity_id: number;
    old_value: string;
    new_value: string;
    ip_address: string;
    created_at: string;
}

interface AuditData {
    data: AuditLog[];
    users: Record<number, string>;
    actions: string[];
    pagination: {
        page: number;
        page_size: number;
        total: number;
        pages: number;
    };
}

export default function AuditLogPage() {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<AuditData | null>(null);
    const [filters, setFilters] = useState({
        user_id: '',
        action: '',
        from_date: '',
        to_date: '',
        page: 1,
    });

    useEffect(() => {
        fetchLogs();
    }, [filters]);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filters.user_id) params.append('user_id', filters.user_id);
            if (filters.action) params.append('action', filters.action);
            if (filters.from_date) params.append('from_date', filters.from_date);
            if (filters.to_date) params.append('to_date', filters.to_date);
            params.append('page', filters.page.toString());
            params.append('page_size', '20');

            const res = await api.get(`/audit-logs?${params.toString()}`);
            setData(res.data);
        } catch (err) {
            console.error('Failed to fetch audit logs');
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async () => {
        try {
            const params = new URLSearchParams();
            if (filters.from_date) params.append('from_date', filters.from_date);
            if (filters.to_date) params.append('to_date', filters.to_date);

            const res = await api.get(`/audit-logs/export?${params.toString()}`, {
                responseType: 'blob',
            });

            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `audit_logs_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            console.error('Failed to export');
        }
    };

    const formatAction = (action: string) => {
        const colors: Record<string, string> = {
            'DELETE_PAYMENT': 'bg-red-100 text-red-700',
            'DELETE_STUDENT': 'bg-red-100 text-red-700',
            'UPDATE_FEE_STRUCTURE': 'bg-amber-100 text-amber-700',
            'CHANGE_STUDENT_GRADE': 'bg-blue-100 text-blue-700',
            'IMPORT_DATA': 'bg-green-100 text-green-700',
            'EXPORT_DATA': 'bg-purple-100 text-purple-700',
        };
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[action] || 'bg-slate-100 text-slate-700'}`}>
                {action.replace(/_/g, ' ')}
            </span>
        );
    };

    if (loading && !data) {
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
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Audit Logs</h1>
                    <p className="text-slate-500">Track all critical system changes</p>
                </div>
                <button
                    onClick={handleExport}
                    className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700"
                >
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
                <div className="flex items-center gap-2 mb-4">
                    <Filter className="h-5 w-5 text-slate-400" />
                    <span className="font-medium text-slate-700">Filters</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-600 mb-1">
                            <Calendar className="h-4 w-4 inline mr-1" /> From Date
                        </label>
                        <input
                            type="date"
                            value={filters.from_date}
                            onChange={(e) => setFilters({ ...filters, from_date: e.target.value, page: 1 })}
                            className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-600 mb-1">
                            <Calendar className="h-4 w-4 inline mr-1" /> To Date
                        </label>
                        <input
                            type="date"
                            value={filters.to_date}
                            onChange={(e) => setFilters({ ...filters, to_date: e.target.value, page: 1 })}
                            className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-600 mb-1">
                            <Activity className="h-4 w-4 inline mr-1" /> Action
                        </label>
                        <select
                            value={filters.action}
                            onChange={(e) => setFilters({ ...filters, action: e.target.value, page: 1 })}
                            className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                        >
                            <option value="">All Actions</option>
                            {data?.actions?.map((action) => (
                                <option key={action} value={action}>{action.replace(/_/g, ' ')}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex items-end">
                        <button
                            onClick={() => setFilters({ user_id: '', action: '', from_date: '', to_date: '', page: 1 })}
                            className="w-full p-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200"
                        >
                            Clear Filters
                        </button>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-100">
                            <tr>
                                <th className="text-left p-4 text-sm font-medium text-slate-500">Date</th>
                                <th className="text-left p-4 text-sm font-medium text-slate-500">User</th>
                                <th className="text-left p-4 text-sm font-medium text-slate-500">Action</th>
                                <th className="text-left p-4 text-sm font-medium text-slate-500">Entity</th>
                                <th className="text-left p-4 text-sm font-medium text-slate-500">IP Address</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {data?.data?.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-slate-400">
                                        No audit logs found
                                    </td>
                                </tr>
                            ) : (
                                data?.data?.map((log) => (
                                    <tr key={log.id} className="hover:bg-slate-50">
                                        <td className="p-4 text-sm text-slate-600">
                                            {new Date(log.created_at).toLocaleString()}
                                        </td>
                                        <td className="p-4 text-sm text-slate-900">
                                            {data.users[log.user_id] || `User #${log.user_id}`}
                                        </td>
                                        <td className="p-4">
                                            {formatAction(log.action)}
                                        </td>
                                        <td className="p-4 text-sm text-slate-600">
                                            {log.entity} #{log.entity_id}
                                        </td>
                                        <td className="p-4 text-sm text-slate-400">
                                            {log.ip_address}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {data?.pagination && data.pagination.pages > 1 && (
                    <div className="p-4 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-sm text-slate-500">
                            Page {data.pagination.page} of {data.pagination.pages} ({data.pagination.total} total)
                        </span>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                                disabled={filters.page <= 1}
                                className="px-3 py-1 bg-slate-100 rounded-lg disabled:opacity-50"
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                                disabled={filters.page >= data.pagination.pages}
                                className="px-3 py-1 bg-slate-100 rounded-lg disabled:opacity-50"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
