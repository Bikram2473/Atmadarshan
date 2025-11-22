import { useState, useEffect, useRef } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { Plus, Bell, X, Paperclip, FileText, Download, Edit, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Circulars() {
    const { user } = useAuth();
    const [circulars, setCirculars] = useState([]);
    const [isCreating, setIsCreating] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [newTitle, setNewTitle] = useState('');
    const [newContent, setNewContent] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const fileInputRef = useRef(null);

    useEffect(() => {
        fetchCirculars();
    }, []);

    const fetchCirculars = async () => {
        try {
            const res = await api.get('/api/circulars');
            setCirculars(res.data);
        } catch (error) {
            console.error('Failed to fetch circulars', error);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            const formData = new FormData();
            formData.append('title', newTitle);
            formData.append('content', newContent);
            formData.append('authorName', user.name);
            if (selectedFile) {
                formData.append('file', selectedFile);
            }

            if (editingId) {
                await api.put(`/api/circulars/${editingId}`, formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                });
            } else {
                await api.post('/api/circulars', formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                });
            }

            setNewTitle('');
            setNewContent('');
            setSelectedFile(null);
            setIsCreating(false);
            setEditingId(null);
            fetchCirculars();
        } catch (error) {
            console.error('Failed to save circular', error);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this notice?')) {
            try {
                await api.delete(`/api/circulars/${id}`);
                fetchCirculars();
            } catch (error) {
                console.error('Failed to delete circular', error);
            }
        }
    };

    const handleEdit = (circular) => {
        setNewTitle(circular.title);
        setNewContent(circular.content);
        setEditingId(circular.id);
        setIsCreating(true);
        // Note: We can't set the file input value programmatically for security reasons
        // The user will need to re-upload if they want to change the file
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
        }
    };

    return (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-secondary-200 dark:border-slate-700 overflow-hidden flex flex-col h-full">
            <div className="p-6 border-b border-secondary-100 dark:border-slate-700 flex justify-between items-center bg-secondary-50/50 dark:bg-slate-800/50">
                <h2 className="text-xl font-heading font-bold text-primary-900 dark:text-white flex items-center">
                    <Bell className="mr-3 text-accent-500" size={24} />
                    Circulars & Notices
                </h2>
                {user?.role === 'teacher' && (
                    <button
                        onClick={() => {
                            setIsCreating(!isCreating);
                            if (isCreating) {
                                setEditingId(null);
                                setNewTitle('');
                                setNewContent('');
                                setSelectedFile(null);
                            }
                        }}
                        className="flex items-center px-4 py-2 text-sm font-bold text-white bg-primary-600 rounded-xl hover:bg-primary-700 transition-all shadow-sm hover:shadow-md active:scale-95"
                    >
                        {isCreating ? <X size={18} className="mr-2" /> : <Plus size={18} className="mr-2" />}
                        {isCreating ? 'Cancel' : 'Post Notice'}
                    </button>
                )}
            </div>

            <AnimatePresence>
                {isCreating && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden bg-secondary-50 dark:bg-slate-800/50 border-b border-secondary-100 dark:border-slate-700"
                    >
                        <form onSubmit={handleCreate} className="p-6 space-y-4">
                            <input
                                type="text"
                                placeholder="Notice Title (Optional if file attached)"
                                required={!selectedFile}
                                value={newTitle}
                                onChange={(e) => setNewTitle(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-secondary-200 dark:border-slate-600 focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-slate-700 dark:text-white transition-all"
                            />
                            <textarea
                                placeholder="Notice Content (Optional if file attached)"
                                required={!selectedFile}
                                value={newContent}
                                onChange={(e) => setNewContent(e.target.value)}
                                rows={3}
                                className="w-full px-4 py-3 rounded-xl border border-secondary-200 dark:border-slate-600 focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-slate-700 dark:text-white transition-all resize-none"
                            />

                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="flex items-center px-3 py-2 text-sm font-medium text-secondary-600 dark:text-slate-300 bg-white dark:bg-slate-700 border border-secondary-200 dark:border-slate-600 rounded-lg hover:bg-secondary-50 dark:hover:bg-slate-600 transition-colors"
                                    >
                                        <Paperclip size={16} className="mr-2" />
                                        {selectedFile ? 'Change File' : 'Attach File'}
                                    </button>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleFileChange}
                                        className="hidden"
                                    />
                                    {selectedFile && (
                                        <span className="text-sm text-primary-600 truncate max-w-[200px]">
                                            {selectedFile.name}
                                        </span>
                                    )}
                                </div>

                                <button
                                    type="submit"
                                    className="px-6 py-2.5 text-sm font-bold text-white bg-primary-600 rounded-xl hover:bg-primary-700 shadow-sm hover:shadow-md transition-all"
                                >
                                    {editingId ? 'Update Notice' : 'Post Notice'}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
                {circulars.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-center p-6">
                        <div className="w-16 h-16 bg-secondary-100 dark:bg-slate-700 rounded-full flex items-center justify-center mb-4">
                            <Bell className="text-secondary-400 dark:text-slate-400" size={32} />
                        </div>
                        <p className="text-secondary-600 dark:text-slate-300 font-medium">No notices posted yet</p>
                        <p className="text-sm text-secondary-400 dark:text-slate-500 mt-1">Important updates will appear here</p>
                    </div>
                ) : (
                    <div className="space-y-3 p-4">
                        {circulars.map((circular, index) => (
                            <motion.div
                                key={circular.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="p-5 bg-white dark:bg-slate-700/50 rounded-xl border border-secondary-100 dark:border-slate-600 hover:border-primary-200 dark:hover:border-primary-500 hover:shadow-md transition-all group"
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex-1">
                                        {circular.title && (
                                            <h3 className="font-bold text-primary-900 dark:text-white text-lg group-hover:text-primary-700 dark:group-hover:text-primary-400 transition-colors">
                                                {circular.title}
                                            </h3>
                                        )}
                                    </div>
                                    <div className="flex items-center space-x-3">
                                        <span className="text-xs font-medium px-2.5 py-1 bg-secondary-100 text-secondary-600 rounded-full">
                                            {new Date(circular.createdAt).toLocaleDateString()}
                                        </span>
                                        {user?.role === 'teacher' && (
                                            <div className="flex space-x-1">
                                                <button
                                                    onClick={() => handleEdit(circular)}
                                                    className="p-1.5 text-secondary-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                                                    title="Edit"
                                                >
                                                    <Edit size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(circular.id)}
                                                    className="p-1.5 text-secondary-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                {circular.content && (
                                    <p className="text-secondary-600 dark:text-slate-300 text-sm whitespace-pre-wrap leading-relaxed mb-3">
                                        {circular.content}
                                    </p>
                                )}

                                {circular.fileUrl && (
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        <a
                                            href={`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}${circular.fileUrl}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center px-3 py-2 text-sm font-medium text-primary-700 dark:text-primary-300 bg-primary-50 dark:bg-primary-900/30 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-900/50 transition-colors"
                                        >
                                            <FileText size={16} className="mr-2" />
                                            View {circular.fileName || 'File'}
                                        </a>
                                        <a
                                            href={`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}${circular.fileUrl}`}
                                            download={circular.fileName || 'attachment'}
                                            className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors shadow-sm"
                                        >
                                            <Download size={16} className="mr-2" />
                                            Download
                                        </a>
                                    </div>
                                )}

                                <div className="mt-4 flex items-center text-xs text-secondary-400 dark:text-slate-500 border-t border-secondary-50 dark:border-slate-600 pt-3">
                                    <span className="w-6 h-6 rounded-full bg-primary-50 dark:bg-primary-900/50 text-primary-600 dark:text-primary-400 flex items-center justify-center font-bold mr-2">
                                        {circular.authorName?.[0]?.toUpperCase()}
                                    </span>
                                    Posted by {circular.authorName}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
