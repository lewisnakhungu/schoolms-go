import { Link } from 'react-router-dom';
import {
    GraduationCap, Users, CreditCard, ClipboardCheck,
    BarChart3, Shield, Smartphone, Zap, ChevronRight,
    CheckCircle2, Star, ArrowRight
} from 'lucide-react';

export default function LandingPage() {
    const features = [
        {
            icon: <Users className="h-6 w-6" />,
            title: 'Student Management',
            description: 'Manage student enrollment, profiles, and academic records in one place.'
        },
        {
            icon: <ClipboardCheck className="h-6 w-6" />,
            title: 'Attendance Tracking',
            description: 'Mark and monitor daily attendance with real-time analytics.'
        },
        {
            icon: <CreditCard className="h-6 w-6" />,
            title: 'Fee Management',
            description: 'Handle fee structures, payments, and generate defaulter reports.'
        },
        {
            icon: <BarChart3 className="h-6 w-6" />,
            title: 'Academic Reports',
            description: 'Track grades, generate report cards, and monitor performance.'
        },
        {
            icon: <Shield className="h-6 w-6" />,
            title: 'Role-Based Access',
            description: 'Secure access for admins, teachers, finance, parents, and students.'
        },
        {
            icon: <Smartphone className="h-6 w-6" />,
            title: 'Parent Portal',
            description: 'Parents can track their children\'s progress, attendance, and fees.'
        }
    ];

    const stats = [
        { value: '6', label: 'User Roles' },
        { value: '15+', label: 'Features' },
        { value: '100%', label: 'Cloud Ready' },
        { value: '24/7', label: 'Support' }
    ];

    return (
        <div className="min-h-screen bg-white">
            {/* Navigation */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-slate-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-2">
                            <GraduationCap className="h-8 w-8 text-primary-600" />
                            <span className="text-xl font-bold text-slate-900">SchoolMS</span>
                        </div>
                        <div className="hidden md:flex items-center gap-8">
                            <a href="#features" className="text-slate-600 hover:text-primary-600 transition-colors">Features</a>
                            <a href="#pricing" className="text-slate-600 hover:text-primary-600 transition-colors">Pricing</a>
                            <a href="#contact" className="text-slate-600 hover:text-primary-600 transition-colors">Contact</a>
                        </div>
                        <div className="flex items-center gap-3">
                            <Link to="/login" className="px-4 py-2 text-slate-600 hover:text-primary-600 font-medium transition-colors">
                                Login
                            </Link>
                            <Link to="/signup" className="px-4 py-2 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 transition-colors">
                                Get Started
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-primary-50 via-white to-violet-50">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center max-w-4xl mx-auto">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-100 text-primary-700 rounded-full text-sm font-medium mb-6">
                            <Zap className="h-4 w-4" />
                            Modern School Management System
                        </div>
                        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 leading-tight mb-6">
                            Simplify Your School
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-violet-600"> Operations</span>
                        </h1>
                        <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
                            A complete platform to manage students, teachers, finances, and academics.
                            Empower your institution with modern tools.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Link
                                to="/signup"
                                className="inline-flex items-center gap-2 px-8 py-4 bg-primary-600 text-white rounded-2xl font-semibold hover:bg-primary-700 transition-all shadow-lg shadow-primary-600/25 hover:shadow-xl"
                            >
                                Start Free Trial
                                <ArrowRight className="h-5 w-5" />
                            </Link>
                            <a
                                href="#features"
                                className="inline-flex items-center gap-2 px-8 py-4 border-2 border-slate-200 text-slate-700 rounded-2xl font-semibold hover:border-primary-200 hover:text-primary-600 transition-all"
                            >
                                See Features
                                <ChevronRight className="h-5 w-5" />
                            </a>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4">
                        {stats.map((stat, i) => (
                            <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 text-center">
                                <div className="text-3xl font-bold text-primary-600">{stat.value}</div>
                                <div className="text-slate-500">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-20 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
                            Everything You Need
                        </h2>
                        <p className="text-xl text-slate-600 max-w-2xl mx-auto">
                            Comprehensive tools to run your school efficiently
                        </p>
                    </div>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {features.map((feature, i) => (
                            <div
                                key={i}
                                className="group p-6 bg-white rounded-2xl border border-slate-100 hover:border-primary-200 hover:shadow-lg transition-all duration-300"
                            >
                                <div className="inline-flex items-center justify-center p-3 bg-primary-50 text-primary-600 rounded-xl mb-4 group-hover:bg-primary-100 transition-colors">
                                    {feature.icon}
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-2">{feature.title}</h3>
                                <p className="text-slate-600">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* User Roles Section */}
            <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-50">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
                            Built for Everyone
                        </h2>
                        <p className="text-xl text-slate-600">
                            Dedicated dashboards for every stakeholder
                        </p>
                    </div>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[
                            { role: 'Super Admin', desc: 'Manage all schools, handle support tickets, monitor system health', color: 'from-purple-500 to-purple-600' },
                            { role: 'School Admin', desc: 'Oversee students, classes, finances, and send notifications', color: 'from-primary-500 to-primary-600' },
                            { role: 'Teacher', desc: 'Manage classes, mark attendance, enter grades, upload content', color: 'from-blue-500 to-blue-600' },
                            { role: 'Finance Officer', desc: 'Process payments, track defaulters, generate financial reports', color: 'from-green-500 to-green-600' },
                            { role: 'Parent', desc: 'View children\'s grades, attendance, and fee status', color: 'from-amber-500 to-amber-600' },
                            { role: 'Student', desc: 'Access grades, view materials, check balances, get support', color: 'from-rose-500 to-rose-600' }
                        ].map((item, i) => (
                            <div key={i} className={`p-6 rounded-2xl text-white bg-gradient-to-br ${item.color}`}>
                                <h3 className="text-xl font-bold mb-2">{item.role}</h3>
                                <p className="text-white/90">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Pricing Section */}
            <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
                            Simple, Transparent Pricing
                        </h2>
                        <p className="text-xl text-slate-600">
                            Choose the plan that fits your school
                        </p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                        {[
                            { name: 'Starter', price: 'Free', features: ['Up to 50 students', 'Basic attendance', 'Email support'], highlighted: false },
                            { name: 'Professional', price: 'KES 5,000/mo', features: ['Up to 500 students', 'All features', 'Priority support', 'Custom reports'], highlighted: true },
                            { name: 'Enterprise', price: 'Custom', features: ['Unlimited students', 'Dedicated support', 'Custom integrations', 'SLA guarantee'], highlighted: false }
                        ].map((plan, i) => (
                            <div
                                key={i}
                                className={`p-8 rounded-2xl ${plan.highlighted
                                    ? 'bg-primary-600 text-white ring-4 ring-primary-600/20 scale-105'
                                    : 'bg-white border border-slate-200'
                                    }`}
                            >
                                <h3 className={`text-xl font-bold mb-2 ${plan.highlighted ? 'text-white' : 'text-slate-900'}`}>
                                    {plan.name}
                                </h3>
                                <div className={`text-3xl font-bold mb-6 ${plan.highlighted ? 'text-white' : 'text-primary-600'}`}>
                                    {plan.price}
                                </div>
                                <ul className="space-y-3 mb-8">
                                    {plan.features.map((f, j) => (
                                        <li key={j} className="flex items-center gap-2">
                                            <CheckCircle2 className={`h-5 w-5 ${plan.highlighted ? 'text-primary-200' : 'text-primary-600'}`} />
                                            <span className={plan.highlighted ? 'text-white/90' : 'text-slate-600'}>{f}</span>
                                        </li>
                                    ))}
                                </ul>
                                <button className={`w-full py-3 rounded-xl font-semibold transition-colors ${plan.highlighted
                                        ? 'bg-white text-primary-600 hover:bg-primary-50'
                                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                    }`}>
                                    Get Started
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-primary-600 to-violet-600">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
                        Ready to Transform Your School?
                    </h2>
                    <p className="text-xl text-white/90 mb-8">
                        Join schools using SchoolMS to streamline their operations
                    </p>
                    <Link
                        to="/signup"
                        className="inline-flex items-center gap-2 px-8 py-4 bg-white text-primary-600 rounded-2xl font-semibold hover:bg-primary-50 transition-colors"
                    >
                        Start Your Free Trial
                        <ArrowRight className="h-5 w-5" />
                    </Link>
                </div>
            </section>

            {/* Footer */}
            <footer id="contact" className="py-12 px-4 sm:px-6 lg:px-8 bg-slate-900 text-white">
                <div className="max-w-7xl mx-auto">
                    <div className="grid md:grid-cols-4 gap-8">
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <GraduationCap className="h-8 w-8 text-primary-400" />
                                <span className="text-xl font-bold">SchoolMS</span>
                            </div>
                            <p className="text-slate-400">
                                Modern school management for the digital age.
                            </p>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-4">Product</h4>
                            <ul className="space-y-2 text-slate-400">
                                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-4">Company</h4>
                            <ul className="space-y-2 text-slate-400">
                                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-4">Contact</h4>
                            <ul className="space-y-2 text-slate-400">
                                <li>hello@schoolms.com</li>
                                <li>+254 700 000 000</li>
                                <li>Nairobi, Kenya</li>
                            </ul>
                        </div>
                    </div>
                    <div className="border-t border-slate-800 mt-12 pt-8 text-center text-slate-400">
                        <p>&copy; {new Date().getFullYear()} SchoolMS. All rights reserved.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
