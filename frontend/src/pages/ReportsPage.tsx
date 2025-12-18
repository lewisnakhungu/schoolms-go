import { useState, useEffect } from 'react';
import api from '../services/api';
import { FileText, Loader2, RefreshCw, Printer, AlertTriangle } from 'lucide-react';

interface Defaulter {
    StudentName: string;
    EnrollmentNumber: string;
    Class: string;
    Balance: number;
}

export default function ReportsPage() {
    const [defaulters, setDefaulters] = useState<Defaulter[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchDefaulters = async () => {
        setLoading(true);
        try {
            const response = await api.get('/reports/defaulters');
            setDefaulters(response.data || []);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to load defaulters');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDefaulters();
    }, []);

    const handlePrint = () => {
        // Open the server-rendered print view in a new tab

        const printUrl = `http://localhost:8080/api/v1/reports/defaulters/print`;

        // Create a form to POST with auth header (or just open if backend allows GET with token)
        window.open(printUrl, '_blank');
    };

    const totalOutstanding = defaulters.reduce((sum, d) => sum + d.Balance, 0);

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
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Reports</h1>
                    <p className="text-slate-500 mt-1">Financial and student reports</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handlePrint}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-xl font-medium hover:bg-slate-900 transition-colors shadow-sm"
                    >
                        <Printer className="h-4 w-4" />
                        <span className="hidden sm:inline">Print Report</span>
                        <span className="sm:hidden">Print</span>
                    </button>
                    <button
                        onClick={fetchDefaulters}
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

            {/* Summary Card */}
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl p-6 text-white">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-amber-100 font-medium">Total Outstanding</p>
                        <p className="text-3xl sm:text-4xl font-bold mt-1">${totalOutstanding.toFixed(2)}</p>
                        <p className="text-amber-100 mt-2">{defaulters.length} student(s) with unpaid balances</p>
                    </div>
                    <div className="bg-white/20 p-4 rounded-2xl">
                        <AlertTriangle className="h-10 w-10" />
                    </div>
                </div>
            </div>

            {/* Defaulters Table */}
            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                <div className="p-4 sm:p-6 border-b border-slate-100">
                    <h2 className="font-bold text-slate-900 flex items-center gap-2">
                        <FileText className="h-5 w-5 text-slate-400" />
                        Fee Defaulters List
                    </h2>
                </div>

                {defaulters.length === 0 ? (
                    <div className="p-12 text-center">
                        <div className="bg-green-50 inline-flex p-4 rounded-full mb-4">
                            <FileText className="h-8 w-8 text-green-500" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-700 mb-2">All Fees Paid! 🎉</h3>
                        <p className="text-slate-500">No students have outstanding balances.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm min-w-[500px]">
                            <thead className="bg-slate-50 text-slate-500 font-medium">
                                <tr>
                                    <th className="px-6 py-4 text-left">Student</th>
                                    <th className="px-6 py-4 text-left">Enrollment #</th>
                                    <th className="px-6 py-4 text-left">Class</th>
                                    <th className="px-6 py-4 text-right">Balance</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {defaulters.map((d, i) => (
                                    <tr key={i} className="hover:bg-slate-50/50">
                                        <td className="px-6 py-4 font-medium text-slate-900">{d.StudentName}</td>
                                        <td className="px-6 py-4 text-slate-600">{d.EnrollmentNumber || '-'}</td>
                                        <td className="px-6 py-4 text-slate-600">{d.Class || '-'}</td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="font-semibold text-red-600">${d.Balance.toFixed(2)}</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="bg-slate-50">
                                <tr>
                                    <td colSpan={3} className="px-6 py-4 font-bold text-slate-900">Total Outstanding</td>
                                    <td className="px-6 py-4 text-right font-bold text-red-600">${totalOutstanding.toFixed(2)}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                )}
            </div>

            {/* Print Instructions */}
            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                <h3 className="font-semibold text-slate-800 mb-2 flex items-center gap-2">
                    <Printer className="h-5 w-5 text-slate-500" />
                    Printing Reports
                </h3>
                <p className="text-sm text-slate-600">
                    Click the <strong>"Print Report"</strong> button to open a printer-friendly version of the defaulters list.
                    You can print it directly or save as PDF using your browser's print dialog (Ctrl+P / Cmd+P).
                </p>
            </div>
        </div>
    );
}
