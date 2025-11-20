import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import authBg from '../../assets/auth-bg.png';
import logo from '../../assets/logo.png';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login, user, loading } = useAuth();
    const navigate = useNavigate();

    // Redirect if already logged in
    useEffect(() => {
        if (user && !loading) {
            navigate('/', { replace: true });
        }
    }, [user, loading, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(''); // Clear previous errors
        const res = await login(email, password);
        if (res.success) {
            navigate('/', { replace: true });
        } else {
            setError(res.message);
        }
    };

    // Show loading while checking authentication
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-primary-900">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
                    <p className="text-white">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
            {/* Background Image */}
            <div
                className="absolute inset-0 z-0"
                style={{
                    backgroundImage: `url(${authBg})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                }}
            >
                <div className="absolute inset-0 bg-primary-900/30 backdrop-blur-sm"></div>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="relative z-10 w-full max-w-md p-8 mx-4"
            >
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-2xl p-8">
                    <div className="text-center mb-8">
                        <motion.img
                            src={logo}
                            alt="Atmadarshan Logo"
                            className="w-24 h-24 mx-auto mb-4 rounded-full shadow-lg"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 200, damping: 15 }}
                        />
                        <h2 className="text-3xl font-heading font-bold text-white mb-2">
                            Welcome Back
                        </h2>
                        <p className="text-primary-100">
                            Continue your journey to inner peace
                        </p>
                    </div>

                    <form className="space-y-6" onSubmit={handleSubmit}>
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="bg-red-500/20 border border-red-500/50 text-red-100 px-4 py-2 rounded-lg text-sm text-center"
                            >
                                {error}
                            </motion.div>
                        )}

                        <div className="space-y-4">
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Mail className="h-5 w-5 text-primary-200 group-focus-within:text-accent-500 transition-colors" />
                                </div>
                                <input
                                    type="email"
                                    required
                                    className="block w-full pl-10 pr-3 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-primary-200 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:bg-white/10 transition-all duration-200"
                                    placeholder="Email address"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>

                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-primary-200 group-focus-within:text-accent-500 transition-colors" />
                                </div>
                                <input
                                    type="password"
                                    required
                                    className="block w-full pl-10 pr-3 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-primary-200 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:bg-white/10 transition-all duration-200"
                                    placeholder="Password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-xl text-sm font-bold text-white bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-primary-900 focus:ring-accent-500 transform hover:-translate-y-0.5 transition-all duration-200 shadow-lg shadow-primary-900/20"
                        >
                            Sign in
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </button>

                        <div className="text-center">
                            <Link
                                to="/forgot-password"
                                className="text-primary-100 hover:text-accent-400 text-sm font-medium transition-colors duration-200"
                            >
                                Forgot password?
                            </Link>
                        </div>

                        <div className="text-center mt-4">
                            <Link
                                to="/signup"
                                className="text-primary-100 hover:text-white text-sm font-medium transition-colors duration-200"
                            >
                                Don't have an account? <span className="text-accent-400 hover:text-accent-300 underline decoration-accent-400/30 underline-offset-4">Sign up</span>
                            </Link>
                        </div>
                    </form>
                </div>
            </motion.div>
        </div>
    );
}
