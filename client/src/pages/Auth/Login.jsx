import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, AlertCircle, Eye, EyeOff } from 'lucide-react';
import authBg from '../../assets/auth-bg.png';
import logo from '../../assets/logo.png';

export default function Login() {
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const { login, user, loading } = useAuth();
    const navigate = useNavigate();

    // Redirect if already logged in
    useEffect(() => {
        if (user && !loading) {
            navigate('/', { replace: true });
        }
    }, [user, loading, navigate]);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(''); // Clear previous errors
        const res = await login(formData.email, formData.password);
        if (res.success) {
            navigate('/', { replace: true });
        } else {
            setError(res.message);
        }
    };

    // Show loading while checking authentication
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-secondary-50 dark:bg-slate-900">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600 dark:border-white mx-auto mb-4"></div>
                    <p className="text-primary-900 dark:text-white">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col md:flex-row bg-secondary-50 dark:bg-slate-900 transition-colors duration-300">
            {/* Left Side - Image & Brand */}
            <div className="hidden md:flex w-1/2 bg-slate-800 relative overflow-hidden">
                <div className="absolute inset-0 bg-primary-900/40 z-10"></div>
                <img
                    src={authBg}
                    alt="Yoga Meditation"
                    className="absolute inset-0 w-full h-full object-cover opacity-80 mix-blend-overlay"
                />
                <div className="relative z-20 flex flex-col justify-between p-12 h-full text-white">
                    <div>
                        <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center mb-6 border border-white/20 shadow-xl">
                            <img src={logo} alt="Logo" className="w-10 h-10 drop-shadow-md" />
                        </div>
                        <h1 className="text-5xl font-heading font-bold mb-4 leading-tight">
                            Journey to <br />
                            <span className="text-accent-400">Inner Peace</span>
                        </h1>
                        <p className="text-lg text-slate-200 max-w-md font-light">
                            Join our community dedicated to mindfulness, wellness, and the ancient art of yoga.
                        </p>
                    </div>
                    <div className="text-sm text-slate-400 font-medium">
                        © {new Date().getFullYear()} Atmadarshan. All rights reserved.
                    </div>
                </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="w-full md:w-1/2 flex items-center justify-center p-6 md:p-12 relative">
                {/* Mobile Logo */}
                <div className="absolute top-6 left-6 md:hidden flex items-center gap-2">
                    <img src={logo} alt="Logo" className="w-8 h-8 rounded-full shadow-sm" />
                    <span className="font-heading font-bold text-primary-900 dark:text-white text-lg">Atmadarshan</span>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="w-full max-w-md space-y-8"
                >
                    <div className="text-center md:text-left">
                        <h2 className="text-3xl md:text-4xl font-heading font-bold text-primary-900 dark:text-white tracking-tight">Welcome Back</h2>
                        <p className="mt-2 text-secondary-500 dark:text-slate-400">
                            Please sign in to access your dashboard
                        </p>
                    </div>

                    {error && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30 flex items-start gap-3"
                        >
                            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-red-700 dark:text-red-300 font-medium">{error}</p>
                        </motion.div>
                    )}

                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <div className="space-y-5">
                            <div>
                                <label htmlFor="email" className="block text-sm font-bold text-primary-900 dark:text-slate-300 mb-1.5 ml-1">
                                    Email Address
                                </label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Mail className="h-5 w-5 text-secondary-400 dark:text-slate-500 group-focus-within:text-primary-600 dark:group-focus-within:text-primary-400 transition-colors" />
                                    </div>
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        autoComplete="email"
                                        required
                                        className="block w-full pl-11 pr-4 py-3.5 bg-white dark:bg-slate-800 border border-secondary-200 dark:border-slate-700 rounded-xl text-primary-900 dark:text-white placeholder-secondary-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-600 dark:focus:border-primary-500 transition-all shadow-sm"
                                        placeholder="you@example.com"
                                        value={formData.email}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-1.5 ml-1">
                                    <label htmlFor="password" className="block text-sm font-bold text-primary-900 dark:text-slate-300">
                                        Password
                                    </label>
                                    <Link
                                        to="/forgot-password"
                                        className="text-sm font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
                                    >
                                        Forgot password?
                                    </Link>
                                </div>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Lock className="h-5 w-5 text-secondary-400 dark:text-slate-500 group-focus-within:text-primary-600 dark:group-focus-within:text-primary-400 transition-colors" />
                                    </div>
                                    <input
                                        id="password"
                                        name="password"
                                        type={showPassword ? "text" : "password"}
                                        autoComplete="current-password"
                                        required
                                        className="block w-full pl-11 pr-12 py-3.5 bg-white dark:bg-slate-800 border border-secondary-200 dark:border-slate-700 rounded-xl text-primary-900 dark:text-white placeholder-secondary-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-600 dark:focus:border-primary-500 transition-all shadow-sm"
                                        placeholder="••••••••"
                                        value={formData.password}
                                        onChange={handleChange}
                                    />
                                    <button
                                        type="button"
                                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-secondary-400 dark:text-slate-500 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-lg text-sm font-bold text-white bg-gradient-to-r from-primary-600 to-primary-800 hover:from-primary-700 hover:to-primary-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transform transition-all active:scale-[0.98]"
                        >
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Signing in...
                                </span>
                            ) : (
                                "Sign In"
                            )}
                        </button>

                        <div className="relative my-8">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-secondary-200 dark:border-slate-700"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-4 bg-secondary-50 dark:bg-slate-900 text-secondary-500 dark:text-slate-500 font-medium">Don't have an account?</span>
                            </div>
                        </div>

                        <div className="text-center">
                            <Link
                                to="/signup"
                                className="inline-flex items-center justify-center w-full px-4 py-3.5 border-2 border-secondary-200 dark:border-slate-700 rounded-xl shadow-sm text-sm font-bold text-primary-900 dark:text-white bg-white dark:bg-slate-800 hover:bg-secondary-50 dark:hover:bg-slate-700 hover:border-secondary-300 dark:hover:border-slate-600 transition-all"
                            >
                                Create an Account
                            </Link>
                        </div>
                    </form>
                </motion.div>
            </div>
        </div>
    );
}
