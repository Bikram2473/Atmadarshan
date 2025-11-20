import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Mail, Lock, ArrowRight, Check, X, AlertCircle, HelpCircle } from 'lucide-react';
import authBg from '../../assets/auth-bg.png';
import logo from '../../assets/logo.png';

export default function Signup() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [securityQuestion, setSecurityQuestion] = useState('');
    const [securityAnswer, setSecurityAnswer] = useState('');
    const [error, setError] = useState('');
    const [emailError, setEmailError] = useState('');
    const [passwordErrors, setPasswordErrors] = useState({
        length: true,
        uppercase: true,
        lowercase: true,
        number: true,
        special: true
    });
    const { signup, user, loading } = useAuth();
    const navigate = useNavigate();

    const securityQuestions = [
        "What was the name of your first pet?",
        "What is your mother's maiden name?",
        "What city were you born in?",
        "What was the name of your elementary school?",
        "What is your favorite book?"
    ];

    // Redirect if already logged in
    useEffect(() => {
        if (user && !loading) {
            navigate('/', { replace: true });
        }
    }, [user, loading, navigate]);

    // Validate email
    const validateEmail = (email) => {
        if (!email) {
            setEmailError('');
            return false;
        }

        const gmailPattern = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
        if (!gmailPattern.test(email)) {
            setEmailError('Email must be a valid Gmail address (@gmail.com)');
            return false;
        }

        setEmailError('');
        return true;
    };

    // Validate password
    const validatePassword = (pwd) => {
        const errors = {
            length: pwd.length < 8,
            uppercase: !/[A-Z]/.test(pwd),
            lowercase: !/[a-z]/.test(pwd),
            number: !/[0-9]/.test(pwd),
            special: !/[!@#$%^&*(),.?":{}|<>]/.test(pwd)
        };
        setPasswordErrors(errors);
        return !Object.values(errors).some(error => error);
    };

    // Handle email change
    const handleEmailChange = (e) => {
        const value = e.target.value;
        setEmail(value);
        validateEmail(value);
    };

    // Handle password change
    const handlePasswordChange = (e) => {
        const value = e.target.value;
        setPassword(value);
        validatePassword(value);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Validate email
        if (!validateEmail(email)) {
            setError('Please enter a valid Gmail address');
            return;
        }

        // Validate password
        if (!validatePassword(password)) {
            setError('Please meet all password requirements');
            return;
        }

        // Check password confirmation
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        // Check security question and answer
        if (!securityQuestion || !securityAnswer.trim()) {
            setError('Please select a security question and provide an answer');
            return;
        }

        const res = await signup(name, email, password, securityQuestion, securityAnswer);
        if (res.success) {
            navigate('/', { replace: true });
        } else {
            setError(res.message);
        }
    };

    const isPasswordValid = !Object.values(passwordErrors).some(error => error);
    const canSubmit = name && email && password && confirmPassword &&
        securityQuestion && securityAnswer.trim() &&
        !emailError && isPasswordValid && password === confirmPassword;

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
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden py-8">
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
                    <div className="text-center mb-6">
                        <motion.img
                            src={logo}
                            alt="Atmadarshan Logo"
                            className="w-20 h-20 mx-auto mb-3 rounded-full shadow-lg"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 200, damping: 15 }}
                        />
                        <h2 className="text-2xl font-heading font-bold text-white mb-1">
                            Begin Your Journey
                        </h2>
                        <p className="text-primary-100 text-sm">
                            Join our community of mindful practitioners
                        </p>
                    </div>

                    <form className="space-y-4" onSubmit={handleSubmit}>
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="bg-red-500/20 border border-red-500/50 text-red-100 px-3 py-2 rounded-lg text-xs text-center"
                            >
                                {error}
                            </motion.div>
                        )}

                        <div className="space-y-3">
                            {/* Name Field */}
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <User className="h-4 w-4 text-primary-200 group-focus-within:text-accent-500 transition-colors" />
                                </div>
                                <input
                                    type="text"
                                    required
                                    className="block w-full pl-9 pr-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder-primary-200 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:bg-white/10 transition-all duration-200"
                                    placeholder="Full Name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                />
                            </div>

                            {/* Email Field */}
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Mail className="h-4 w-4 text-primary-200 group-focus-within:text-accent-500 transition-colors" />
                                </div>
                                <input
                                    type="email"
                                    required
                                    className={`block w-full pl-9 pr-3 py-2.5 bg-white/5 border ${emailError ? 'border-red-500' : 'border-white/10'} rounded-xl text-white text-sm placeholder-primary-200 focus:outline-none focus:ring-2 ${emailError ? 'focus:ring-red-500' : 'focus:ring-accent-500'} focus:bg-white/10 transition-all duration-200`}
                                    placeholder="Email (@gmail.com)"
                                    value={email}
                                    onChange={handleEmailChange}
                                />
                                {emailError && (
                                    <motion.p
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="mt-1 text-xs text-red-300 flex items-center"
                                    >
                                        <AlertCircle size={10} className="mr-1" />
                                        {emailError}
                                    </motion.p>
                                )}
                            </div>

                            {/* Password Field */}
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-4 w-4 text-primary-200 group-focus-within:text-accent-500 transition-colors" />
                                </div>
                                <input
                                    type="password"
                                    required
                                    className="block w-full pl-9 pr-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder-primary-200 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:bg-white/10 transition-all duration-200"
                                    placeholder="Password"
                                    value={password}
                                    onChange={handlePasswordChange}
                                />
                            </div>

                            {/* Password Requirements */}
                            {password && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    className="bg-white/5 border border-white/10 rounded-lg p-2 space-y-1"
                                >
                                    <p className="text-xs text-primary-100 font-semibold mb-1">Password must have:</p>
                                    <div className="space-y-0.5">
                                        <div className={`flex items-center text-xs ${passwordErrors.length ? 'text-red-300' : 'text-green-300'}`}>
                                            {passwordErrors.length ? <X size={12} className="mr-1" /> : <Check size={12} className="mr-1" />}
                                            8+ characters
                                        </div>
                                        <div className={`flex items-center text-xs ${passwordErrors.uppercase ? 'text-red-300' : 'text-green-300'}`}>
                                            {passwordErrors.uppercase ? <X size={12} className="mr-1" /> : <Check size={12} className="mr-1" />}
                                            Uppercase (A-Z)
                                        </div>
                                        <div className={`flex items-center text-xs ${passwordErrors.lowercase ? 'text-red-300' : 'text-green-300'}`}>
                                            {passwordErrors.lowercase ? <X size={12} className="mr-1" /> : <Check size={12} className="mr-1" />}
                                            Lowercase (a-z)
                                        </div>
                                        <div className={`flex items-center text-xs ${passwordErrors.number ? 'text-red-300' : 'text-green-300'}`}>
                                            {passwordErrors.number ? <X size={12} className="mr-1" /> : <Check size={12} className="mr-1" />}
                                            Number (0-9)
                                        </div>
                                        <div className={`flex items-center text-xs ${passwordErrors.special ? 'text-red-300' : 'text-green-300'}`}>
                                            {passwordErrors.special ? <X size={12} className="mr-1" /> : <Check size={12} className="mr-1" />}
                                            Special char (!@#...)
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* Confirm Password */}
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-4 w-4 text-primary-200 group-focus-within:text-accent-500 transition-colors" />
                                </div>
                                <input
                                    type="password"
                                    required
                                    className={`block w-full pl-9 pr-3 py-2.5 bg-white/5 border ${confirmPassword && password !== confirmPassword ? 'border-red-500' : 'border-white/10'} rounded-xl text-white text-sm placeholder-primary-200 focus:outline-none focus:ring-2 ${confirmPassword && password !== confirmPassword ? 'focus:ring-red-500' : 'focus:ring-accent-500'} focus:bg-white/10 transition-all duration-200`}
                                    placeholder="Confirm Password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                />
                                {confirmPassword && password !== confirmPassword && (
                                    <motion.p
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="mt-1 text-xs text-red-300 flex items-center"
                                    >
                                        <AlertCircle size={10} className="mr-1" />
                                        Passwords do not match
                                    </motion.p>
                                )}
                            </div>

                            {/* Security Question */}
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                                    <HelpCircle className="h-4 w-4 text-primary-200 group-focus-within:text-accent-500 transition-colors" />
                                </div>
                                <select
                                    required
                                    className="block w-full pl-9 pr-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-accent-500 focus:bg-white/10 transition-all duration-200 appearance-none cursor-pointer"
                                    value={securityQuestion}
                                    onChange={(e) => setSecurityQuestion(e.target.value)}
                                >
                                    <option value="" className="bg-primary-900">Select a security question</option>
                                    {securityQuestions.map((q, idx) => (
                                        <option key={idx} value={q} className="bg-primary-900">{q}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Security Answer */}
                            {securityQuestion && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    className="relative group"
                                >
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Lock className="h-4 w-4 text-primary-200 group-focus-within:text-accent-500 transition-colors" />
                                    </div>
                                    <input
                                        type="text"
                                        required
                                        className="block w-full pl-9 pr-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder-primary-200 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:bg-white/10 transition-all duration-200"
                                        placeholder="Your answer (case-sensitive)"
                                        value={securityAnswer}
                                        onChange={(e) => setSecurityAnswer(e.target.value)}
                                    />
                                </motion.div>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={!canSubmit}
                            className="w-full flex items-center justify-center py-2.5 px-4 border border-transparent rounded-xl text-sm font-bold text-white bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-primary-900 focus:ring-accent-500 transform hover:-translate-y-0.5 transition-all duration-200 shadow-lg shadow-primary-900/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none mt-4"
                        >
                            Create Account
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </button>

                        <div className="text-center mt-4">
                            <Link
                                to="/login"
                                className="text-primary-100 hover:text-white text-sm font-medium transition-colors duration-200"
                            >
                                Already have an account? <span className="text-accent-400 hover:text-accent-300 underline decoration-accent-400/30 underline-offset-4">Sign in</span>
                            </Link>
                        </div>
                    </form>
                </div>
            </motion.div>
        </div>
    );
}
