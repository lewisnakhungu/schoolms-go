import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { School, Loader2, ArrowLeft } from 'lucide-react';

export default function Signup() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [inviteCode, setInviteCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // 1. Signup
            await api.post('/auth/signup', {
                email,
                password,
                invite_code: inviteCode
            });

            // 2. Auto Login after signup
            const response = await api.post('/auth/login', { email, password });
            const { access_token, user } = response.data;

            login(access_token, user.role, user);
            navigate('/dashboard');

        } catch (err: any) {
            setError(err.response?.data?.error || 'Signup failed. Please check your invite code.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex font-sans">
            {/* Left Side - Hero / Branding (Identical to Login) */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-900 via-primary-800 to-primary-950 relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-10 mix-blend-overlay"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-primary-950/80 to-transparent"></div>

                <div className="relative z-10 p-16 flex flex-col justify-between h-full text-white">
                    <div className="flex items-center space-x-3">
                        <div className="bg-white/10 p-2 rounded-lg backdrop-blur-sm">
                            <School className="h-8 w-8 text-primary-200" />
                        </div>
                        <span className="text-2xl font-bold tracking-tight">SchoolMS</span>
                    </div>

                    <div className="space-y-6">
                        <h1 className="text-5xl font-bold leading-tight">
                            Join the <br />
                            <span className="text-primary-300">Community</span>
                        </h1>
                        <p className="text-lg text-primary-100 max-w-md">
                            Activate your account using your invite code to access your personalized dashboard and resources.
                        </p>
                    </div>

                    <div className="text-sm text-primary-300/60">
                        &copy; {new Date().getFullYear()} SchoolMS Inc. All rights reserved.
                    </div>
                </div>
            </div>

            {/* Right Side - Signup Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
                <div className="w-full max-w-md space-y-8">
                    <div className="text-center lg:text-left">
                        <Link to="/login" className="inline-flex items-center text-sm text-slate-400 hover:text-primary-600 mb-6 transition-colors">
                            <ArrowLeft className="h-4 w-4 mr-1" />
                            Back to Login
                        </Link>
                        <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Activate Account</h2>
                        <p className="mt-2 text-slate-500">Enter your invite code to get started.</p>
                    </div>

                    {error && (
                        <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm flex items-center shadow-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-5">
                            <div>
                                <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Invite Code</label>
                                <input
                                    type="text"
                                    required
                                    value={inviteCode}
                                    onChange={(e) => setInviteCode(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none transition-all bg-slate-50/50 uppercase tracking-widest placeholder:normal-case placeholder:tracking-normal"
                                    placeholder="INV-XXXX-XXXX"
                                />
                            </div>

                            <div>
                                <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Email</label>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none transition-all placeholder:text-slate-400 bg-slate-50/50"
                                    placeholder="student@school.com"
                                />
                            </div>

                            <div>
                                <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Create Password</label>
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none transition-all placeholder:text-slate-400 bg-slate-50/50"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-primary-500/20 transition-all transform active:scale-[0.98] flex items-center justify-center"
                        >
                            {loading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Complete Registration'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
