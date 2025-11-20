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
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
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
                        <img src={logo} alt="Atmadarshan Logo" className="w-24 h-24 mx-auto mb-4 rounded-full shadow-lg" />
                        <h2 className="text-3xl font-heading font-bold text-white mb-2">
                            Reset Password
                        </h2>
                        <p className="text-primary-100">
                            {step === 1 ? 'Enter your email address' : 'Answer your security question'}
                        </p>
                    </div>

                    {error && (
                        <div className="bg-red-500/20 border border-red-500/50 text-red-100 px-4 py-2 rounded-lg text-sm mb-4 flex items-center">
                            <AlertCircle size={16} className="mr-2" />
                            {error}
                        </div>
                    )}

                    {step === 1 ? (
                        <form onSubmit={handleEmailSubmit} className="space-y-4">
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                                    <Mail className="h-5 w-5 text-primary-200" />
                                </div>
                                <input
                                    type="email"
                                    required
                                    className="block w-full pl-10 pr-3 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-primary-200 focus:outline-none focus:ring-2 focus:ring-accent-500"
                                    placeholder="Enter your email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                            <button
                                type="submit"
                                className="w-full flex items-center justify-center py-3 px-4 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 transform hover:-translate-y-0.5 transition-all"
                            >
                                Continue
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handleResetSubmit} className="space-y-4">
                            <div className="bg-white/5 border border-white/10 rounded-lg p-3 mb-4">
                                <div className="flex items-start">
                                    <HelpCircle className="h-5 w-5 text-accent-400 mr-2 mt-0.5 flex-shrink-0" />
                                    <p className="text-sm text-primary-100">{securityQuestion}</p>
                                </div>
                            </div>
                            <div className="relative">
                                <input
                                    type="text"
                                    required
                                    className="block w-full px-3 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-primary-200 focus:outline-none focus:ring-2 focus:ring-accent-500"
                                    placeholder="Your answer"
                                    value={securityAnswer}
                                    onChange={(e) => setSecurityAnswer(e.target.value)}
                                />
                            </div>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                                    <Lock className="h-5 w-5 text-primary-200" />
                                </div>
                                <input
                                    type="password"
                                    required
                                    className="block w-full pl-10 pr-3 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-primary-200 focus:outline-none focus:ring-2 focus:ring-accent-500"
                                    placeholder="New password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                />
                            </div>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                                    <Lock className="h-5 w-5 text-primary-200" />
                                </div>
                                <input
                                    type="password"
                                    required
                                    className="block w-full pl-10 pr-3 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-primary-200 focus:outline-none focus:ring-2 focus:ring-accent-500"
                                    placeholder="Confirm new password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                />
                            </div>
                            <button
                                type="submit"
                                className="w-full flex items-center justify-center py-3 px-4 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 transform hover:-translate-y-0.5 transition-all"
                            >
                                Reset Password
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </button>
                        </form>
                    )}

                    <div className="text-center mt-6">
                        <Link to="/login" className="text-primary-100 hover:text-white text-sm font-medium">
                            Back to <span className="text-accent-400 hover:text-accent-300 underline">Sign in</span>
                        </Link>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
