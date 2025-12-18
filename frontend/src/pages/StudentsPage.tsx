import { useState, useEffect } from 'react';
import api from '../services/api';
import { Users, Loader2, RefreshCw, UserCheck, BookOpen } from 'lucide-react';

interface Student {
    ID: number;
    enrollment_number: string;
    User: { id: number; email: string };
    Class: { ID: number; name: string } | null;
    class_id: number | null;
}

interface Class {
    ID: number;
    name: string;
}

export default function StudentsPage() {
    const [students, setStudents] = useState<Student[]>([]);
    const [classes, setClasses] = useState<Class[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Assign modal state
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [selectedClassId, setSelectedClassId] = useState<number | ''>('');
    const [assigning, setAssigning] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [studentsRes, classesRes] = await Promise.all([
                api.get('/students'),
                api.get('/classes')
            ]);
            setStudents(studentsRes.data || []);
            setClasses(classesRes.data || []);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleAssignClass = async () => {
        if (!selectedStudent || !selectedClassId) return;
        setAssigning(true);
        setError('');
        try {
            await api.put(`/students/${selectedStudent.ID}`, { class_id: selectedClassId });
            setShowAssignModal(false);
            setSelectedStudent(null);
            setSelectedClassId('');
            fetchData();
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to assign class');
        } finally {
            setAssigning(false);
        }
    };

    const openAssignModal = (student: Student) => {
        setSelectedStudent(student);
        setSelectedClassId(student.Class?.ID || '');
        setShowAssignModal(true);
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
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Students</h1>
                    <p className="text-slate-500 mt-1">{students.length} students enrolled</p>
                </div>
                <button
                    onClick={fetchData}
                    className="p-2 text-slate-500 hover:text-primary-600 hover:bg-slate-100 rounded-xl transition-colors self-start"
                >
                    <RefreshCw className="h-5 w-5" />
                </button>
            </div>

            {error && (
                <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm">
                    {error}
                </div>
            )}

            {/* Students Table */}
            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                {students.length === 0 ? (
                    <div className="p-12 text-center">
                        <Users className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-slate-700 mb-2">No Students Yet</h3>
                        <p className="text-slate-500">Students will appear here after they sign up with an invite code.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm min-w-[600px]">
                            <thead className="bg-slate-50 text-slate-500 font-medium">
                                <tr>
                                    <th className="px-6 py-4 text-left">Email</th>
                                    <th className="px-6 py-4 text-left">Enrollment #</th>
                                    <th className="px-6 py-4 text-left">Class</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {students.map((student) => (
                                    <tr key={student.ID} className="hover:bg-slate-50/50">
                                        <td className="px-6 py-4 font-medium text-slate-900">{student.User?.email || 'N/A'}</td>
                                        <td className="px-6 py-4 text-slate-600">{student.enrollment_number || '-'}</td>
                                        <td className="px-6 py-4">
                                            {student.Class ? (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-medium">
                                                    <BookOpen className="h-3 w-3" />
                                                    {student.Class.name}
                                                </span>
                                            ) : (
                                                <span className="text-slate-400 text-sm">Unassigned</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => openAssignModal(student)}
                                                className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                                            >
                                                <UserCheck className="h-4 w-4" />
                                                Assign Class
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Assign Class Modal */}
            {showAssignModal && selectedStudent && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
                        <h2 className="text-xl font-bold text-slate-900">Assign to Class</h2>
                        <p className="text-slate-600">
                            Assigning <span className="font-semibold">{selectedStudent.User?.email}</span> to a class.
                        </p>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Select Class</label>
                            <select
                                value={selectedClassId}
                                onChange={(e) => setSelectedClassId(e.target.value ? parseInt(e.target.value) : '')}
                                className="w-full border border-slate-200 p-3 rounded-xl focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none"
                            >
                                <option value="">-- Select a class --</option>
                                {classes.map((cls) => (
                                    <option key={cls.ID} value={cls.ID}>{cls.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button
                                type="button"
                                onClick={() => setShowAssignModal(false)}
                                className="flex-1 px-4 py-3 border border-slate-200 rounded-xl hover:bg-slate-50 font-medium text-slate-700"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAssignClass}
                                disabled={assigning || !selectedClassId}
                                className="flex-1 px-4 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {assigning ? <Loader2 className="h-5 w-5 animate-spin" /> : <UserCheck className="h-5 w-5" />}
                                Assign
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
