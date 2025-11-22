import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    // Always use dark theme
    const [theme] = useState('dark');

    useEffect(() => {
        const root = window.document.documentElement;
        root.classList.add('dark');
    }, []);

    // toggleTheme function kept for compatibility but does nothing
    const toggleTheme = () => {
        // Dark mode only - no toggling
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
