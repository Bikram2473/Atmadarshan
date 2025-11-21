import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    LayoutDashboard,
    MessageSquare,
    Video,
    Settings,
    LogOut,
    Menu,
    X,
    CreditCard,
    Users
} from 'lucide-react';
import { useState, useEffect } from 'react';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import logo from '../assets/logo.png';
import io from 'socket.io-client';
import api from '../api/axios';

export default function Layout() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [socket, setSocket] = useState(null);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    // Fetch unread count and setup socket
    useEffect(() => {
        if (!user) return;

        const fetchUnreadCount = async () => {
            try {
                const res = await api.get(`/api/chat/unread-count/${user.id}`);
                setUnreadCount(res.data.unreadCount);
            } catch (error) {
                console.error("Failed to fetch unread count", error);
            }
        };

        fetchUnreadCount();

        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
        const newSocket = io(apiUrl, {
            transports: ['websocket'],
            path: '/socket.io',
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 5,
            withCredentials: true
        });
        setSocket(newSocket);

        newSocket.on('connect', () => {
            newSocket.emit('register_user', user.id);
        });

        newSocket.on('new_message_notification', () => {
            // Increment unread count if not currently on the chat page
            // Or even if on chat page but not in that specific chat (simplified: just increment, ChatWindow will clear it)
            if (!location.pathname.includes('/chat')) {
                setUnreadCount(prev => prev + 1);
            } else {
                // If on chat page, we might still want to increment if not in the specific room
                // But for now, let's re-fetch to be accurate
                fetchUnreadCount();
            }
        });

        return () => newSocket.close();
    }, [user, location.pathname]);

    // Clear unread count when entering chat page (optional, or handle per-chat in ChatWindow)
    // We'll handle specific chat clearing in ChatWindow, but maybe re-fetch here when location changes
    useEffect(() => {
        if (location.pathname === '/chat' && user) {
            // We don't clear all, only when specific chat opens.
            // But we can re-fetch to ensure accuracy
            const fetchUnreadCount = async () => {
                try {
                    const res = await api.get(`/api/chat/unread-count/${user.id}`);
                    setUnreadCount(res.data.unreadCount);
                } catch (error) {
                    console.error("Failed to fetch unread count", error);
                }
            };
            fetchUnreadCount();
        }
    }, [location.pathname, user]);


    const navItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
        { icon: MessageSquare, label: 'Chat', path: '/chat', adminHidden: true, badge: unreadCount },
        { icon: Video, label: 'Classes', path: '/classes' },
        { icon: CreditCard, label: 'Payments', path: '/payments' },
        { icon: Settings, label: 'Settings', path: '/settings' },
    ];

    // Add admin-only navigation
    if (user?.role === 'admin') {
        navItems.splice(5, 0, { icon: Users, label: 'User Management', path: '/admin' });
    }

    // Filter out admin-hidden items for admin users
    const filteredNavItems = user?.role === 'admin'
        ? navItems.filter(item => !item.adminHidden)
        : navItems;

    return (
        <div className="min-h-screen bg-secondary-50 flex font-sans">
            {/* Sidebar */}
            <aside className={clsx(
                "fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-secondary-200 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 shadow-xl md:shadow-none",
                isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="h-full flex flex-col">
                    <div className="h-20 flex items-center px-6 border-b border-secondary-100">
                        <img src={logo} alt="Atmadarshan" className="w-12 h-12 rounded-full shadow-md" />
                        <span className="ml-3 text-2xl font-heading font-bold text-primary-700 tracking-tight">Atmadarshan</span>
                        <button
                            className="md:hidden ml-auto text-secondary-500 hover:text-primary-600 transition-colors"
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            <X size={24} />
                        </button>
                    </div>

                    <nav className="flex-1 p-6 space-y-2">
                        {filteredNavItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = location.pathname === item.path;
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className={clsx(
                                        "flex items-center px-4 py-3.5 text-sm font-medium rounded-xl transition-all duration-200 group relative overflow-hidden",
                                        isActive
                                            ? "bg-primary-50 text-primary-700 shadow-sm"
                                            : "text-secondary-600 hover:bg-secondary-50 hover:text-primary-600"
                                    )}
                                >
                                    {isActive && (
                                        <motion.div
                                            layoutId="activeNav"
                                            className="absolute inset-0 bg-primary-50 rounded-xl"
                                            initial={false}
                                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                        />
                                    )}
                                    <span className="relative z-10 flex items-center w-full">
                                        <Icon size={22} className={clsx(
                                            "mr-3 transition-colors",
                                            isActive ? "text-primary-600" : "text-secondary-400 group-hover:text-primary-500"
                                        )} />
                                        {item.label}
                                        {item.badge > 0 && (
                                            <span className="ml-auto bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-sm animate-pulse">
                                                {item.badge > 99 ? '99+' : item.badge}
                                            </span>
                                        )}
                                    </span>
                                </Link>
                            );
                        })}
                    </nav>

                    <div className="p-6 border-t border-secondary-100 bg-secondary-50/50">
                        <div className="flex items-center mb-6 px-2">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center text-primary-700 font-bold shadow-sm border border-primary-100">
                                {user?.name?.[0]?.toUpperCase()}
                            </div>
                            <div className="ml-3 overflow-hidden">
                                <p className="text-sm font-semibold text-gray-800 truncate">{user?.name}</p>
                                <p className="text-xs text-primary-600 font-medium capitalize">{user?.role}</p>
                            </div>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center px-4 py-2.5 text-sm font-medium text-red-600 rounded-xl hover:bg-red-50 transition-colors border border-transparent hover:border-red-100"
                        >
                            <LogOut size={20} className="mr-3" />
                            Logout
                        </button>
                    </div>
                </div>
            </aside>

            {/* Mobile Overlay */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-primary-900/20 backdrop-blur-sm z-40 md:hidden"
                        onClick={() => setIsMobileMenuOpen(false)}
                    />
                )}
            </AnimatePresence>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-secondary-50/30">
                <header className="h-16 bg-white/80 backdrop-blur-md border-b border-secondary-200 flex items-center px-4 md:hidden sticky top-0 z-30">
                    <button
                        onClick={() => setIsMobileMenuOpen(true)}
                        className="text-secondary-600 hover:text-primary-600 transition-colors"
                    >
                        <Menu size={24} />
                    </button>
                    <img src={logo} alt="Atmadarshan" className="ml-3 w-10 h-10 rounded-full shadow-md" />
                    <span className="ml-2 text-lg font-heading font-bold text-primary-800">Atmadarshan</span>
                </header>

                <div className="flex-1 overflow-y-auto scroll-smooth">
                    <div className="max-w-7xl mx-auto w-full">
                        <Outlet />
                    </div>
                </div>
            </main>
        </div>
    );
}
