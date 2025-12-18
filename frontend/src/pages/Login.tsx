import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { School, Loader2 } from 'lucide-react';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await api.post('/auth/login', { email, password });
            const { access_token, user } = response.data;

            login(access_token, user.role, user);

            if (user.role === 'SUPERADMIN') {
                navigate('/superadmin');
            } else {
                navigate('/dashboard');
            }
        } catch (err: any) {
            setError(err.response?.data?.error || 'Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex font-sans">
            {/* Left Side - Hero / Branding */}
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
                            Excellence in <br />
                            <span className="text-primary-300">School Management</span>
                        </h1>
                        <p className="text-lg text-primary-100 max-w-md">
                            Streamline your administrative tasks, manage finances, and track student success with our premium comprehensive solution.
                        </p>
                    </div>

                    <div className="text-sm text-primary-300/60">
                        &copy; {new Date().getFullYear()} SchoolMS Inc. All rights reserved.
                    </div>
                </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
                <div className="w-full max-w-md space-y-8">
                    <div className="text-center lg:text-left">
                        <div className="lg:hidden flex justify-center mb-6">
                            <div className="bg-primary-50 p-3 rounded-xl">
                                <School className="h-10 w-10 text-primary-600" />
                            </div>
                        </div>
                        <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Welcome back</h2>
                        <p className="mt-2 text-slate-500">Please enter your details to sign in.</p>
                    </div>

                    {error && (
                        <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm flex items-center shadow-sm">
                            <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-5">
                            <div>
                                <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Email</label>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none transition-all placeholder:text-slate-400 bg-slate-50 hover:bg-white"
                                    placeholder="admin@school.com"
                                />
                            </div>

                            <div>
                                <label className="flex justify-between text-sm font-semibold text-slate-700 mb-1.5">
                                    Password
                                    <a href="#" className="text-primary-600 hover:text-primary-700 text-sm font-medium">Forgot password?</a>
                                </label>
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none transition-all placeholder:text-slate-400 bg-slate-50 hover:bg-white"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-primary-500/20 transition-all transform active:scale-[0.98] flex items-center justify-center"
                        >
                            {loading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Sign In'}
                        </button>

                        <div className="text-center mt-6">
                            <p className="text-slate-600">
                                Don't have an account?{' '}
                                <a href="/signup" className="font-semibold text-primary-600 hover:text-primary-700 transition-colors">
                                    Sign up
                                </a>
                            </p>
                        </div>
                    </form>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-slate-200"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-4 bg-white text-slate-400">Secure System</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
