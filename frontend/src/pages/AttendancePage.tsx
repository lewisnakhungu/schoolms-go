import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Loader2, CheckCircle2, XCircle, Clock, AlertCircle, Users, Calendar, Save, ChevronLeft, ChevronRight } from 'lucide-react';

interface ClassInfo {
    id: number;
    name: string;
    student_count?: number;
}

interface Student {
    id: number;
    enrollment_number: string;
    User?: { email: string; full_name?: string };
}

interface AttendanceRecord {
    id: number;
    student_id: number;
    status: string;
    notes?: string;
    date: string;
    Student?: Student;
}

interface AttendanceEntry {
    status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED' | '';
    notes: string;
}

export default function AttendancePage() {
    const { role } = useAuth();
    const [loading, setLoading] = useState(true);
    const [classes, setClasses] = useState<ClassInfo[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    const [selectedClass, setSelectedClass] = useState<number | null>(null);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [attendance, setAttendance] = useState<Record<number, AttendanceEntry>>({});
    const [existingRecords, setExistingRecords] = useState<AttendanceRecord[]>([]);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const isTeacher = role === 'TEACHER' || role === 'SCHOOLADMIN';

    useEffect(() => {
        fetchClasses();
    }, []);

    useEffect(() => {
        if (selectedClass) {
            fetchStudentsAndAttendance();
        }
    }, [selectedClass, selectedDate]);

    const fetchClasses = async () => {
        setLoading(true);
        try {
            const res = isTeacher
                ? await api.get('/teachers/my-classes')
                : await api.get('/classes');
            setClasses(res.data || []);
        } catch (err) {
            console.error('Failed to fetch classes');
        } finally {
            setLoading(false);
        }
    };

    const fetchStudentsAndAttendance = async () => {
        try {
            const [studentsRes, attendanceRes] = await Promise.all([
                api.get(`/teachers/my-students?class_id=${selectedClass}`),
                api.get(`/attendance/class/${selectedClass}?date=${selectedDate}`)
            ]);

            const studentsList = studentsRes.data || [];
            setStudents(studentsList);
            setExistingRecords(attendanceRes.data || []);

            // Initialize attendance state
            const initial: Record<number, AttendanceEntry> = {};
            studentsList.forEach((s: Student) => {
                const existing = attendanceRes.data?.find((r: AttendanceRecord) => r.student_id === s.id);
                initial[s.id] = {
                    status: existing?.status || '',
                    notes: existing?.notes || ''
                };
            });
            setAttendance(initial);
        } catch (err) {
            console.error('Failed to fetch data');
        }
    };

    const handleStatusChange = (studentId: number, status: AttendanceEntry['status']) => {
        setAttendance(prev => ({
            ...prev,
            [studentId]: { ...prev[studentId], status }
        }));
    };

    const markAllPresent = () => {
        const updated: Record<number, AttendanceEntry> = {};
        students.forEach(s => {
            updated[s.id] = { status: 'PRESENT', notes: '' };
        });
        setAttendance(updated);
    };

    const handleSave = async () => {
        if (!selectedClass) return;

        const records = Object.entries(attendance)
            .filter(([_, entry]) => entry.status)
            .map(([studentId, entry]) => ({
                student_id: parseInt(studentId),
                status: entry.status,
                notes: entry.notes
            }));

        if (records.length === 0) {
            setError('Please mark attendance for at least one student');
            return;
        }

        setSaving(true);
        setError('');
        try {
            await api.post('/attendance/bulk', {
                class_id: selectedClass,
                date: selectedDate,
                records
            });
            setSuccess('Attendance saved successfully!');
            setTimeout(() => setSuccess(''), 3000);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to save attendance');
        } finally {
            setSaving(false);
        }
    };

    const changeDate = (days: number) => {
        const date = new Date(selectedDate);
        date.setDate(date.getDate() + days);
        setSelectedDate(date.toISOString().split('T')[0]);
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'PRESENT': return <CheckCircle2 className="h-5 w-5 text-green-500" />;
            case 'ABSENT': return <XCircle className="h-5 w-5 text-red-500" />;
            case 'LATE': return <Clock className="h-5 w-5 text-amber-500" />;
            case 'EXCUSED': return <AlertCircle className="h-5 w-5 text-blue-500" />;
            default: return null;
        }
    };

    const statusCounts = {
        present: Object.values(attendance).filter(a => a.status === 'PRESENT').length,
        absent: Object.values(attendance).filter(a => a.status === 'ABSENT').length,
        late: Object.values(attendance).filter(a => a.status === 'LATE').length,
        unmarked: Object.values(attendance).filter(a => !a.status).length
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
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Attendance</h1>
                    <p className="text-slate-500">Mark and track student attendance</p>
                </div>
            </div>

            {error && (
                <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" />
                    {error}
                    <button onClick={() => setError('')} className="ml-auto">×</button>
                </div>
            )}

            {success && (
                <div className="p-4 rounded-xl bg-green-50 border border-green-100 text-green-600 text-sm">
                    ✅ {success}
                </div>
            )}

            {/* Class Selection */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
                <div className="flex items-center gap-2 mb-4">
                    <Users className="h-5 w-5 text-primary-600" />
                    <h2 className="font-semibold text-slate-900">Select Class</h2>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {classes.map((cls) => (
                        <button
                            key={cls.id}
                            onClick={() => setSelectedClass(cls.id)}
                            className={`p-4 rounded-xl text-left transition-all ${selectedClass === cls.id
                                    ? 'bg-primary-100 border-2 border-primary-500'
                                    : 'bg-slate-50 border-2 border-transparent hover:bg-slate-100'
                                }`}
                        >
                            <p className="font-medium text-slate-900">{cls.name}</p>
                        </button>
                    ))}
                </div>
            </div>

            {/* Date Selection & Attendance Form */}
            {selectedClass && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100">
                    {/* Date Header */}
                    <div className="p-5 border-b border-slate-100">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Calendar className="h-5 w-5 text-primary-600" />
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => changeDate(-1)}
                                        className="p-1.5 hover:bg-slate-100 rounded-lg"
                                    >
                                        <ChevronLeft className="h-5 w-5" />
                                    </button>
                                    <input
                                        type="date"
                                        value={selectedDate}
                                        onChange={(e) => setSelectedDate(e.target.value)}
                                        className="border border-slate-200 px-3 py-1.5 rounded-lg font-medium"
                                    />
                                    <button
                                        onClick={() => changeDate(1)}
                                        className="p-1.5 hover:bg-slate-100 rounded-lg"
                                    >
                                        <ChevronRight className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={markAllPresent}
                                    className="text-sm text-primary-600 hover:underline font-medium"
                                >
                                    Mark All Present
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="px-4 py-2 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 flex items-center gap-2"
                                >
                                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                    Save
                                </button>
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="flex gap-4 mt-4 text-sm">
                            <span className="text-green-600">✓ {statusCounts.present} Present</span>
                            <span className="text-red-600">✕ {statusCounts.absent} Absent</span>
                            <span className="text-amber-600">⏰ {statusCounts.late} Late</span>
                            <span className="text-slate-400">• {statusCounts.unmarked} Unmarked</span>
                        </div>
                    </div>

                    {/* Student List */}
                    <div className="divide-y divide-slate-100">
                        {students.length === 0 ? (
                            <div className="p-8 text-center text-slate-400">
                                <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                <p>No students in this class</p>
                            </div>
                        ) : (
                            students.map((student) => (
                                <div key={student.id} className="p-4 flex items-center gap-4">
                                    <div className="flex-1">
                                        <p className="font-medium text-slate-900">
                                            {student.User?.full_name || student.User?.email}
                                        </p>
                                        <p className="text-sm text-slate-400">{student.enrollment_number}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        {(['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'] as const).map((status) => (
                                            <button
                                                key={status}
                                                onClick={() => handleStatusChange(student.id, status)}
                                                className={`p-2 rounded-lg border-2 transition-all ${attendance[student.id]?.status === status
                                                        ? status === 'PRESENT' ? 'bg-green-100 border-green-500'
                                                            : status === 'ABSENT' ? 'bg-red-100 border-red-500'
                                                                : status === 'LATE' ? 'bg-amber-100 border-amber-500'
                                                                    : 'bg-blue-100 border-blue-500'
                                                        : 'border-slate-200 hover:bg-slate-50'
                                                    }`}
                                                title={status}
                                            >
                                                {getStatusIcon(status) || status[0]}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
