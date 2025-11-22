import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Trash2, UserCheck, GraduationCap, Shield, AlertCircle } from 'lucide-react';

export default function AdminDashboard() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [deletingUserId, setDeletingUserId] = useState(null);

    // Redirect if not admin
    useEffect(() => {
        if (user?.role !== 'admin') {
            navigate('/');
        }
    }, [user, navigate]);

    // Fetch all users
    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const response = await api.get('/api/admin/users', {
                headers: {
                    'user-id': user?.id
                }
            });

            // api.get throws on error, so we don't need response.ok check
            setUsers(response.data.users);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteUser = async (userId, userName) => {
        if (!window.confirm(`Are you sure you want to delete ${userName}? This action cannot be undone.`)) {
            return;
        }

        setDeletingUserId(userId);
        try {
            await api.delete(`/api/admin/users/${userId}`, {
                headers: {
                    'user-id': user?.id
                }
            });

            // Update local state
            setUsers(users.filter(u => u.id !== userId));
        } catch (err) {
            setError(err.message);
        } finally {
            setDeletingUserId(null);
        }
    };

    const getRoleIcon = (role) => {
        switch (role) {
            case 'admin':
                return <Shield className="w-5 h-5" />;
            case 'teacher':
                return <UserCheck className="w-5 h-5" />;
            case 'student':
                return <GraduationCap className="w-5 h-5" />;
            default:
                return <Users className="w-5 h-5" />;
        }
    };

    const getRoleBadgeColor = (role) => {
        switch (role) {
            case 'admin':
                return 'bg-purple-100 text-purple-700 border-purple-200';
            case 'teacher':
                return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'student':
                return 'bg-green-100 text-green-700 border-green-200';
            default:
                return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    if (loading) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-700">
                <div>
                    <h1 className="text-2xl md:text-3xl font-heading font-bold text-white flex items-center gap-3">
                        <div className="p-2 bg-slate-700 rounded-lg text-primary-400">
                            <Shield size={28} />
                        </div>
                        Admin Dashboard
                    </h1>
                    <p className="text-slate-400 mt-2 ml-1">
                        Manage users, roles, and system settings
                    </p>
                </div>
                <div className="flex gap-3">
                    <div className="px-4 py-2 bg-slate-900 rounded-xl border border-slate-700 flex flex-col items-end">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Users</span>
                        <span className="text-xl font-heading font-bold text-white">{users.length}</span>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-700 flex items-center justify-between group hover:border-primary-500/30 transition-all">
                    <div>
                        <p className="text-sm font-bold text-slate-500 uppercase tracking-wide">Administrators</p>
                        <p className="text-3xl font-heading font-bold text-white mt-2 group-hover:text-primary-400 transition-colors">
                            {users.filter(u => u.role === 'admin').length}
                        </p>
                    </div>
                    <div className="p-4 bg-purple-900/20 text-purple-400 rounded-xl group-hover:bg-purple-900/30 transition-colors">
                        <Shield size={24} />
                    </div>
                </div>

                <div className="bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-700 flex items-center justify-between group hover:border-primary-500/30 transition-all">
                    <div>
                        <p className="text-sm font-bold text-slate-500 uppercase tracking-wide">Teachers</p>
                        <p className="text-3xl font-heading font-bold text-white mt-2 group-hover:text-primary-400 transition-colors">
                            {users.filter(u => u.role === 'teacher').length}
                        </p>
                    </div>
                    <div className="p-4 bg-blue-900/20 text-blue-400 rounded-xl group-hover:bg-blue-900/30 transition-colors">
                        <UserCheck size={24} />
                    </div>
                </div>

                <div className="bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-700 flex items-center justify-between group hover:border-primary-500/30 transition-all">
                    <div>
                        <p className="text-sm font-bold text-slate-500 uppercase tracking-wide">Students</p>
                        <p className="text-3xl font-heading font-bold text-white mt-2 group-hover:text-primary-400 transition-colors">
                            {users.filter(u => u.role === 'student').length}
                        </p>
                    </div>
                    <div className="p-4 bg-green-900/20 text-green-400 rounded-xl group-hover:bg-green-900/30 transition-colors">
                        <GraduationCap size={24} />
                    </div>
                </div>
            </div>

            {error && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-red-900/20 border border-red-900/30 rounded-xl flex items-start gap-3"
                >
                    <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                    <div>
                        <h3 className="text-sm font-bold text-red-400">Error</h3>
                        <p className="text-sm text-red-300 mt-1">{error}</p>
                    </div>
                </motion.div>
            )}

            {/* Users Table */}
            <div className="bg-slate-800 rounded-2xl shadow-sm border border-slate-700 overflow-hidden">
                <div className="p-6 border-b border-slate-700 flex justify-between items-center bg-slate-800/50">
                    <h2 className="text-xl font-heading font-bold text-white flex items-center gap-2">
                        <Users className="text-primary-400" size={24} />
                        Registered Users
                    </h2>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-900/50 border-b border-slate-700">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">User</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Email</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Role</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Joined</th>
                                <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/50">
                            <AnimatePresence>
                                {users.map((userData) => (
                                    <motion.tr
                                        key={userData.id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="hover:bg-slate-700/30 transition-colors group"
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-primary-400 font-bold text-sm shadow-sm border border-slate-600 group-hover:bg-slate-600 transition-colors">
                                                    {userData.name[0].toUpperCase()}
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-bold text-white">{userData.name}</div>
                                                    {userData.id === user?.id && (
                                                        <span className="text-[10px] font-bold text-primary-400 bg-primary-900/20 px-2 py-0.5 rounded-full border border-primary-900/30">
                                                            YOU
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-slate-400 font-medium">{userData.email}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold border shadow-sm ${userData.role === 'admin' ? 'bg-purple-900/20 text-purple-400 border-purple-900/30' :
                                                    userData.role === 'teacher' ? 'bg-blue-900/20 text-blue-400 border-blue-900/30' :
                                                        'bg-green-900/20 text-green-400 border-green-900/30'
                                                }`}>
                                                {getRoleIcon(userData.role)}
                                                <span className="ml-2 capitalize">{userData.role}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-slate-500">
                                                {new Date(userData.createdAt).toLocaleDateString('en-US', {
                                                    year: 'numeric',
                                                    month: 'short',
                                                    day: 'numeric'
                                                })}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            {userData.id !== user?.id ? (
                                                <button
                                                    onClick={() => handleDeleteUser(userData.id, userData.name)}
                                                    disabled={deletingUserId === userData.id}
                                                    className="inline-flex items-center px-3 py-1.5 border border-red-900/30 rounded-lg text-sm font-bold text-red-400 bg-red-900/10 hover:bg-red-900/20 hover:border-red-900/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                                                >
                                                    {deletingUserId === userData.id ? (
                                                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-red-400 border-t-transparent" />
                                                    ) : (
                                                        <>
                                                            <Trash2 className="w-4 h-4 mr-1.5" />
                                                            Delete
                                                        </>
                                                    )}
                                                </button>
                                            ) : (
                                                <span className="text-xs font-bold text-slate-600 italic px-2">
                                                    Current User
                                                </span>
                                            )}
                                        </td>
                                    </motion.tr>
                                ))}
                            </AnimatePresence>
                        </tbody>
                    </table>
                </div>

                {users.length === 0 && !loading && (
                    <div className="p-16 text-center">
                        <div className="w-20 h-20 bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Users className="w-10 h-10 text-slate-600" />
                        </div>
                        <h3 className="text-lg font-bold text-white mb-1">No users found</h3>
                        <p className="text-slate-500">There are no registered users in the system yet.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
