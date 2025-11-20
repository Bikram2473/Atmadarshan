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
        <div className="p-6 md:p-8">
            <div className="mb-8">
                <div className="flex items-center mb-2">
                    <Shield className="w-8 h-8 text-primary-600 mr-3" />
                    <h1 className="text-3xl font-heading font-bold text-gray-900">User Management</h1>
                </div>
                <p className="text-secondary-600 ml-11">
                    Manage all registered users in the application
                </p>
            </div>

            {error && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start"
                >
                    <AlertCircle className="w-5 h-5 text-red-600 mr-3 mt-0.5 flex-shrink-0" />
                    <div>
                        <h3 className="text-sm font-semibold text-red-800">Error</h3>
                        <p className="text-sm text-red-600 mt-1">{error}</p>
                    </div>
                </motion.div>
            )}

            <div className="bg-white rounded-2xl shadow-sm border border-secondary-200 overflow-hidden">
                <div className="p-6 bg-gradient-to-r from-primary-50 to-primary-100 border-b border-primary-200">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <Users className="w-6 h-6 text-primary-700 mr-3" />
                            <h2 className="text-xl font-heading font-bold text-primary-900">
                                Registered Users
                            </h2>
                        </div>
                        <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-primary-200">
                            <span className="text-sm font-semibold text-primary-700">
                                Total: {users.length}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-secondary-50 border-b border-secondary-200">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-secondary-700 uppercase tracking-wider">
                                    User
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-secondary-700 uppercase tracking-wider">
                                    Email
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-secondary-700 uppercase tracking-wider">
                                    Role
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-secondary-700 uppercase tracking-wider">
                                    Joined
                                </th>
                                <th className="px-6 py-4 text-right text-xs font-bold text-secondary-700 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-secondary-100">
                            <AnimatePresence>
                                {users.map((userData) => (
                                    <motion.tr
                                        key={userData.id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="hover:bg-secondary-50 transition-colors"
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center text-primary-700 font-bold shadow-sm border border-primary-100">
                                                    {userData.name[0].toUpperCase()}
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-semibold text-gray-900">
                                                        {userData.name}
                                                    </div>
                                                    {userData.id === user?.id && (
                                                        <span className="text-xs text-primary-600 font-medium">
                                                            (You)
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-secondary-700">
                                                {userData.email}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold border ${getRoleBadgeColor(userData.role)}`}>
                                                {getRoleIcon(userData.role)}
                                                <span className="ml-1.5 capitalize">{userData.role}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-secondary-600">
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
                                                    className="inline-flex items-center px-3 py-2 border border-red-200 rounded-lg text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    {deletingUserId === userData.id ? (
                                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600" />
                                                    ) : (
                                                        <>
                                                            <Trash2 className="w-4 h-4 mr-1.5" />
                                                            Delete
                                                        </>
                                                    )}
                                                </button>
                                            ) : (
                                                <span className="text-sm text-secondary-400 font-medium">
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
                    <div className="p-12 text-center">
                        <Users className="w-16 h-16 text-secondary-300 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-secondary-700 mb-2">No users found</h3>
                        <p className="text-secondary-500">There are no registered users yet.</p>
                    </div>
                )}
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                <div className="bg-white rounded-xl shadow-sm border border-secondary-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-secondary-600">Admins</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">
                                {users.filter(u => u.role === 'admin').length}
                            </p>
                        </div>
                        <div className="bg-purple-100 p-3 rounded-xl">
                            <Shield className="w-6 h-6 text-purple-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-secondary-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-secondary-600">Teachers</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">
                                {users.filter(u => u.role === 'teacher').length}
                            </p>
                        </div>
                        <div className="bg-blue-100 p-3 rounded-xl">
                            <UserCheck className="w-6 h-6 text-blue-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-secondary-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-secondary-600">Students</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">
                                {users.filter(u => u.role === 'student').length}
                            </p>
                        </div>
                        <div className="bg-green-100 p-3 rounded-xl">
                            <GraduationCap className="w-6 h-6 text-green-600" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
