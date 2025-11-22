import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../api/axios';
import { motion } from 'framer-motion';
import { Mail, Lock, ArrowRight, AlertCircle, HelpCircle } from 'lucide-react';
import authBg from '../../assets/auth-bg.png';
import logo from '../../assets/logo.png';

export default function ForgotPassword() {
    const [step, setStep] = useState(1); // 1: email, 2: security question
    const [email, setEmail] = useState('');
    const [securityQuestion, setSecurityQuestion] = useState('');
    const [securityAnswer, setSecurityAnswer] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const navigate = useNavigate();

    const handleEmailSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            const res = await api.post('/api/auth/forgot-password/verify-email', { email });
            setSecurityQuestion(res.data.securityQuestion);
            setStep(2);
        } catch (err) {
            setError(err.response?.data?.message || 'Email not found');
        }
    };

    const handleResetSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (newPassword !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (newPassword.length < 8) {
            setError('Password must be at least 8 characters');
            return;
        }

        try {
            await api.post('/api/auth/forgot-password/reset', {
                email,
                securityAnswer,
                newPassword
            });
            setSuccess(true);
            setTimeout(() => navigate('/login'), 2000);
        } catch (err) {
            setError(err.response?.data?.message || 'Reset failed');
        }
    };

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-primary-900">
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="text-center"
                >
                    <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Check className="w-8 h-8 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Password Reset Successful!</h2>
                    <p className="text-primary-200">Redirecting to login...</p>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex bg-slate-900">
            {/* Left Side - Image & Brand */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-slate-900">
                <div
                    className="absolute inset-0 z-0"
                    style={{
                        backgroundImage: `url(${authBg})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                    }}
                >
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px]"></div>
                </div>

                <div className="relative z-10 w-full flex flex-col justify-between p-12 text-white">
                    <div>
                        <img src={logo} alt="Atmadarshan Logo" className="w-16 h-16 rounded-full shadow-lg mb-6 ring-2 ring-slate-500" />
                        <h1 className="text-4xl font-heading font-bold mb-4">Account Recovery</h1>
                        <p className="text-slate-300 text-lg max-w-md">
                            "Peace comes from within. Do not seek it without."
                        </p>
                    </div>
                    <div className="text-sm text-slate-400">
                        © {new Date().getFullYear()} Atmadarshan Yoga. All rights reserved.
                    </div>
                </div>
            </div>

            {/* Right Side - Forgot Password Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5 }}
                    className="w-full max-w-md bg-slate-800 p-8 rounded-2xl shadow-xl border border-slate-700"
                >
                    <div className="text-center mb-8">
                        <h2 className="text-3xl font-heading font-bold text-white mb-2">Reset Password</h2>
                        <p className="text-slate-400">
                            {step === 1 ? 'Enter your email address to continue' : 'Answer your security question'}
                        </p>
                    </div>

                    {error && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="bg-red-900/20 border border-red-900/50 text-red-400 px-4 py-3 rounded-lg text-sm flex items-center gap-2 mb-6"
                        >
                            <AlertCircle size={16} />
                            {error}
                        </motion.div>
                    )}

                    {step === 1 ? (
                        <form onSubmit={handleEmailSubmit} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1.5">Email Address</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Mail className="h-5 w-5 text-slate-500 group-focus-within:text-primary-400 transition-colors" />
                                    </div>
                                    <input
                                        type="email"
                                        required
                                        className="block w-full pl-10 pr-3 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                                        placeholder="you@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                            </div>
                            <button
                                type="submit"
                                className="w-full flex items-center justify-center py-3.5 px-4 border border-transparent rounded-xl text-sm font-bold text-white bg-primary-700 hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-700 transform transition-all duration-200 shadow-lg shadow-primary-900/20"
                            >
                                Continue
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handleResetSubmit} className="space-y-6">
                            <div className="bg-slate-900 border border-slate-700 rounded-xl p-4">
                                <div className="flex items-start gap-3">
                                    <HelpCircle className="h-5 w-5 text-primary-400 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <p className="text-xs text-primary-400 font-bold uppercase tracking-wider mb-1">Security Question</p>
                                        <p className="text-sm font-medium text-white">{securityQuestion}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-5">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Security Answer</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Lock className="h-5 w-5 text-slate-500 group-focus-within:text-primary-400 transition-colors" />
                                        </div>
                                        <input
                                            type="text"
                                            required
                                            className="block w-full pl-10 pr-3 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                                            placeholder="Your answer"
                                            value={securityAnswer}
                                            onChange={(e) => setSecurityAnswer(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1.5">New Password</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Lock className="h-5 w-5 text-slate-500 group-focus-within:text-primary-400 transition-colors" />
                                        </div>
                                        <input
                                            type="password"
                                            required
                                            className="block w-full pl-10 pr-3 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                                            placeholder="New password"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Confirm New Password</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Lock className="h-5 w-5 text-slate-500 group-focus-within:text-primary-400 transition-colors" />
                                        </div>
                                        <input
                                            type="password"
                                            required
                                            className="block w-full pl-10 pr-3 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                                            placeholder="Confirm new password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="w-full flex items-center justify-center py-3.5 px-4 border border-transparent rounded-xl text-sm font-bold text-white bg-primary-700 hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-700 transform transition-all duration-200 shadow-lg shadow-primary-900/20"
                            >
                                Reset Password
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </button>
                        </form>
                    )}

                    <div className="text-center mt-6">
                        <p className="text-sm text-slate-400">
                            Remember your password?{' '}
                            <Link
                                to="/login"
                                className="font-bold text-primary-400 hover:text-primary-300 transition-colors"
                            >
                                Sign in
                            </Link>
                        </p>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
