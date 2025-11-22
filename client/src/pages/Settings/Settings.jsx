import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

import { User, Bell, Shield, QrCode, Upload, CheckCircle, AlertCircle, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Settings() {
    const { user, updateUser } = useAuth();

    const [notifications, setNotifications] = useState(true);
    const [qrCodeFile, setQrCodeFile] = useState(null);
    const [qrCodePreview, setQrCodePreview] = useState(null);
    const [currentQR, setCurrentQR] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    // Profile Image State
    const [profileImageFile, setProfileImageFile] = useState(null);
    const [profileImagePreview, setProfileImagePreview] = useState(null);
    const [uploadingProfile, setUploadingProfile] = useState(false);

    useEffect(() => {
        if (user?.role === 'teacher') {
            fetchCurrentQR();
        }
    }, [user]);

    const fetchCurrentQR = async () => {
        try {
            const response = await api.get('/api/settings');
            if (response.data.qrCodeUrl) {
                setCurrentQR(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}${response.data.qrCodeUrl}`);
            } else {
                setCurrentQR(null);
            }
        } catch (error) {
            console.error('Error fetching current QR:', error);
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                setMessage({ type: 'error', text: 'Please upload an image file' });
                return;
            }
            if (file.size > 5 * 1024 * 1024) {
                setMessage({ type: 'error', text: 'File size should be less than 5MB' });
                return;
            }
            setQrCodeFile(file);
            setMessage({ type: '', text: '' });

            const reader = new FileReader();
            reader.onloadend = () => {
                setQrCodePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleUpload = async () => {
        if (!qrCodeFile) {
            setMessage({ type: 'error', text: 'Please select a file first' });
            return;
        }

        setUploading(true);
        setMessage({ type: '', text: '' });

        const formData = new FormData();
        formData.append('qrCode', qrCodeFile);

        try {
            const response = await api.post('/api/settings/qr-code', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            setMessage({ type: 'success', text: 'QR code uploaded successfully!' });
            setCurrentQR(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}${response.data.qrCodeUrl}`);
            setQrCodeFile(null);
            setQrCodePreview(null);
        } catch (error) {
            console.error('Upload error:', error);
            setMessage({ type: 'error', text: 'Failed to upload QR code. Please try again.' });
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete the current QR code?')) {
            return;
        }

        setDeleting(true);
        setMessage({ type: '', text: '' });

        try {
            await api.delete('/api/settings/qr-code');
            setMessage({ type: 'success', text: 'QR code deleted successfully!' });
            setCurrentQR(null);
        } catch (error) {
            console.error('Delete error:', error);
            setMessage({ type: 'error', text: 'Failed to delete QR code. Please try again.' });
        } finally {
            setDeleting(false);
        }
    };

    const handleProfileImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                setMessage({ type: 'error', text: 'Please upload an image file' });
                return;
            }
            if (file.size > 5 * 1024 * 1024) {
                setMessage({ type: 'error', text: 'File size should be less than 5MB' });
                return;
            }
            setProfileImageFile(file);

            const reader = new FileReader();
            reader.onloadend = () => {
                setProfileImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleProfileImageUpload = async () => {
        if (!profileImageFile) return;

        setUploadingProfile(true);
        const formData = new FormData();
        formData.append('profileImage', profileImageFile);

        try {
            const response = await api.post('/api/auth/profile-image', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'user-id': user.id
                },
            });

            setMessage({ type: 'success', text: 'Profile photo updated!' });
            setProfileImageFile(null);
            setProfileImagePreview(null);

            // Update auth context with new user data
            if (response.data.user) {
                updateUser(response.data.user);
            }
        } catch (error) {
            console.error('Profile upload error:', error);
            setMessage({ type: 'error', text: 'Failed to update profile photo.' });
        } finally {
            setUploadingProfile(false);
        }
    };

    const handleProfileImageRemove = async () => {
        if (!confirm('Are you sure you want to remove your profile photo?')) {
            return;
        }

        setUploadingProfile(true);
        setMessage({ type: '', text: '' });

        try {
            const response = await api.delete('/api/auth/profile-image', {
                headers: {
                    'user-id': user.id
                }
            });

            setMessage({ type: 'success', text: 'Profile photo removed!' });
            setProfileImageFile(null);
            setProfileImagePreview(null);

            // Update auth context with new user data
            if (response.data.user) {
                updateUser(response.data.user);
            }
        } catch (error) {
            console.error('Profile remove error:', error);
            setMessage({ type: 'error', text: 'Failed to remove profile photo.' });
        } finally {
            setUploadingProfile(false);
        }
    };


    return (
        <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-8">
            <div className="mb-2">
                <h1 className="text-3xl font-heading font-bold text-primary-900 dark:text-white">Settings</h1>
                <p className="text-secondary-500 dark:text-slate-400 mt-1">Manage your profile and application preferences</p>
            </div>

            <div className="space-y-6">
                {/* Profile Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-secondary-200 dark:border-slate-700 overflow-hidden"
                >
                    <div className="p-6 border-b border-secondary-200 dark:border-slate-700 bg-secondary-50/50 dark:bg-slate-800/50 flex items-center gap-4">
                        <div className="p-3 bg-secondary-100 dark:bg-slate-700 text-primary-600 dark:text-primary-400 rounded-xl">
                            <User size={24} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-primary-900 dark:text-white">Profile Information</h2>
                            <p className="text-sm text-secondary-500 dark:text-slate-400">Update your photo and personal details</p>
                        </div>
                    </div>

                    <div className="p-8">
                        <div className="flex flex-col md:flex-row gap-8 items-start">
                            <div className="flex flex-col items-center space-y-4 w-full md:w-auto">
                                <div className="relative group">
                                    <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white dark:border-slate-700 shadow-lg bg-secondary-100 dark:bg-slate-900 ring-1 ring-secondary-200 dark:ring-slate-600">
                                        <img
                                            src={profileImagePreview || (user?.profileImage ? `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}${user.profileImage}` : `https://ui-avatars.com/api/?name=${user?.name}&background=0f172a&color=fff&size=128`)}
                                            alt="Profile"
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <label className="absolute bottom-1 right-1 bg-primary-600 dark:bg-primary-700 text-white p-2.5 rounded-full cursor-pointer hover:bg-primary-500 dark:hover:bg-primary-600 shadow-md transition-all transform hover:scale-110 border-2 border-white dark:border-slate-800">
                                        <Upload size={16} />
                                        <input type="file" accept="image/*" onChange={handleProfileImageChange} className="hidden" />
                                    </label>
                                </div>

                                <div className="flex flex-col gap-2 w-full">
                                    {profileImageFile && (
                                        <button
                                            onClick={handleProfileImageUpload}
                                            disabled={uploadingProfile}
                                            className="text-xs bg-primary-600 dark:bg-primary-700 text-white px-4 py-2 rounded-lg font-bold hover:bg-primary-500 dark:hover:bg-primary-600 transition-colors shadow-sm disabled:opacity-50 w-full"
                                        >
                                            {uploadingProfile ? 'Saving...' : 'Save Photo'}
                                        </button>
                                    )}
                                    {!profileImageFile && user?.profileImage && (
                                        <button
                                            onClick={handleProfileImageRemove}
                                            disabled={uploadingProfile}
                                            className="text-xs bg-white dark:bg-slate-800 text-red-500 dark:text-red-400 border border-red-200 dark:border-red-900/30 px-4 py-2 rounded-lg font-bold hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors shadow-sm disabled:opacity-50 w-full"
                                        >
                                            {uploadingProfile ? 'Removing...' : 'Remove Photo'}
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="flex-1 grid grid-cols-1 gap-6 w-full">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-xs font-bold text-secondary-500 dark:text-slate-500 uppercase tracking-wider mb-2">Full Name</label>
                                        <input
                                            type="text"
                                            value={user?.name}
                                            disabled
                                            className="w-full px-4 py-3 rounded-xl border border-secondary-200 dark:border-slate-700 bg-secondary-50 dark:bg-slate-900 text-secondary-500 dark:text-slate-400 font-bold cursor-not-allowed"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-secondary-500 dark:text-slate-500 uppercase tracking-wider mb-2">Role</label>
                                        <div className="w-full px-4 py-3 rounded-xl border border-secondary-200 dark:border-slate-700 bg-secondary-50 dark:bg-slate-900 text-secondary-500 dark:text-slate-400 font-bold capitalize flex items-center gap-2 cursor-not-allowed">
                                            <span className={`w-2 h-2 rounded-full ${user?.role === 'admin' ? 'bg-purple-500' : user?.role === 'teacher' ? 'bg-blue-500' : 'bg-green-500'}`}></span>
                                            {user?.role}
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-secondary-500 dark:text-slate-500 uppercase tracking-wider mb-2">Email Address</label>
                                    <input
                                        type="email"
                                        value={user?.email}
                                        disabled
                                        className="w-full px-4 py-3 rounded-xl border border-secondary-200 dark:border-slate-700 bg-secondary-50 dark:bg-slate-900 text-secondary-500 dark:text-slate-400 font-bold cursor-not-allowed"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Payment QR Code Section - Teachers Only */}
                {user?.role === 'teacher' && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 }}
                        className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-secondary-200 dark:border-slate-700 overflow-hidden"
                    >
                        <div className="p-6 border-b border-secondary-200 dark:border-slate-700 bg-secondary-50/50 dark:bg-slate-800/50 flex items-center gap-4">
                            <div className="p-3 bg-secondary-100 dark:bg-slate-700 text-primary-600 dark:text-primary-400 rounded-xl">
                                <QrCode size={24} />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-primary-900 dark:text-white">Payment Configuration</h2>
                                <p className="text-sm text-secondary-500 dark:text-slate-400">Manage your UPI payment QR code</p>
                            </div>
                        </div>

                        <div className="p-8">
                            {/* Current QR Code */}
                            {currentQR && (
                                <div className="mb-8 pb-8 border-b border-secondary-200 dark:border-slate-700">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="font-bold text-primary-900 dark:text-white text-sm uppercase tracking-wide">Current Active QR Code</h3>
                                        <button
                                            onClick={handleDelete}
                                            disabled={deleting}
                                            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/10 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/20 border border-red-200 dark:border-red-900/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <Trash2 size={14} />
                                            {deleting ? 'Deleting...' : 'Remove QR Code'}
                                        </button>
                                    </div>
                                    <div className="bg-secondary-50 dark:bg-slate-900 p-6 rounded-2xl border border-secondary-200 dark:border-slate-700 w-fit mx-auto md:mx-0">
                                        <img src={currentQR} alt="Current QR Code" className="w-48 h-48 object-contain bg-white rounded-lg p-2 shadow-sm" />
                                    </div>
                                </div>
                            )}

                            {/* Upload Section */}
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-bold text-primary-900 dark:text-white mb-3">
                                        {currentQR ? 'Replace QR Code' : 'Upload New QR Code'}
                                    </label>
                                    <label className="block group">
                                        <div className="border-2 border-dashed border-secondary-300 dark:border-slate-600 rounded-2xl p-8 text-center cursor-pointer group-hover:border-primary-500 dark:group-hover:border-primary-500 group-hover:bg-primary-50 dark:group-hover:bg-primary-900/10 transition-all">
                                            <div className="w-12 h-12 bg-secondary-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-primary-100 dark:group-hover:bg-primary-900/20 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                                                <Upload size={24} className="text-secondary-400 dark:text-slate-400 group-hover:text-primary-600 dark:group-hover:text-primary-400" />
                                            </div>
                                            <p className="text-primary-900 dark:text-white font-bold mb-1">
                                                {qrCodeFile ? qrCodeFile.name : 'Click to upload or drag and drop'}
                                            </p>
                                            <p className="text-xs text-secondary-500 dark:text-slate-500">
                                                PNG, JPG up to 5MB
                                            </p>
                                        </div>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleFileChange}
                                            className="hidden"
                                        />
                                    </label>
                                </div>

                                {/* Preview */}
                                {qrCodePreview && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        className="bg-secondary-50 dark:bg-slate-900 p-4 rounded-xl border border-secondary-200 dark:border-slate-700 flex items-center gap-4"
                                    >
                                        <img src={qrCodePreview} alt="Preview" className="w-16 h-16 object-contain bg-white rounded-lg border border-secondary-200 dark:border-slate-600 p-1" />
                                        <div>
                                            <p className="font-bold text-primary-900 dark:text-white text-sm">Ready to upload</p>
                                            <p className="text-xs text-secondary-500 dark:text-slate-400">Click the button below to save</p>
                                        </div>
                                    </motion.div>
                                )}

                                {/* Message */}
                                {message.text && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className={`p-4 rounded-xl flex items-start gap-3 text-sm ${message.type === 'success'
                                            ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-900/30'
                                            : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/30'
                                            }`}
                                    >
                                        {message.type === 'success' ? (
                                            <CheckCircle size={18} className="mt-0.5 flex-shrink-0" />
                                        ) : (
                                            <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />
                                        )}
                                        <span className="font-bold">{message.text}</span>
                                    </motion.div>
                                )}

                                {/* Upload Button */}
                                <button
                                    onClick={handleUpload}
                                    disabled={!qrCodeFile || uploading}
                                    className="w-full py-3.5 px-6 bg-primary-600 dark:bg-primary-700 text-white font-bold rounded-xl hover:bg-primary-700 dark:hover:bg-primary-600 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
                                >
                                    <Upload size={18} className="mr-2" />
                                    {uploading ? 'Uploading...' : 'Save QR Code'}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Notifications Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-secondary-200 dark:border-slate-700 overflow-hidden"
                >
                    <div className="p-6 border-b border-secondary-200 dark:border-slate-700 bg-secondary-50/50 dark:bg-slate-800/50 flex items-center gap-4">
                        <div className="p-3 bg-secondary-100 dark:bg-slate-700 text-primary-600 dark:text-primary-400 rounded-xl">
                            <Bell size={24} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-primary-900 dark:text-white">Notifications</h2>
                            <p className="text-sm text-secondary-500 dark:text-slate-400">Manage your alert preferences</p>
                        </div>
                    </div>
                    <div className="p-8">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-bold text-primary-900 dark:text-white">Push Notifications</p>
                                <p className="text-sm text-secondary-500 dark:text-slate-400 mt-1">Receive updates about classes, circulars, and messages</p>
                            </div>
                            <button
                                onClick={() => setNotifications(!notifications)}
                                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${notifications ? 'bg-primary-600' : 'bg-secondary-200 dark:bg-slate-600'
                                    }`}
                            >
                                <span
                                    className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform shadow-sm ${notifications ? 'translate-x-6' : 'translate-x-1'
                                        }`}
                                />
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
