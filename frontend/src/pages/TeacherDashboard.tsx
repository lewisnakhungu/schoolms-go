import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Loader2, Users, BookOpen, School, Bell, AlertCircle, GraduationCap, Send } from 'lucide-react';

interface TeacherProfile {
    teacher: {
        id: number;
        email: string;
        full_name: string;
    };
    school: {
        id: number;
        name: string;
    };
    classes: Array<{
        id: number;
        name: string;
    }>;
    total_classes: number;
    total_students: number;
}

interface ClassWithCount {
    id: number;
    name: string;
    student_count: number;
}

interface Student {
    id: number;
    enrollment_number: string;
    status: string;
    User: { email: string; full_name?: string };
    Class: { name: string };
}

export default function TeacherDashboard() {
    const { user } = useAuth();
    const [profile, setProfile] = useState<TeacherProfile | null>(null);
    const [classes, setClasses] = useState<ClassWithCount[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showNotifyModal, setShowNotifyModal] = useState(false);
    const [notifyData, setNotifyData] = useState({ title: '', message: '', class_id: 0 });
    const [sending, setSending] = useState(false);
    const [success, setSuccess] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [profileRes, classesRes, studentsRes] = await Promise.all([
                api.get('/teachers/me'),
                api.get('/teachers/my-classes'),
                api.get('/teachers/my-students')
            ]);
            setProfile(profileRes.data);
            setClasses(classesRes.data || []);
            setStudents(studentsRes.data || []);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const fetchStudents = async (classId?: number) => {
        try {
            const url = classId ? `/teachers/my-students?class_id=${classId}` : '/teachers/my-students';
            const res = await api.get(url);
            setStudents(res.data || []);
        } catch (err) {
            console.error('Failed to fetch students');
        }
    };

    const handleClassFilter = (classId: number | null) => {
        setSelectedClassId(classId);
        if (classId) {
            fetchStudents(classId);
        } else {
            fetchStudents();
        }
    };

    const handleSendNotification = async (e: React.FormEvent) => {
        e.preventDefault();
        setSending(true);
        try {
            await api.post('/notifications', {
                title: notifyData.title,
                message: notifyData.message,
                target_type: 'CLASS',
                target_id: notifyData.class_id
            });
            setSuccess('Notification sent to class!');
            setShowNotifyModal(false);
            setNotifyData({ title: '', message: '', class_id: 0 });
            setTimeout(() => setSuccess(''), 3000);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to send notification');
        } finally {
            setSending(false);
        }
    };

    const openNotifyModal = (classId: number) => {
        setNotifyData({ title: '', message: '', class_id: classId });
        setShowNotifyModal(true);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 text-primary-600 animate-spin" />
            </div>
        );
    }

    const teacherName = profile?.teacher.full_name || user?.email?.split('@')[0] || 'Teacher';

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Teacher Dashboard</h1>
                    <p className="text-slate-500 mt-1">
                        Welcome, <span className="font-semibold text-primary-600">{teacherName}</span>
                    </p>
                </div>
                <div className="text-sm font-medium text-slate-500 bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-100">
                    {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
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

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-primary-50 rounded-xl">
                            <School className="h-5 w-5 text-primary-600" />
                        </div>
                        <span className="font-semibold text-slate-700">School</span>
                    </div>
                    <p className="text-xl font-bold text-slate-900">{profile?.school.name}</p>
                </div>

                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-indigo-50 rounded-xl">
                            <BookOpen className="h-5 w-5 text-indigo-600" />
                        </div>
                        <span className="font-semibold text-slate-700">My Classes</span>
                    </div>
                    <p className="text-3xl font-bold text-slate-900">{profile?.total_classes || 0}</p>
                </div>

                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-green-50 rounded-xl">
                            <Users className="h-5 w-5 text-green-600" />
                        </div>
                        <span className="font-semibold text-slate-700">My Students</span>
                    </div>
                    <p className="text-3xl font-bold text-slate-900">{profile?.total_students || 0}</p>
                </div>
            </div>

            {/* Classes */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <GraduationCap className="h-5 w-5 text-primary-600" />
                        <h2 className="text-lg font-bold text-slate-900">My Classes</h2>
                    </div>
                </div>

                {classes.length === 0 ? (
                    <div className="text-center py-8 text-slate-400">
                        <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p>No classes assigned yet</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {classes.map((cls) => (
                            <div
                                key={cls.id}
                                className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${selectedClassId === cls.id
                                        ? 'border-primary-500 bg-primary-50'
                                        : 'border-slate-100 hover:border-primary-200 bg-slate-50'
                                    }`}
                                onClick={() => handleClassFilter(selectedClassId === cls.id ? null : cls.id)}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="font-semibold text-slate-900">{cls.name}</h3>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); openNotifyModal(cls.id); }}
                                        className="p-1.5 text-primary-600 hover:bg-primary-100 rounded-lg transition-colors"
                                        title="Send notification to class"
                                    >
                                        <Bell className="h-4 w-4" />
                                    </button>
                                </div>
                                <p className="text-sm text-slate-500 flex items-center gap-1">
                                    <Users className="h-4 w-4" />
                                    {cls.student_count} students
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Students */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100">
                <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-primary-600" />
                        <h2 className="text-lg font-bold text-slate-900">
                            {selectedClassId ? 'Students in Selected Class' : 'All My Students'}
                        </h2>
                    </div>
                    {selectedClassId && (
                        <button
                            onClick={() => handleClassFilter(null)}
                            className="text-sm text-primary-600 hover:underline"
                        >
                            Show all
                        </button>
                    )}
                </div>

                {students.length === 0 ? (
                    <div className="p-8 text-center text-slate-400">
                        <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p>No students found</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {students.map((student) => (
                            <div key={student.id} className="p-4 hover:bg-slate-50/50">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium text-slate-900">
                                            {student.User?.full_name || student.User?.email}
                                        </p>
                                        <p className="text-sm text-slate-500">
                                            {student.enrollment_number} • {student.Class?.name}
                                        </p>
                                    </div>
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${student.status === 'ENROLLED' ? 'bg-green-100 text-green-800' :
                                            student.status === 'PENDING' ? 'bg-amber-100 text-amber-800' :
                                                'bg-slate-100 text-slate-600'
                                        }`}>
                                        {student.status}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Send Notification Modal */}
            {showNotifyModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
                        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                            <Bell className="h-5 w-5 text-primary-600" />
                            Send Class Notification
                        </h2>

                        <form onSubmit={handleSendNotification} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Title</label>
                                <input
                                    required
                                    className="w-full border border-slate-200 p-3 rounded-xl focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none"
                                    value={notifyData.title}
                                    onChange={(e) => setNotifyData({ ...notifyData, title: e.target.value })}
                                    placeholder="e.g., Homework Reminder"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Message</label>
                                <textarea
                                    required
                                    rows={3}
                                    className="w-full border border-slate-200 p-3 rounded-xl focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none resize-none"
                                    value={notifyData.message}
                                    onChange={(e) => setNotifyData({ ...notifyData, message: e.target.value })}
                                    placeholder="Write your message..."
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowNotifyModal(false)}
                                    className="flex-1 px-4 py-3 border border-slate-200 rounded-xl hover:bg-slate-50 font-medium text-slate-700"
                                >
                                    Cancel
                                </button>
                                <button
                                    disabled={sending}
                                    type="submit"
                                    className="flex-1 px-4 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 font-medium flex items-center justify-center gap-2"
                                >
                                    {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                                    Send
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
