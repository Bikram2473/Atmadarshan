import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import Circulars from '../../components/Circulars';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, Video, Bug, X, AlertCircle, CheckCircle, Trash2 } from 'lucide-react';
import api from '../../api/axios';

export default function Home() {
    const { user } = useAuth();
    const [upcomingClasses, setUpcomingClasses] = useState([]);
    const [loadingClasses, setLoadingClasses] = useState(true);

    // Bug report states
    const [showBugModal, setShowBugModal] = useState(false);
    const [bugReports, setBugReports] = useState([]);
    const [loadingBugs, setLoadingBugs] = useState(false);
    const [bugForm, setBugForm] = useState({
        title: '',
        description: '',
        category: 'general',
        priority: 'medium'
    });
    const [submitingBug, setSubmitingBug] = useState(false);

    // Fetch upcoming classes filtered by userId
    useEffect(() => {
        const fetchClasses = async () => {
            if (!user) return;
            try {
                const response = await api.get(`/api/classes?userId=${user.id}`);
                setUpcomingClasses(response.data.slice(0, 3)); // Show only first 3 upcoming classes
            } catch (error) {
                console.error('Error fetching classes:', error);
                setUpcomingClasses([]);
            } finally {
                setLoadingClasses(false);
            }
        };
        fetchClasses();
    }, [user]);

    // Fetch bug reports (admin only)
    useEffect(() => {
        const fetchBugReports = async () => {
            if (!user || user.role !== 'admin') return;

            setLoadingBugs(true);
            try {
                const response = await api.get(`/api/bugs/reports?userId=${user.id}`);
                setBugReports(response.data);
            } catch (error) {
                console.error('Error fetching bug reports:', error);
                setBugReports([]);
            } finally {
                setLoadingBugs(false);
            }
        };
        fetchBugReports();
    }, [user]);

    const handleSubmitBug = async (e) => {
        e.preventDefault();
        if (!bugForm.title.trim() || !bugForm.description.trim()) {
            alert('Please fill in all required fields');
            return;
        }

        setSubmitingBug(true);
        try {
            await api.post('/api/bugs/report', {
                userId: user.id,
                userName: user.name,
                userRole: user.role,
                ...bugForm
            });
            alert('Bug report submitted successfully!');
            setBugForm({ title: '', description: '', category: 'general', priority: 'medium' });
            setShowBugModal(false);
        } catch (error) {
            console.error('Error submitting bug report:', error);
            alert(error.response?.data?.message || 'Failed to submit bug report');
        } finally {
            setSubmitingBug(false);
        }
    };

    const handleUpdateBugStatus = async (reportId, newStatus) => {
        try {
            await api.patch(`/api/bugs/reports/${reportId}/status`, {
                userId: user.id,
                status: newStatus
            });
            setBugReports(bugReports.map(bug =>
                bug.id === reportId ? { ...bug, status: newStatus, resolvedAt: newStatus === 'resolved' ? new Date().toISOString() : null } : bug
            ));
        } catch (error) {
            console.error('Error updating bug status:', error);
            alert('Failed to update bug status');
        }
    };

    const handleDeleteBug = async (reportId) => {
        if (!window.confirm('Are you sure you want to delete this bug report?')) return;

        try {
            await api.delete(`/api/bugs/reports/${reportId}`, {
                data: { userId: user.id }
            });
            setBugReports(bugReports.filter(bug => bug.id !== reportId));
        } catch (error) {
            console.error('Error deleting bug report:', error);
            alert('Failed to delete bug report');
        }
    };

    const getBugStatusColor = (status) => {
        switch (status) {
            case 'open': return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400';
            case 'in-progress': return 'bg-yellow-100 text-yellow-700';
            case 'resolved': return 'bg-green-100 text-green-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'high': return 'text-red-600 dark:text-red-400';
            case 'medium': return 'text-yellow-600';
            case 'low': return 'text-green-600';
            default: return 'text-gray-600';
        }
    };

    return (
        <div className="p-6 md:p-8 space-y-8">
            {/* Welcome Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-3xl p-8 text-white shadow-lg relative overflow-hidden"
            >
                <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-64 h-64 bg-accent-500/20 rounded-full blur-3xl"></div>

                <div className="relative z-10 flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-heading font-bold mb-2">
                            Namaste, {user?.name}!
                        </h1>
                        <p className="text-primary-100 text-lg max-w-2xl">
                            Welcome to your personal sanctuary. You are logged in as a <span className="font-semibold capitalize text-accent-300">{user?.role}</span>.
                        </p>
                    </div>

                    {/* Report Bug Button (Students & Teachers only) */}
                    {user?.role !== 'admin' && (
                        <button
                            onClick={() => setShowBugModal(true)}
                            className="flex items-center gap-2 px-6 py-3 bg-white/20 hover:bg-white/30 text-white rounded-xl transition-all font-bold backdrop-blur-sm border border-white/30"
                        >
                            <Bug size={20} />
                            Report Bug
                        </button>
                    )}
                </div>
            </motion.div>

            {/* Admin: Bug Reports Section */}
            {user?.role === 'admin' && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-secondary-200 dark:border-slate-700 p-6"
                >
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                                <Bug className="text-red-600 dark:text-red-400" size={24} />
                            </div>
                            <div>
                                <h2 className="text-xl font-heading font-bold text-primary-900 dark:text-white">Bug Reports</h2>
                                <p className="text-sm text-secondary-600 dark:text-slate-400">Issues reported by users</p>
                            </div>
                        </div>
                        {bugReports.length > 0 && (
                            <span className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-full text-sm font-bold">
                                {bugReports.filter(b => b.status === 'open').length} Open
                            </span>
                        )}
                    </div>

                    {loadingBugs ? (
                        <div className="flex justify-center py-12">
                            <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full"></div>
                        </div>
                    ) : bugReports.length === 0 ? (
                        <div className="text-center py-12 bg-secondary-50 dark:bg-slate-700 rounded-xl">
                            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                            <p className="text-secondary-600 dark:text-slate-400 font-medium">No bug reports</p>
                            <p className="text-xs text-secondary-400 dark:text-slate-500 mt-1">All systems running smoothly!</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {bugReports.map((bug) => (
                                <div key={bug.id} className="border border-secondary-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <h3 className="font-bold text-primary-900">{bug.title}</h3>
                                                <span className={`text-xs font-bold px-2 py-1 rounded-full ${getBugStatusColor(bug.status)}`}>
                                                    {bug.status}
                                                </span>
                                                <span className={`text-xs font-bold ${getPriorityColor(bug.priority)}`}>
                                                    {bug.priority} priority
                                                </span>
                                            </div>
                                            <p className="text-secondary-700 text-sm mb-2">{bug.description}</p>
                                            <div className="flex items-center gap-4 text-xs text-secondary-500">
                                                <span>Reported by: <span className="font-semibold text-secondary-700">{bug.userName}</span> ({bug.userRole})</span>
                                                <span>Category: {bug.category}</span>
                                                <span>{new Date(bug.createdAt).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 ml-4">
                                            {bug.status !== 'resolved' && (
                                                <select
                                                    value={bug.status}
                                                    onChange={(e) => handleUpdateBugStatus(bug.id, e.target.value)}
                                                    className="px-3 py-1 text-sm border border-secondary-200 rounded-lg focus:ring-2 focus:ring-primary-500"
                                                >
                                                    <option value="open">Open</option>
                                                    <option value="in-progress">In Progress</option>
                                                    <option value="resolved">Resolved</option>
                                                </select>
                                            )}
                                            <button
                                                onClick={() => handleDeleteBug(bug.id)}
                                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </motion.div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content Area - Circulars */}
                <div className="lg:col-span-2 space-y-6">
                    <Circulars />
                </div>

                {/* Sidebar Area - Upcoming Classes */}
                <div className="space-y-6">
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-secondary-200 dark:border-slate-700 p-6"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-heading font-bold text-primary-900 dark:text-white">Upcoming Classes</h2>
                            <Calendar className="text-primary-500" size={20} />
                        </div>

                        {loadingClasses ? (
                            <div className="flex justify-center py-12">
                                <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full"></div>
                            </div>
                        ) : upcomingClasses.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center space-y-4 bg-secondary-50 dark:bg-slate-700 rounded-xl border border-dashed border-secondary-300 dark:border-slate-600">
                                <div className="w-12 h-12 bg-white dark:bg-slate-600 rounded-full flex items-center justify-center shadow-sm">
                                    <Clock className="text-secondary-400 dark:text-slate-300" size={24} />
                                </div>
                                <div>
                                    <p className="text-secondary-600 dark:text-slate-400 font-medium">No classes scheduled</p>
                                    <p className="text-xs text-secondary-400 dark:text-slate-500 mt-1">Check back later for updates</p>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {upcomingClasses.map((cls) => (
                                    <div key={cls.id} className="p-4 bg-secondary-50 dark:bg-slate-700 rounded-xl hover:bg-primary-50 transition-colors border border-secondary-200 hover:border-primary-300">
                                        <div className="flex items-start gap-3">
                                            <div className="p-2 bg-primary-100 rounded-lg">
                                                <Video className="text-primary-600" size={18} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-bold text-primary-900 text-sm truncate">{cls.title}</h3>
                                                <div className="flex items-center gap-2 mt-1 text-xs text-secondary-600">
                                                    <Calendar size={12} />
                                                    <span>{new Date(cls.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                                                    <Clock size={12} className="ml-2" />
                                                    <span>{cls.time}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                </div>
            </div>

            {/* Bug Report Modal (Students & Teachers only) */}
            <AnimatePresence>
                {showBugModal && user?.role !== 'admin' && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                        onClick={() => setShowBugModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl p-8"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                                        <Bug className="text-red-600 dark:text-red-400" size={24} />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-heading font-bold text-primary-900 dark:text-white">Report a Bug</h2>
                                        <p className="text-sm text-secondary-600 dark:text-slate-400">Help us improve by reporting issues</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowBugModal(false)}
                                    className="p-2 hover:bg-secondary-100 dark:hover:bg-slate-700 rounded-lg dark:text-white transition-colors"
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmitBug} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-secondary-700 dark:text-slate-300 mb-2">Bug Title *</label>
                                    <input
                                        type="text"
                                        required
                                        value={bugForm.title}
                                        onChange={(e) => setBugForm({ ...bugForm, title: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-secondary-200 dark:border-slate-600 focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-secondary-50 dark:bg-slate-700 dark:text-white"
                                        placeholder="Brief description of the issue"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-secondary-700 dark:text-slate-300 mb-2">Description *</label>
                                    <textarea
                                        required
                                        value={bugForm.description}
                                        onChange={(e) => setBugForm({ ...bugForm, description: e.target.value })}
                                        rows={4}
                                        className="w-full px-4 py-3 rounded-xl border border-secondary-200 dark:border-slate-600 focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-secondary-50 dark:bg-slate-700 dark:text-white"
                                        placeholder="Detailed explanation of what went wrong..."
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-secondary-700 dark:text-slate-300 mb-2">Category</label>
                                        <select
                                            value={bugForm.category}
                                            onChange={(e) => setBugForm({ ...bugForm, category: e.target.value })}
                                            className="w-full px-4 py-3 rounded-xl border border-secondary-200 dark:border-slate-600 focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-secondary-50 dark:bg-slate-700 dark:text-white"
                                        >
                                            <option value="general">General</option>
                                            <option value="classes">Classes</option>
                                            <option value="chat">Chat</option>
                                            <option value="payments">Payments</option>
                                            <option value="circulars">Circulars</option>
                                            <option value="ui">UI/Design</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-secondary-700 dark:text-slate-300 mb-2">Priority</label>
                                        <select
                                            value={bugForm.priority}
                                            onChange={(e) => setBugForm({ ...bugForm, priority: e.target.value })}
                                            className="w-full px-4 py-3 rounded-xl border border-secondary-200 dark:border-slate-600 focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-secondary-50 dark:bg-slate-700 dark:text-white"
                                        >
                                            <option value="low">Low</option>
                                            <option value="medium">Medium</option>
                                            <option value="high">High</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowBugModal(false)}
                                        className="flex-1 px-6 py-3 text-secondary-600 hover:bg-secondary-100 rounded-xl transition-colors font-bold"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submitingBug}
                                        className="flex-1 px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-all font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {submitingBug ? 'Submitting...' : 'Submit Report'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
