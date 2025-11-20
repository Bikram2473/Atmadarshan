import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

import { User, Bell, Shield, QrCode, Upload, CheckCircle, AlertCircle, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Settings() {
    const { user } = useAuth();

    const [notifications, setNotifications] = useState(true);
    const [qrCodeFile, setQrCodeFile] = useState(null);
    const [qrCodePreview, setQrCodePreview] = useState(null);
    const [currentQR, setCurrentQR] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

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

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-8">
            <h1 className="text-3xl font-heading font-bold text-primary-900">Settings</h1>

            <div className="space-y-6">
                {/* Profile Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white p-8 rounded-2xl shadow-sm border border-secondary-200"
                >
                    <div className="flex items-center mb-8 pb-4 border-b border-secondary-100">
                        <div className="p-3 bg-primary-50 rounded-xl text-primary-600 mr-4">
                            <User size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-primary-900">Profile Settings</h2>
                            <p className="text-sm text-secondary-500">Manage your personal information</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <label className="block text-sm font-bold text-secondary-700 mb-2">Full Name</label>
                            <input
                                type="text"
                                value={user?.name}
                                disabled
                                className="w-full px-4 py-3 rounded-xl border border-secondary-200 bg-secondary-50 text-secondary-500 font-medium"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-secondary-700 mb-2">Email Address</label>
                            <input
                                type="email"
                                value={user?.email}
                                disabled
                                className="w-full px-4 py-3 rounded-xl border border-secondary-200 bg-secondary-50 text-secondary-500 font-medium"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-secondary-700 mb-2">Role</label>
                            <input
                                type="text"
                                value={user?.role}
                                disabled
                                className="w-full px-4 py-3 rounded-xl border border-secondary-200 bg-secondary-50 text-secondary-500 font-medium capitalize"
                            />
                        </div>
                    </div>
                </motion.div>

                {/* Payment QR Code Section - Teachers Only */}
                {user?.role === 'teacher' && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 }}
                        className="bg-white p-8 rounded-2xl shadow-sm border border-secondary-200"
                    >
                        <div className="flex items-center mb-8 pb-4 border-b border-secondary-100">
                            <div className="p-3 bg-primary-50 rounded-xl text-primary-600 mr-4">
                                <QrCode size={24} />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-primary-900">Payment QR Code</h2>
                                <p className="text-sm text-secondary-500">Manage your UPI payment QR code</p>
                            </div>
                        </div>

                        {/* Current QR Code */}
                        {currentQR && (
                            <div className="mb-6">
                                <div className="flex justify-between items-center mb-3">
                                    <h3 className="font-semibold text-secondary-700 text-sm">Current QR Code</h3>
                                    <button
                                        onClick={handleDelete}
                                        disabled={deleting}
                                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <Trash2 size={14} />
                                        {deleting ? 'Deleting...' : 'Delete'}
                                    </button>
                                </div>
                                <div className="bg-secondary-50 p-4 rounded-xl border border-secondary-200 w-fit">
                                    <img src={currentQR} alt="Current QR Code" className="w-40 h-40 object-contain" />
                                </div>
                            </div>
                        )}

                        {/* Upload Section */}
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-secondary-700 mb-3">
                                    Upload New QR Code
                                </label>
                                <label className="block">
                                    <div className="border-2 border-dashed border-secondary-300 rounded-xl p-6 text-center cursor-pointer hover:border-primary-500 transition-colors">
                                        <Upload size={32} className="mx-auto text-secondary-400 mb-3" />
                                        <p className="text-secondary-600 font-semibold mb-1 text-sm">
                                            {qrCodeFile ? qrCodeFile.name : 'Click to upload'}
                                        </p>
                                        <p className="text-xs text-secondary-500">
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
                                <div className="bg-secondary-50 p-4 rounded-xl border border-secondary-200">
                                    <h3 className="font-semibold text-secondary-700 mb-3 text-sm">Preview</h3>
                                    <img src={qrCodePreview} alt="QR Code Preview" className="w-40 h-40 object-contain" />
                                </div>
                            )}

                            {/* Message */}
                            {message.text && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`p-3 rounded-xl flex items-center text-sm ${message.type === 'success'
                                        ? 'bg-green-50 text-green-800 border border-green-200'
                                        : 'bg-red-50 text-red-800 border border-red-200'
                                        }`}
                                >
                                    {message.type === 'success' ? (
                                        <CheckCircle size={16} className="mr-2" />
                                    ) : (
                                        <AlertCircle size={16} className="mr-2" />
                                    )}
                                    <span className="font-semibold">{message.text}</span>
                                </motion.div>
                            )}

                            {/* Upload Button */}
                            <button
                                onClick={handleUpload}
                                disabled={!qrCodeFile || uploading}
                                className="w-full py-3 px-6 bg-gradient-to-r from-primary-600 to-primary-700 text-white font-bold rounded-xl hover:from-primary-700 hover:to-primary-800 transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
                            >
                                <Upload size={18} className="mr-2" />
                                {uploading ? 'Uploading...' : 'Upload QR Code'}
                            </button>
                        </div>
                    </motion.div>
                )}

                {/* Notifications Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white p-8 rounded-2xl shadow-sm border border-secondary-200"
                >
                    <div className="flex items-center mb-8 pb-4 border-b border-secondary-100">
                        <div className="p-3 bg-primary-50 rounded-xl text-primary-600 mr-4">
                            <Bell size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-primary-900">Notifications</h2>
                            <p className="text-sm text-secondary-500">Manage your alert preferences</p>
                        </div>
                    </div>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-bold text-primary-900">Push Notifications</p>
                            <p className="text-sm text-secondary-500">Receive updates about classes and circulars</p>
                        </div>
                        <button
                            onClick={() => setNotifications(!notifications)}
                            className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${notifications ? 'bg-primary-600' : 'bg-secondary-200'
                                }`}
                        >
                            <span
                                className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform shadow-sm ${notifications ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                            />
                        </button>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
