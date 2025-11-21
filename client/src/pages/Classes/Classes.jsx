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
        <div className="p-6 max-w-7xl mx-auto space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-heading font-bold text-primary-900">Online Classes</h1>
                    <p className="text-secondary-600 mt-2">Join your scheduled yoga sessions and find your flow</p>
                </div>
                {user.role === 'teacher' && !showForm && (
                    <button
                        onClick={() => setShowForm(true)}
                        className="flex items-center px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-all shadow-lg shadow-primary-900/20 hover:shadow-xl hover:-translate-y-0.5 font-bold"
                    >
                        <Plus size={20} className="mr-2" />
                        Schedule Class
                    </button>
                )}
            </div>

            {/* Create Class Form (Teachers Only) */}
            {user.role === 'teacher' && showForm && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="mb-12"
                >
                    <div className="bg-white p-8 rounded-2xl shadow-lg border border-secondary-200">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-heading font-bold text-primary-900">Schedule New Class</h2>
                            <button
                                onClick={() => {
                                    setShowForm(false);
                                    setNewClass({ title: '', date: '', time: '', link: '', taggedStudents: [] });
                                    setSearchTerm('');
                                }}
                                className="text-secondary-500 hover:text-secondary-700"
                            >
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleCreateClass} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-bold text-secondary-700 mb-2">Class Title</label>
                                    <input
                                        type="text"
                                        required
                                        value={newClass.title}
                                        onChange={(e) => setNewClass({ ...newClass, title: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-secondary-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-secondary-50 transition-all"
                                        placeholder="e.g., Morning Vinyasa Flow"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-secondary-700 mb-2">Meeting Link</label>
                                    <div className="relative">
                                        <LinkIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 text-secondary-400" size={18} />
                                        <input
                                            type="url"
                                            required
                                            value={newClass.link}
                                            onChange={(e) => setNewClass({ ...newClass, link: e.target.value })}
                                            className="w-full pl-12 pr-4 py-3 rounded-xl border border-secondary-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-secondary-50 transition-all"
                                            placeholder="https://meet.google.com/..."
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-secondary-700 mb-2">Date</label>
                                    <input
                                        type="date"
                                        required
                                        value={newClass.date}
                                        onChange={(e) => setNewClass({ ...newClass, date: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-secondary-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-secondary-50 transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-secondary-700 mb-2">Time</label>
                                    <input
                                        type="time"
                                        required
                                        value={newClass.time}
                                        onChange={(e) => setNewClass({ ...newClass, time: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-secondary-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-secondary-50 transition-all"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-bold text-secondary-700 mb-2">Tag Students (Optional)</label>

                                    {/* Selected Students Tags */}
                                    {newClass.taggedStudents.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mb-3">
                                            {newClass.taggedStudents.map(student => (
                                                <div
                                                    key={student.id}
                                                    className="flex items-center gap-2 px-3 py-1.5 bg-primary-100 text-primary-700 rounded-lg text-sm font-medium"
                                                >
                                                    <span>{student.name}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeStudent(student.id)}
                                                        className="hover:bg-primary-200 rounded-full p-0.5"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Autocomplete Input */}
                                    <div className="relative" ref={autocompleteRef}>
                                        <Users className="absolute left-4 top-1/2 transform -translate-y-1/2 text-secondary-400" size={18} />
                                        <input
                                            type="text"
                                            value={searchTerm}
                                            onChange={(e) => {
                                                setSearchTerm(e.target.value);
                                                setShowSuggestions(true);
                                            }}
                                            onFocus={() => setShowSuggestions(true)}
                                            className="w-full pl-12 pr-4 py-3 rounded-xl border border-secondary-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-secondary-50 transition-all"
                                            placeholder="Search students by name or email..."
                                        />

                                        {/* Suggestions Dropdown */}
                                        {showSuggestions && searchTerm && filteredStudents.length > 0 && (
                                            <div className="absolute z-10 w-full mt-2 bg-white border border-secondary-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                                                {filteredStudents.map(student => (
                                                    <button
                                                        key={student.id}
                                                        type="button"
                                                        onClick={() => addStudent(student)}
                                                        className="w-full px-4 py-3 text-left hover:bg-secondary-50 transition-colors border-b border-secondary-100 last:border-b-0"
                                                    >
                                                        <div className="font-medium text-secondary-900">{student.name}</div>
                                                        <div className="text-sm text-secondary-500">{student.email}</div>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-xs text-secondary-500 mt-2">
                                        {newClass.taggedStudents.length === 0
                                            ? "Leave empty to invite all students"
                                            : `${newClass.taggedStudents.length} student(s) tagged`}
                                    </p>
                                </div>
                            </div>
                            <div className="flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowForm(false);
                                        setNewClass({ title: '', date: '', time: '', link: '', taggedStudents: [] });
                                        setSearchTerm('');
                                    }}
                                    className="px-6 py-2.5 text-sm font-bold text-secondary-600 hover:bg-secondary-100 rounded-xl transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-8 py-3 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 transition-all shadow-lg shadow-primary-900/20 hover:shadow-xl hover:-translate-y-0.5"
                                >
                                    Schedule Class
                                </button>
                            </div>
                        </form>
                    </div>
                </motion.div>
            )}

            {/* Classes List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence>
                    {loading ? (
                        [...Array(3)].map((_, i) => (
                            <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-secondary-200 animate-pulse h-64"></div>
                        ))
                    ) : classes.length === 0 ? (
                        <div className="col-span-full text-center py-16 bg-white rounded-2xl border border-dashed border-secondary-300">
                            <div className="w-20 h-20 bg-secondary-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Video className="h-10 w-10 text-secondary-400" />
                            </div>
                            <h3 className="text-lg font-bold text-primary-900 mb-1">No classes scheduled at the moment</h3>
                            <p className="text-secondary-500">
                                {user.role === 'teacher'
                                    ? "Click 'Schedule Class' to create your first class"
                                    : "Check back later for upcoming sessions"}
                            </p>
                        </div>
                    ) : (
                        classes.map((cls) => (
                            <motion.div
                                key={cls.id}
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="bg-white p-6 rounded-2xl shadow-sm border border-secondary-200 hover:border-primary-300 hover:shadow-xl transition-all group"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-3.5 bg-primary-50 rounded-xl text-primary-600 group-hover:bg-primary-600 group-hover:text-white transition-colors">
                                        <Video size={24} />
                                    </div>
                                    {user.role === 'teacher' && (
                                        <button
                                            onClick={() => handleDeleteClass(cls.id)}
                                            className="text-secondary-400 hover:text-red-500 p-2 hover:bg-red-50 rounded-lg transition-colors"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    )}
                                </div>

                                <div className="mb-6">
                                    <span className="text-xs font-bold px-3 py-1.5 bg-secondary-100 text-secondary-600 rounded-full">
                                        Upcoming
                                    </span>
                                    <h3 className="text-xl font-heading font-bold text-primary-900 mt-3 mb-2 line-clamp-1">{cls.title}</h3>
                                    <div className="flex items-center text-sm text-secondary-500 mb-1">
                                        <Users size={14} className="mr-2" />
                                        Instructor: <span className="font-semibold text-secondary-700 ml-1">{cls.teacherName}</span>
                                    </div>
                                </div>

                                <div className="space-y-3 mb-6">
                                    <div className="flex items-center text-secondary-600 bg-secondary-50 p-3 rounded-xl">
                                        <Calendar size={18} className="mr-3 text-primary-500" />
                                        <span className="font-medium">{new Date(cls.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</span>
                                    </div>
                                    <div className="flex items-center text-secondary-600 bg-secondary-50 p-3 rounded-xl">
                                        <Clock size={18} className="mr-3 text-primary-500" />
                                        <span className="font-medium">{cls.time}</span>
                                    </div>
                                </div>

                                {user.role === 'admin' ? (
                                    <div className="block w-full text-center px-4 py-3 bg-secondary-100 text-secondary-600 rounded-xl font-bold cursor-not-allowed">
                                        View Only (Admin)
                                    </div>
                                ) : (
                                    <a
                                        href={cls.link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="block w-full text-center px-4 py-3 bg-white border-2 border-primary-600 text-primary-600 rounded-xl hover:bg-primary-600 hover:text-white transition-all font-bold"
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
