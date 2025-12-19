import { useState, useRef } from 'react';
import api from '../services/api';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle, X, Loader2 } from 'lucide-react';

interface ImportRow {
    adm_no: string;
    name: string;
    email: string;
    parent_phone: string;
    class_name: string;
    current_balance: number;
    error?: string;
    row_num: number;
}

interface ImportResult {
    total_rows: number;
    imported: number;
    skipped: number;
    errors: ImportRow[];
}

export default function ImportPage() {
    const [file, setFile] = useState<File | null>(null);
    const [previewing, setPreviewing] = useState(false);
    const [importing, setImporting] = useState(false);
    const [preview, setPreview] = useState<{
        total: number;
        valid: number;
        errors: number;
        preview: ImportRow[];
        error_rows: ImportRow[];
    } | null>(null);
    const [result, setResult] = useState<ImportResult | null>(null);
    const [error, setError] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (f) {
            setFile(f);
            setPreview(null);
            setResult(null);
            setError('');
        }
    };

    const handlePreview = async () => {
        if (!file) return;
        setPreviewing(true);
        setError('');
        try {
            const formData = new FormData();
            formData.append('file', file);
            const res = await api.post('/import/students/preview', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setPreview(res.data);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Preview failed');
        } finally {
            setPreviewing(false);
        }
    };

    const handleImport = async () => {
        if (!file) return;
        setImporting(true);
        setError('');
        try {
            const formData = new FormData();
            formData.append('file', file);
            const res = await api.post('/import/students', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setResult(res.data);
            setPreview(null);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Import failed');
        } finally {
            setImporting(false);
        }
    };

    const resetForm = () => {
        setFile(null);
        setPreview(null);
        setResult(null);
        setError('');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Import Students</h1>
                <p className="text-slate-500">Upload CSV/Excel file to bulk import students</p>
            </div>

            {/* Upload Box */}
            <div className="bg-white rounded-2xl shadow-sm border-2 border-dashed border-slate-200 p-8">
                <div className="text-center">
                    <FileSpreadsheet className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">Upload Student Data</h3>
                    <p className="text-sm text-slate-500 mb-4">
                        CSV or Excel file with columns: Adm No, Name, Email, Parent Phone, Class, Balance
                    </p>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".csv,.xlsx,.xls"
                        onChange={handleFileChange}
                        className="hidden"
                        id="file-upload"
                    />
                    <label
                        htmlFor="file-upload"
                        className="inline-flex items-center px-6 py-3 bg-primary-600 text-white rounded-xl font-medium cursor-pointer hover:bg-primary-700"
                    >
                        <Upload className="h-4 w-4 mr-2" />
                        Choose File
                    </label>
                    {file && (
                        <p className="mt-3 text-sm text-slate-600">
                            Selected: <strong>{file.name}</strong>
                        </p>
                    )}
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="bg-red-50 border border-red-100 text-red-700 rounded-xl p-4 flex items-center gap-3">
                    <AlertCircle className="h-5 w-5" />
                    {error}
                </div>
            )}

            {/* Action Buttons */}
            {file && !result && (
                <div className="flex gap-3">
                    <button
                        onClick={handlePreview}
                        disabled={previewing}
                        className="px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200 flex items-center gap-2"
                    >
                        {previewing ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                        Preview Data
                    </button>
                    {preview && preview.valid > 0 && (
                        <button
                            onClick={handleImport}
                            disabled={importing}
                            className="px-6 py-3 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 flex items-center gap-2"
                        >
                            {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                            Import {preview.valid} Students
                        </button>
                    )}
                </div>
            )}

            {/* Preview Results */}
            {preview && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
                    <h3 className="font-bold text-lg text-slate-900 mb-4">Preview Results</h3>
                    <div className="grid grid-cols-3 gap-4 mb-4">
                        <div className="bg-slate-50 rounded-xl p-4 text-center">
                            <p className="text-2xl font-bold text-slate-900">{preview.total}</p>
                            <p className="text-sm text-slate-500">Total Rows</p>
                        </div>
                        <div className="bg-green-50 rounded-xl p-4 text-center">
                            <p className="text-2xl font-bold text-green-700">{preview.valid}</p>
                            <p className="text-sm text-green-600">Valid</p>
                        </div>
                        <div className="bg-red-50 rounded-xl p-4 text-center">
                            <p className="text-2xl font-bold text-red-700">{preview.errors}</p>
                            <p className="text-sm text-red-600">Errors</p>
                        </div>
                    </div>

                    {/* Sample Data */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-slate-50">
                                    <th className="text-left p-3">Adm No</th>
                                    <th className="text-left p-3">Name</th>
                                    <th className="text-left p-3">Class</th>
                                    <th className="text-right p-3">Balance</th>
                                </tr>
                            </thead>
                            <tbody>
                                {preview.preview.slice(0, 5).map((row, i) => (
                                    <tr key={i} className="border-t border-slate-100">
                                        <td className="p-3">{row.adm_no}</td>
                                        <td className="p-3">{row.name}</td>
                                        <td className="p-3">{row.class_name || '-'}</td>
                                        <td className="p-3 text-right">{row.current_balance?.toLocaleString() || 0}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Errors */}
                    {preview.error_rows.length > 0 && (
                        <div className="mt-4">
                            <h4 className="font-medium text-red-700 mb-2">Rows with Errors:</h4>
                            <div className="space-y-2">
                                {preview.error_rows.slice(0, 5).map((row, i) => (
                                    <div key={i} className="bg-red-50 rounded-lg p-3 text-sm">
                                        <span className="text-red-800">Row {row.row_num}:</span>{' '}
                                        <span className="text-red-600">{row.error}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Import Result */}
            {result && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
                    <div className="flex items-center gap-3 mb-4">
                        <CheckCircle className="h-8 w-8 text-green-600" />
                        <h3 className="font-bold text-lg text-slate-900">Import Complete</h3>
                    </div>
                    <div className="grid grid-cols-3 gap-4 mb-4">
                        <div className="bg-slate-50 rounded-xl p-4 text-center">
                            <p className="text-2xl font-bold text-slate-900">{result.total_rows}</p>
                            <p className="text-sm text-slate-500">Total Rows</p>
                        </div>
                        <div className="bg-green-50 rounded-xl p-4 text-center">
                            <p className="text-2xl font-bold text-green-700">{result.imported}</p>
                            <p className="text-sm text-green-600">Imported</p>
                        </div>
                        <div className="bg-amber-50 rounded-xl p-4 text-center">
                            <p className="text-2xl font-bold text-amber-700">{result.skipped}</p>
                            <p className="text-sm text-amber-600">Skipped</p>
                        </div>
                    </div>
                    <button
                        onClick={resetForm}
                        className="px-6 py-3 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700"
                    >
                        Import More
                    </button>
                </div>
            )}

            {/* Instructions */}
            <div className="bg-blue-50 rounded-2xl p-5">
                <h3 className="font-semibold text-blue-800 mb-2">File Format Requirements</h3>
                <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
                    <li><strong>Required columns:</strong> adm_no (or Admission Number), name</li>
                    <li><strong>Optional:</strong> email, parent_phone, class, balance</li>
                    <li>First row should be headers</li>
                    <li>Duplicates will be skipped automatically</li>
                    <li>Default password for new students: "changeme123"</li>
                </ul>
            </div>
        </div>
    );
}
