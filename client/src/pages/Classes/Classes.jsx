import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Video, Calendar, Clock, Users, Plus, Link as LinkIcon, Trash2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../api/axios';

export default function Classes() {
    const { user } = useAuth();
    const [classes, setClasses] = useState([]);
    const [students, setStudents] = useState([]);
    const [newClass, setNewClass] = useState({
        title: '',
        date: '',
        time: '',
        link: '',
        taggedStudents: []
    });
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);

    // Autocomplete states
    const [searchTerm, setSearchTerm] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const autocompleteRef = useRef(null);

    // Fetch classes from API with userId for filtering
    useEffect(() => {
        const fetchClasses = async () => {
            if (!user) return;
            try {
                const response = await api.get(`/api/classes?userId=${user.id}`);
                setClasses(response.data);
            } catch (error) {
                console.error('Error fetching classes:', error);
                setClasses([]); // Set empty array on error
            } finally {
                setLoading(false);
            }
        };
        fetchClasses();
    }, [user]);

    // Fetch students for autocomplete (only for teachers)
    useEffect(() => {
        if (user && user.role === 'teacher') {
            const fetchStudents = async () => {
                try {
                    console.log('Fetching students for autocomplete...');
                    const response = await api.get('/api/classes/students');
                    console.log('Students received:', response.data);
                    setStudents(response.data);
                } catch (error) {
                    console.error('Error fetching students:', error);
                    setStudents([]); // Set empty array on error
                }
            };
            fetchStudents();
        }
    }, [user]);

    // Close autocomplete when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (autocompleteRef.current && !autocompleteRef.current.contains(event.target)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleCreateClass = async (e) => {
        e.preventDefault();
        try {
            const response = await api.post('/api/classes', {
                title: newClass.title,
                link: newClass.link,
                date: newClass.date,
                time: newClass.time,
                students: newClass.taggedStudents.map(s => s.email),
                teacherId: user.id,
                teacherName: user.name
            });
            setClasses([...classes, response.data]);
            setNewClass({ title: '', date: '', time: '', link: '', taggedStudents: [] });
            setSearchTerm('');
            setShowForm(false);
        } catch (error) {
            console.error('Error creating class:', error);
            alert('Failed to schedule class. Please try again.');
        }
    };

    const handleDeleteClass = async (id) => {
        if (window.confirm('Are you sure you want to delete this class?')) {
            try {
                await api.delete(`/api/classes/${id}`);
                setClasses(classes.filter(c => c.id !== id));
            } catch (error) {
                console.error('Error deleting class:', error);
                alert('Failed to delete class. Please try again.');
            }
        }
    };

    const addStudent = (student) => {
        if (!newClass.taggedStudents.find(s => s.id === student.id)) {
            setNewClass({
                ...newClass,
                taggedStudents: [...newClass.taggedStudents, student]
            });
        }
        setSearchTerm('');
        setShowSuggestions(false);
    };

    const removeStudent = (studentId) => {
        setNewClass({
            ...newClass,
            taggedStudents: newClass.taggedStudents.filter(s => s.id !== studentId)
        });
    };

    const filteredStudents = students.filter(student =>
        (student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            student.email.toLowerCase().includes(searchTerm.toLowerCase())) &&
        !newClass.taggedStudents.find(s => s.id === student.id)
    );

    if (!user) {
        return (
            <div className="p-6 max-w-7xl mx-auto space-y-8">
                <div className="text-center py-16">
                    <div className="animate-spin w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full mx-auto"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-secondary-200 dark:border-slate-700">
                <div>
                    <h1 className="text-2xl md:text-3xl font-heading font-bold text-primary-900 dark:text-white flex items-center gap-3">
                        <div className="p-2 bg-primary-50 dark:bg-slate-700 rounded-lg text-primary-600 dark:text-primary-400">
                            <Video size={28} />
                        </div>
                        Online Classes
                    </h1>
                    <p className="text-secondary-600 dark:text-slate-400 mt-2 ml-1">
                        {user.role === 'teacher'
                            ? 'Manage and schedule your upcoming yoga sessions'
                            : 'Join scheduled sessions and continue your practice'}
                    </p>
                </div>
                {user.role === 'teacher' && !showForm && (
                    <button
                        onClick={() => setShowForm(true)}
                        className="flex items-center px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl transition-all shadow-lg shadow-primary-900/20 hover:shadow-xl hover:-translate-y-0.5 font-bold text-sm"
                    >
                        <Plus size={18} className="mr-2" />
                        Schedule Class
                    </button>
                )}
            </div>

            {/* Create Class Form (Teachers Only) */}
            <AnimatePresence>
                {user.role === 'teacher' && showForm && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-lg border border-secondary-200 dark:border-slate-700 mb-8">
                            <div className="flex justify-between items-center mb-8 border-b border-secondary-200 dark:border-slate-700 pb-4">
                                <div>
                                    <h2 className="text-xl font-heading font-bold text-primary-900 dark:text-white">Schedule New Session</h2>
                                    <p className="text-sm text-secondary-500 dark:text-slate-400 mt-1">Fill in the details to create a new class</p>
                                </div>
                                <button
                                    onClick={() => {
                                        setShowForm(false);
                                        setNewClass({ title: '', date: '', time: '', link: '', taggedStudents: [] });
                                        setSearchTerm('');
                                    }}
                                    className="p-2 text-secondary-400 dark:text-slate-400 hover:text-secondary-600 dark:hover:text-slate-200 hover:bg-secondary-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            <form onSubmit={handleCreateClass} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-bold text-primary-900 dark:text-slate-300 mb-2">Class Title</label>
                                        <input
                                            type="text"
                                            required
                                            value={newClass.title}
                                            onChange={(e) => setNewClass({ ...newClass, title: e.target.value })}
                                            className="w-full px-4 py-3 rounded-xl border border-secondary-200 dark:border-slate-600 focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-slate-900 text-primary-900 dark:text-white transition-all placeholder-secondary-400 dark:placeholder-slate-500"
                                            placeholder="e.g., Morning Vinyasa Flow"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-primary-900 dark:text-slate-300 mb-2">Meeting Link</label>
                                        <div className="relative group">
                                            <LinkIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 text-secondary-400 dark:text-slate-500 group-focus-within:text-primary-500 dark:group-focus-within:text-primary-400 transition-colors" size={18} />
                                            <input
                                                type="url"
                                                required
                                                value={newClass.link}
                                                onChange={(e) => setNewClass({ ...newClass, link: e.target.value })}
                                                className="w-full pl-12 pr-4 py-3 rounded-xl border border-secondary-200 dark:border-slate-600 focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-slate-900 text-primary-900 dark:text-white transition-all placeholder-secondary-400 dark:placeholder-slate-500"
                                                placeholder="https://meet.google.com/..."
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-primary-900 dark:text-slate-300 mb-2">Date</label>
                                        <div className="relative group">
                                            <Calendar className="absolute left-4 top-1/2 transform -translate-y-1/2 text-secondary-400 dark:text-slate-500 group-focus-within:text-primary-500 dark:group-focus-within:text-primary-400 transition-colors" size={18} />
                                            <input
                                                type="date"
                                                required
                                                value={newClass.date}
                                                onChange={(e) => setNewClass({ ...newClass, date: e.target.value })}
                                                className="w-full pl-12 pr-4 py-3 rounded-xl border border-secondary-200 dark:border-slate-600 focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-slate-900 text-primary-900 dark:text-white transition-all [color-scheme:light] dark:[color-scheme:dark]"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-primary-900 dark:text-slate-300 mb-2">Time</label>
                                        <div className="relative group">
                                            <Clock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-secondary-400 dark:text-slate-500 group-focus-within:text-primary-500 dark:group-focus-within:text-primary-400 transition-colors" size={18} />
                                            <input
                                                type="time"
                                                required
                                                value={newClass.time}
                                                onChange={(e) => setNewClass({ ...newClass, time: e.target.value })}
                                                className="w-full pl-12 pr-4 py-3 rounded-xl border border-secondary-200 dark:border-slate-600 focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-slate-900 text-primary-900 dark:text-white transition-all [color-scheme:light] dark:[color-scheme:dark]"
                                            />
                                        </div>
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-bold text-primary-900 dark:text-slate-300 mb-2">Tag Students (Optional)</label>

                                        {/* Selected Students Tags */}
                                        {newClass.taggedStudents.length > 0 && (
                                            <div className="flex flex-wrap gap-2 mb-3 p-3 bg-secondary-50 dark:bg-slate-900/50 rounded-xl border border-secondary-200 dark:border-slate-700">
                                                {newClass.taggedStudents.map(student => (
                                                    <div
                                                        key={student.id}
                                                        className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-800 border border-secondary-200 dark:border-slate-600 text-primary-900 dark:text-white rounded-lg text-sm font-medium shadow-sm"
                                                    >
                                                        <span>{student.name}</span>
                                                        <button
                                                            type="button"
                                                            onClick={() => removeStudent(student.id)}
                                                            className="text-secondary-400 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full p-0.5 transition-colors"
                                                        >
                                                            <X size={14} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Autocomplete Input */}
                                        <div className="relative" ref={autocompleteRef}>
                                            <Users className="absolute left-4 top-1/2 transform -translate-y-1/2 text-secondary-400 dark:text-slate-500" size={18} />
                                            <input
                                                type="text"
                                                value={searchTerm}
                                                onChange={(e) => {
                                                    setSearchTerm(e.target.value);
                                                    setShowSuggestions(true);
                                                }}
                                                onFocus={() => setShowSuggestions(true)}
                                                className="w-full pl-12 pr-4 py-3 rounded-xl border border-secondary-200 dark:border-slate-600 focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-slate-900 text-primary-900 dark:text-white transition-all placeholder-secondary-400 dark:placeholder-slate-500"
                                                placeholder="Search students by name or email..."
                                            />

                                            {/* Suggestions Dropdown */}
                                            {showSuggestions && searchTerm && filteredStudents.length > 0 && (
                                                <div className="absolute z-10 w-full mt-2 bg-white dark:bg-slate-800 border border-secondary-200 dark:border-slate-600 rounded-xl shadow-xl max-h-60 overflow-y-auto">
                                                    {filteredStudents.map(student => (
                                                        <button
                                                            key={student.id}
                                                            type="button"
                                                            onClick={() => addStudent(student)}
                                                            className="w-full px-4 py-3 text-left hover:bg-secondary-50 dark:hover:bg-slate-700 transition-colors border-b border-secondary-100 dark:border-slate-700 last:border-b-0 flex justify-between items-center group"
                                                        >
                                                            <div>
                                                                <div className="font-bold text-primary-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-300">{student.name}</div>
                                                                <div className="text-xs text-secondary-500 dark:text-slate-400">{student.email}</div>
                                                            </div>
                                                            <Plus size={16} className="text-secondary-400 dark:text-slate-500 group-hover:text-primary-600 dark:group-hover:text-primary-400" />
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <p className="text-xs text-secondary-500 dark:text-slate-500 mt-2 ml-1">
                                            {newClass.taggedStudents.length === 0
                                                ? "Leave empty to invite all students"
                                                : `${newClass.taggedStudents.length} student(s) tagged`}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex justify-end gap-3 pt-4 border-t border-secondary-200 dark:border-slate-700">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowForm(false);
                                            setNewClass({ title: '', date: '', time: '', link: '', taggedStudents: [] });
                                            setSearchTerm('');
                                        }}
                                        className="px-6 py-2.5 text-sm font-bold text-secondary-600 dark:text-slate-400 hover:bg-secondary-50 dark:hover:bg-slate-700 rounded-xl transition-colors border border-transparent hover:border-secondary-200 dark:hover:border-slate-600"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-8 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-primary-900/20 hover:shadow-xl hover:-translate-y-0.5 text-sm"
                                    >
                                        Schedule Class
                                    </button>
                                </div>
                            </form>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Classes List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence>
                    {loading ? (
                        [...Array(3)].map((_, i) => (
                            <div key={i} className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-secondary-200 dark:border-slate-700 animate-pulse h-64"></div>
                        ))
                    ) : classes.length === 0 ? (
                        <div className="col-span-full text-center py-16 bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-secondary-200 dark:border-slate-600">
                            <div className="w-20 h-20 bg-secondary-50 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Video className="h-10 w-10 text-secondary-400 dark:text-slate-400" />
                            </div>
                            <h3 className="text-lg font-bold text-primary-900 dark:text-white mb-1">No classes scheduled</h3>
                            <p className="text-secondary-500 dark:text-slate-400">
                                {user.role === 'teacher'
                                    ? "Click 'Schedule Class' to create your first session"
                                    : "Check back later for upcoming sessions"}
                            </p>
                        </div>
                    ) : (
                        classes.map((cls) => (
                            <motion.div
                                key={cls.id}
                                layout
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-secondary-200 dark:border-slate-700 hover:border-primary-500/30 hover:shadow-xl transition-all group flex flex-col h-full"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-3 bg-secondary-50 dark:bg-slate-900 rounded-xl text-primary-600 dark:text-primary-400 group-hover:bg-primary-600 group-hover:text-white transition-colors duration-300">
                                        <Video size={24} />
                                    </div>
                                    {user.role === 'teacher' && (
                                        <button
                                            onClick={() => handleDeleteClass(cls.id)}
                                            className="text-secondary-400 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                            title="Delete Class"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    )}
                                </div>

                                <div className="mb-6 flex-1">
                                    <div className="flex items-center gap-2 mb-3">
                                        <span className="text-[10px] font-bold px-2.5 py-1 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-900/30 rounded-full uppercase tracking-wide">
                                            Upcoming
                                        </span>
                                    </div>
                                    <h3 className="text-lg font-heading font-bold text-primary-900 dark:text-white mb-2 line-clamp-2 group-hover:text-primary-600 dark:group-hover:text-primary-300 transition-colors">{cls.title}</h3>
                                    <div className="flex items-center text-sm text-secondary-500 dark:text-slate-400">
                                        <Users size={14} className="mr-2" />
                                        <span className="font-medium text-secondary-700 dark:text-slate-300">{cls.teacherName}</span>
                                    </div>
                                </div>

                                <div className="space-y-3 mb-6 pt-4 border-t border-secondary-200 dark:border-slate-700">
                                    <div className="flex items-center text-secondary-600 dark:text-slate-300">
                                        <Calendar size={16} className="mr-3 text-primary-600 dark:text-primary-400" />
                                        <span className="font-medium text-sm">{new Date(cls.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</span>
                                    </div>
                                    <div className="flex items-center text-secondary-600 dark:text-slate-300">
                                        <Clock size={16} className="mr-3 text-primary-600 dark:text-primary-400" />
                                        <span className="font-medium text-sm">{cls.time}</span>
                                    </div>
                                </div>

                                {user.role === 'admin' ? (
                                    <div className="block w-full text-center px-4 py-3 bg-secondary-100 dark:bg-slate-700 text-secondary-500 dark:text-slate-400 rounded-xl font-bold text-sm cursor-not-allowed border border-secondary-200 dark:border-slate-600">
                                        View Only
                                    </div>
                                ) : (
                                    <a
                                        href={cls.link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="block w-full text-center px-4 py-3 bg-white dark:bg-slate-900 border-2 border-primary-600 dark:border-primary-700 text-primary-600 dark:text-primary-400 rounded-xl hover:bg-primary-600 dark:hover:bg-primary-700 hover:text-white transition-all font-bold text-sm shadow-sm hover:shadow-md"
                                    >
                                        Join Class
                                    </a>
                                )}
                            </motion.div>
                        ))
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
