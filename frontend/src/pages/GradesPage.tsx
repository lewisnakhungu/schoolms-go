import { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Loader2, BookOpen, Trophy, TrendingUp, AlertCircle, Award, Save } from 'lucide-react';

interface Grade {
    id: number;
    student_id: number;
    class_id: number;
    subject: string;
    score: number;
    max_score: number;
    term: string;
    year: number;
    comment?: string;
    Student?: {
        id: number;
        enrollment_number: string;
        User?: { email: string; full_name?: string };
    };
    Class?: { name: string };
}

interface ClassWithStudents {
    id: number;
    name: string;
    student_count: number;
}

interface Student {
    id: number;
    enrollment_number: string;
    User?: { email: string; full_name?: string };
}

export default function GradesPage() {
    const { role } = useAuth();
    const [loading, setLoading] = useState(true);
    const [classes, setClasses] = useState<ClassWithStudents[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    const [grades, setGrades] = useState<Grade[]>([]);
    const [selectedClass, setSelectedClass] = useState<number | null>(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [saving, setSaving] = useState(false);

    // Grade entry form
    const [gradeForm, setGradeForm] = useState({
        subject: '',
        term: 'Term 1',
        year: new Date().getFullYear(),
        max_score: 100
    });
    const [studentScores, setStudentScores] = useState<Record<number, { score: string; comment: string }>>({});

    const isTeacher = role === 'TEACHER' || role === 'SCHOOLADMIN';

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            if (isTeacher) {
                const res = await api.get('/teachers/my-classes');
                setClasses(res.data || []);
            } else {
                // Student view
                const res = await api.get('/grades/my');
                setGrades(res.data.grades || []);
            }
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const fetchClassStudents = async (classId: number) => {
        try {
            const res = await api.get(`/teachers/my-students?class_id=${classId}`);
            setStudents(res.data || []);
            // Initialize scores
            const scores: Record<number, { score: string; comment: string }> = {};
            res.data?.forEach((s: Student) => {
                scores[s.id] = { score: '', comment: '' };
            });
            setStudentScores(scores);
        } catch (err) {
            console.error('Failed to fetch students');
        }
    };

    const handleClassSelect = (classId: number) => {
        setSelectedClass(classId);
        setStudentScores({});
        fetchClassStudents(classId);
    };

    const handleSaveGrades = async () => {
        if (!selectedClass || !gradeForm.subject) {
            setError('Please select a class and enter a subject');
            return;
        }

        const gradesData = Object.entries(studentScores)
            .filter(([_, data]) => data.score)
            .map(([studentId, data]) => ({
                student_id: parseInt(studentId),
                class_id: selectedClass,
                subject: gradeForm.subject,
                score: parseFloat(data.score),
                max_score: gradeForm.max_score,
                term: gradeForm.term,
                year: gradeForm.year,
                comment: data.comment
            }));

        if (gradesData.length === 0) {
            setError('Please enter at least one grade');
            return;
        }

        setSaving(true);
        try {
            await api.post('/grades/bulk', gradesData);
            setSuccess('Grades saved successfully!');
            setStudentScores({});
            setGradeForm({ ...gradeForm, subject: '' });
            setTimeout(() => setSuccess(''), 3000);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to save grades');
        } finally {
            setSaving(false);
        }
    };

    const getGradeColor = (score: number, max: number) => {
        const percent = (score / max) * 100;
        if (percent >= 80) return 'text-green-600 bg-green-50';
        if (percent >= 60) return 'text-blue-600 bg-blue-50';
        if (percent >= 40) return 'text-amber-600 bg-amber-50';
        return 'text-red-600 bg-red-50';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 text-primary-600 animate-spin" />
            </div>
        );
    }

    // Student View
    if (!isTeacher) {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">My Academic Report</h1>
                    <p className="text-slate-500">View your grades and performance</p>
                </div>

                {grades.length === 0 ? (
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 text-center">
                        <Trophy className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                        <p className="text-slate-500">No grades recorded yet</p>
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Subject</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Term</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Score</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Grade</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {grades.map((grade) => (
                                    <tr key={grade.id}>
                                        <td className="px-4 py-3 font-medium text-slate-900">{grade.subject}</td>
                                        <td className="px-4 py-3 text-slate-500">{grade.term} {grade.year}</td>
                                        <td className="px-4 py-3">
                                            <span className={`font-bold ${getGradeColor(grade.score, grade.max_score)}`}>
                                                {grade.score}/{grade.max_score}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getGradeColor(grade.score, grade.max_score)}`}>
                                                {((grade.score / grade.max_score) * 100).toFixed(0)}%
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        );
    }

    // Teacher View
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Grade Entry</h1>
                <p className="text-slate-500">Enter grades for your students</p>
            </div>

            {error && (
                <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" />
                    {error}
                    <button onClick={() => setError('')} className="ml-auto">×</button>
                </div>
            )}

            {success && (
                <div className="p-4 rounded-xl bg-green-50 border border-green-100 text-green-600 text-sm flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    {success}
                </div>
            )}

            {/* Class Selection */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
                <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-primary-600" />
                    Select Class
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {classes.map((cls) => (
                        <button
                            key={cls.id}
                            onClick={() => handleClassSelect(cls.id)}
                            className={`p-4 rounded-xl text-left transition-all ${selectedClass === cls.id
                                    ? 'bg-primary-100 border-2 border-primary-500'
                                    : 'bg-slate-50 border-2 border-transparent hover:bg-slate-100'
                                }`}
                        >
                            <p className="font-medium text-slate-900">{cls.name}</p>
                            <p className="text-sm text-slate-500">{cls.student_count} students</p>
                        </button>
                    ))}
                </div>
            </div>

            {/* Grade Entry Form */}
            {selectedClass && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="font-semibold text-slate-900 flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-primary-600" />
                            Enter Grades
                        </h2>
                    </div>

                    {/* Grade Form Header */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Subject</label>
                            <input
                                className="w-full border border-slate-200 p-2.5 rounded-xl focus:border-primary-500 outline-none"
                                value={gradeForm.subject}
                                onChange={(e) => setGradeForm({ ...gradeForm, subject: e.target.value })}
                                placeholder="e.g., Mathematics"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Term</label>
                            <select
                                className="w-full border border-slate-200 p-2.5 rounded-xl focus:border-primary-500 outline-none"
                                value={gradeForm.term}
                                onChange={(e) => setGradeForm({ ...gradeForm, term: e.target.value })}
                            >
                                <option>Term 1</option>
                                <option>Term 2</option>
                                <option>Term 3</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Year</label>
                            <input
                                type="number"
                                className="w-full border border-slate-200 p-2.5 rounded-xl focus:border-primary-500 outline-none"
                                value={gradeForm.year}
                                onChange={(e) => setGradeForm({ ...gradeForm, year: parseInt(e.target.value) })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Max Score</label>
                            <input
                                type="number"
                                className="w-full border border-slate-200 p-2.5 rounded-xl focus:border-primary-500 outline-none"
                                value={gradeForm.max_score}
                                onChange={(e) => setGradeForm({ ...gradeForm, max_score: parseInt(e.target.value) })}
                            />
                        </div>
                    </div>

                    {/* Student Scores */}
                    <div className="border rounded-xl overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Student</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700 w-32">Score</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Comment</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {students.map((student) => (
                                    <tr key={student.id}>
                                        <td className="px-4 py-3">
                                            <p className="font-medium text-slate-900">
                                                {student.User?.full_name || student.User?.email}
                                            </p>
                                            <p className="text-xs text-slate-400">{student.enrollment_number}</p>
                                        </td>
                                        <td className="px-4 py-3">
                                            <input
                                                type="number"
                                                min="0"
                                                max={gradeForm.max_score}
                                                className="w-full border border-slate-200 p-2 rounded-lg focus:border-primary-500 outline-none"
                                                value={studentScores[student.id]?.score || ''}
                                                onChange={(e) => setStudentScores({
                                                    ...studentScores,
                                                    [student.id]: { ...studentScores[student.id], score: e.target.value }
                                                })}
                                                placeholder={`/ ${gradeForm.max_score}`}
                                            />
                                        </td>
                                        <td className="px-4 py-3">
                                            <input
                                                className="w-full border border-slate-200 p-2 rounded-lg focus:border-primary-500 outline-none"
                                                value={studentScores[student.id]?.comment || ''}
                                                onChange={(e) => setStudentScores({
                                                    ...studentScores,
                                                    [student.id]: { ...studentScores[student.id], comment: e.target.value }
                                                })}
                                                placeholder="Optional comment"
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <button
                        onClick={handleSaveGrades}
                        disabled={saving}
                        className="w-full px-4 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 font-medium flex items-center justify-center gap-2"
                    >
                        {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                        {saving ? 'Saving...' : 'Save Grades'}
                    </button>
                </div>
            )}
        </div>
    );
}
