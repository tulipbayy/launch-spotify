import { createContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

export const AuthContext = createContext<any>(null);

export const AuthProvider = ({ children } : { children: ReactNode }) => {
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const savedUser = localStorage.getItem('spotify_user');
        if (savedUser) {
            setUser(JSON.parse(savedUser));
        }
    }, []);

    const login = (userData: any) => {
        setUser(userData);
        localStorage.setItem('spotify_user', JSON.stringify(userData));
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('spotify_user');
    };

    return (
        <AuthContext.Provider value={ {user, login, logout} }>
            {children}
        </AuthContext.Provider>
    );
};