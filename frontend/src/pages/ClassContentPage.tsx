import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { ArrowLeft, Plus, Loader2, FileText, Video, Link2, File, Trash2, Download, AlertCircle } from 'lucide-react';

interface Content {
    id: number;
    title: string;
    description: string;
    content_type: string;
    file_url?: string;
    text_content?: string;
    file_name?: string;
    file_size?: number;
    created_at: string;
    teacher?: { email: string; full_name?: string };
}

interface ClassInfo {
    id: number;
    name: string;
}

const CONTENT_TYPES = [
    { value: 'NOTE', label: '📝 Text Note', icon: FileText },
    { value: 'PDF', label: '📄 PDF Document', icon: File },
    { value: 'DOCUMENT', label: '📑 Document (Word, etc)', icon: File },
    { value: 'VIDEO', label: '🎬 Video', icon: Video },
    { value: 'LINK', label: '🔗 External Link', icon: Link2 },
];

export default function ClassContentPage() {
    const { classId } = useParams<{ classId: string }>();
    const navigate = useNavigate();
    const [classInfo, setClassInfo] = useState<ClassInfo | null>(null);
    const [contents, setContents] = useState<Content[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        content_type: 'NOTE',
        text_content: '',
        link_url: ''
    });
    const [file, setFile] = useState<File | null>(null);

    useEffect(() => {
        fetchData();
    }, [classId]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [contentRes, classesRes] = await Promise.all([
                api.get(`/content/classes/${classId}`),
                api.get('/teachers/my-classes')
            ]);
            setContents(contentRes.data || []);
            const cls = classesRes.data?.find((c: ClassInfo) => c.id === parseInt(classId || '0'));
            setClassInfo(cls || null);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to load content');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setUploading(true);
        setError('');

        try {
            const data = new FormData();
            data.append('title', formData.title);
            data.append('description', formData.description);
            data.append('content_type', formData.content_type);

            if (formData.content_type === 'NOTE') {
                data.append('text_content', formData.text_content);
            } else if (formData.content_type === 'LINK') {
                data.append('text_content', formData.link_url);
            } else if (file) {
                data.append('file', file);
            }

            await api.post(`/content/classes/${classId}`, data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            setSuccess('Content uploaded successfully!');
            setShowModal(false);
            setFormData({ title: '', description: '', content_type: 'NOTE', text_content: '', link_url: '' });
            setFile(null);
            fetchData();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to upload content');
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (contentId: number) => {
        if (!confirm('Are you sure you want to delete this content?')) return;
        try {
            await api.delete(`/content/${contentId}`);
            setSuccess('Content deleted');
            fetchData();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to delete');
        }
    };

    const getContentIcon = (type: string) => {
        switch (type) {
            case 'NOTE': return <FileText className="h-5 w-5 text-blue-600" />;
            case 'PDF': return <File className="h-5 w-5 text-red-600" />;
            case 'VIDEO': return <Video className="h-5 w-5 text-purple-600" />;
            case 'LINK': return <Link2 className="h-5 w-5 text-green-600" />;
            default: return <File className="h-5 w-5 text-slate-600" />;
        }
    };

    const formatFileSize = (bytes?: number) => {
        if (!bytes) return '';
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
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
            <div className="flex items-center gap-4">
                <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                    <ArrowLeft className="h-5 w-5" />
                </button>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold text-slate-900">Course Content</h1>
                    <p className="text-slate-500">{classInfo?.name || `Class ${classId}`}</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="inline-flex items-center px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl shadow-sm transition-colors font-medium"
                >
                    <Plus className="h-5 w-5 mr-2" />
                    Add Content
                </button>
            </div>

            {error && (
                <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" />
                    {error}
                </div>
            )}

            {success && (
                <div className="p-4 rounded-xl bg-green-50 border border-green-100 text-green-600 text-sm">
                    ✅ {success}
                </div>
            )}

            {/* Content List */}
            {contents.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 text-center">
                    <FileText className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                    <p className="text-slate-500">No content uploaded yet</p>
                    <button
                        onClick={() => setShowModal(true)}
                        className="mt-4 text-primary-600 hover:underline font-medium"
                    >
                        Upload your first content
                    </button>
                </div>
            ) : (
                <div className="grid gap-4">
                    {contents.map((content) => (
                        <div key={content.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 hover:shadow-md transition-shadow">
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-slate-50 rounded-xl">
                                    {getContentIcon(content.content_type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-slate-900">{content.title}</h3>
                                    {content.description && (
                                        <p className="text-sm text-slate-500 mt-1">{content.description}</p>
                                    )}
                                    <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                                        <span>{content.content_type}</span>
                                        {content.file_size && <span>{formatFileSize(content.file_size)}</span>}
                                        <span>{new Date(content.created_at).toLocaleDateString()}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {content.file_url && (
                                        <a
                                            href={`http://localhost:8080${content.file_url}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                                            title="Download"
                                        >
                                            <Download className="h-5 w-5" />
                                        </a>
                                    )}
                                    {content.content_type === 'LINK' && content.text_content && (
                                        <a
                                            href={content.text_content}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                            title="Open Link"
                                        >
                                            <Link2 className="h-5 w-5" />
                                        </a>
                                    )}
                                    <button
                                        onClick={() => handleDelete(content.id)}
                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Delete"
                                    >
                                        <Trash2 className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>

                            {/* Show text content for notes */}
                            {content.content_type === 'NOTE' && content.text_content && (
                                <div className="mt-3 p-3 bg-slate-50 rounded-xl text-sm text-slate-700 whitespace-pre-wrap">
                                    {content.text_content}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Upload Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
                        <h2 className="text-xl font-bold text-slate-900">Add Course Content</h2>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Content Type</label>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                    {CONTENT_TYPES.map((type) => (
                                        <button
                                            key={type.value}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, content_type: type.value })}
                                            className={`p-3 rounded-xl text-left text-sm font-medium transition-all ${formData.content_type === type.value
                                                    ? 'bg-primary-100 border-2 border-primary-500 text-primary-700'
                                                    : 'bg-slate-50 border-2 border-transparent text-slate-600 hover:bg-slate-100'
                                                }`}
                                        >
                                            {type.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Title</label>
                                <input
                                    required
                                    className="w-full border border-slate-200 p-3 rounded-xl focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="e.g., Chapter 1 Notes"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Description (optional)</label>
                                <input
                                    className="w-full border border-slate-200 p-3 rounded-xl focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Brief description"
                                />
                            </div>

                            {formData.content_type === 'NOTE' && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Content</label>
                                    <textarea
                                        required
                                        rows={6}
                                        className="w-full border border-slate-200 p-3 rounded-xl focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none resize-none"
                                        value={formData.text_content}
                                        onChange={(e) => setFormData({ ...formData, text_content: e.target.value })}
                                        placeholder="Write your notes here..."
                                    />
                                </div>
                            )}

                            {formData.content_type === 'LINK' && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">URL</label>
                                    <input
                                        required
                                        type="url"
                                        className="w-full border border-slate-200 p-3 rounded-xl focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none"
                                        value={formData.link_url}
                                        onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
                                        placeholder="https://..."
                                    />
                                </div>
                            )}

                            {['PDF', 'DOCUMENT', 'VIDEO'].includes(formData.content_type) && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Upload File</label>
                                    <input
                                        required
                                        type="file"
                                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                                        className="w-full border border-slate-200 p-3 rounded-xl focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none file:mr-3 file:px-3 file:py-1 file:rounded-full file:border-0 file:bg-primary-50 file:text-primary-600 file:font-medium"
                                    />
                                    {file && (
                                        <p className="mt-2 text-sm text-slate-500">
                                            Selected: {file.name} ({formatFileSize(file.size)})
                                        </p>
                                    )}
                                </div>
                            )}

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 px-4 py-3 border border-slate-200 rounded-xl hover:bg-slate-50 font-medium text-slate-700"
                                >
                                    Cancel
                                </button>
                                <button
                                    disabled={uploading}
                                    type="submit"
                                    className="flex-1 px-4 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 font-medium flex items-center justify-center gap-2"
                                >
                                    {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="h-5 w-5" />}
                                    {uploading ? 'Uploading...' : 'Upload'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
