import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
        setLoading(false);
    }, []);

    const login = async (email, password) => {
        try {
            const res = await api.post('/api/auth/login', { email, password });
            setUser(res.data.user);
            localStorage.setItem('user', JSON.stringify(res.data.user));
            return { success: true };
        } catch (error) {
            return { success: false, message: error.response?.data?.message || 'Login failed' };
        }
    };

    const signup = async (name, email, password, securityQuestion, securityAnswer) => {
        try {
            const res = await api.post('/api/auth/signup', {
                name,
                email,
                password,
                securityQuestion,
                securityAnswer
            });
            setUser(res.data.user);
            localStorage.setItem('user', JSON.stringify(res.data.user));
            return { success: true };
        } catch (error) {
            return { success: false, message: error.response?.data?.message || 'Signup failed' };
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('user');
    };

    const updateUser = (userData) => {
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
    };

    return (
        <AuthContext.Provider value={{ user, login, signup, logout, loading, updateUser }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
