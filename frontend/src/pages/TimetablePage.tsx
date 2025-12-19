import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Loader2, Calendar, Clock, Plus, Trash2, Edit2, X, Save } from 'lucide-react';

interface ClassInfo {
    id: number;
    name: string;
}

interface TimetableEntry {
    id: number;
    class_id: number;
    day_of_week: number;
    start_time: string;
    end_time: string;
    subject: string;
    room?: string;
    Teacher?: { email: string; full_name?: string };
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_COLORS = ['bg-red-50', 'bg-blue-50', 'bg-green-50', 'bg-amber-50', 'bg-purple-50', 'bg-pink-50', 'bg-slate-50'];

export default function TimetablePage() {
    const { role } = useAuth();
    const [loading, setLoading] = useState(true);
    const [classes, setClasses] = useState<ClassInfo[]>([]);
    const [selectedClass, setSelectedClass] = useState<number | null>(null);
    const [schedule, setSchedule] = useState<Record<string, TimetableEntry[]>>({});
    const [showModal, setShowModal] = useState(false);
    const [editingEntry, setEditingEntry] = useState<TimetableEntry | null>(null);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        day_of_week: 1,
        start_time: '08:00',
        end_time: '09:00',
        subject: '',
        room: ''
    });

    const isAdmin = role === 'SCHOOLADMIN';

    useEffect(() => {
        fetchClasses();
    }, []);

    useEffect(() => {
        if (selectedClass) {
            fetchTimetable();
        }
    }, [selectedClass]);

    const fetchClasses = async () => {
        setLoading(true);
        try {
            const res = await api.get('/classes');
            setClasses(res.data || []);
            if (res.data?.length > 0) {
                setSelectedClass(res.data[0].id);
            }
        } catch (err) {
            console.error('Failed to fetch classes');
        } finally {
            setLoading(false);
        }
    };

    const fetchTimetable = async () => {
        try {
            const res = await api.get(`/timetable/class/${selectedClass}`);
            setSchedule(res.data.schedule || {});
        } catch (err) {
            console.error('Failed to fetch timetable');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedClass) return;

        setSaving(true);
        try {
            if (editingEntry) {
                await api.put(`/timetable/${editingEntry.id}`, {
                    class_id: selectedClass,
                    ...form
                });
            } else {
                await api.post('/timetable', {
                    class_id: selectedClass,
                    ...form
                });
            }
            setShowModal(false);
            setEditingEntry(null);
            setForm({ day_of_week: 1, start_time: '08:00', end_time: '09:00', subject: '', room: '' });
            fetchTimetable();
        } catch (err) {
            console.error('Failed to save');
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (entry: TimetableEntry) => {
        setEditingEntry(entry);
        setForm({
            day_of_week: entry.day_of_week,
            start_time: entry.start_time,
            end_time: entry.end_time,
            subject: entry.subject,
            room: entry.room || ''
        });
        setShowModal(true);
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Delete this entry?')) return;
        try {
            await api.delete(`/timetable/${id}`);
            fetchTimetable();
        } catch (err) {
            console.error('Failed to delete');
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
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Timetable</h1>
                    <p className="text-slate-500">Class schedules and periods</p>
                </div>
                {isAdmin && selectedClass && (
                    <button
                        onClick={() => { setEditingEntry(null); setShowModal(true); }}
                        className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Period
                    </button>
                )}
            </div>

            {/* Class Selector */}
            <div className="flex gap-2 overflow-x-auto pb-2">
                {classes.map((cls) => (
                    <button
                        key={cls.id}
                        onClick={() => setSelectedClass(cls.id)}
                        className={`px-4 py-2 rounded-xl font-medium whitespace-nowrap transition-all ${selectedClass === cls.id
                                ? 'bg-primary-600 text-white'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                    >
                        {cls.name}
                    </button>
                ))}
            </div>

            {/* Timetable Grid */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-px bg-slate-200">
                    {DAYS.slice(1, 6).map((day, i) => (
                        <div key={day} className={`${DAY_COLORS[i + 1]} min-h-[200px]`}>
                            <div className="p-3 border-b border-slate-200 bg-white/50">
                                <h3 className="font-bold text-slate-900">{day}</h3>
                            </div>
                            <div className="p-2 space-y-2">
                                {(schedule[day] || []).map((entry) => (
                                    <div
                                        key={entry.id}
                                        className="bg-white p-3 rounded-xl shadow-sm border border-slate-100 group"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <p className="font-semibold text-slate-900">{entry.subject}</p>
                                                <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                                                    <Clock className="h-3 w-3" />
                                                    {entry.start_time} - {entry.end_time}
                                                </p>
                                                {entry.room && (
                                                    <p className="text-xs text-slate-400 mt-1">Room: {entry.room}</p>
                                                )}
                                            </div>
                                            {isAdmin && (
                                                <div className="opacity-0 group-hover:opacity-100 flex gap-1">
                                                    <button
                                                        onClick={() => handleEdit(entry)}
                                                        className="p-1 text-slate-400 hover:text-primary-600"
                                                    >
                                                        <Edit2 className="h-3 w-3" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(entry.id)}
                                                        className="p-1 text-slate-400 hover:text-red-600"
                                                    >
                                                        <Trash2 className="h-3 w-3" />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {(!schedule[day] || schedule[day].length === 0) && (
                                    <p className="text-xs text-slate-400 text-center py-4">No classes</p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-slate-900">
                                {editingEntry ? 'Edit Period' : 'Add Period'}
                            </h2>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Day</label>
                                <select
                                    value={form.day_of_week}
                                    onChange={(e) => setForm({ ...form, day_of_week: parseInt(e.target.value) })}
                                    className="w-full p-3 border border-slate-200 rounded-xl"
                                >
                                    {DAYS.map((day, i) => (
                                        <option key={i} value={i}>{day}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Start Time</label>
                                    <input
                                        type="time"
                                        value={form.start_time}
                                        onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                                        className="w-full p-3 border border-slate-200 rounded-xl"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">End Time</label>
                                    <input
                                        type="time"
                                        value={form.end_time}
                                        onChange={(e) => setForm({ ...form, end_time: e.target.value })}
                                        className="w-full p-3 border border-slate-200 rounded-xl"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Subject</label>
                                <input
                                    required
                                    value={form.subject}
                                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                                    className="w-full p-3 border border-slate-200 rounded-xl"
                                    placeholder="Mathematics"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Room (optional)</label>
                                <input
                                    value={form.room}
                                    onChange={(e) => setForm({ ...form, room: e.target.value })}
                                    className="w-full p-3 border border-slate-200 rounded-xl"
                                    placeholder="Room 101"
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex-1 py-3 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 flex items-center justify-center gap-2"
                                >
                                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                    Save
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
