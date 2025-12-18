import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

interface AuthContextType {
    user: any | null; // Replace any with proper User type
    token: string | null;
    role: string | null;
    login: (token: string, role: string, user: any) => void;
    logout: () => void;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
    const [role, setRole] = useState<string | null>(localStorage.getItem('role'));
    const [user, setUser] = useState<any | null>(null);

    useEffect(() => {
        // Ideally verify token validity here or fetch user profile
    }, [token]);

    const login = (newToken: string, newRole: string, newUser: any) => {
        localStorage.setItem('token', newToken);
        localStorage.setItem('role', newRole);
        setToken(newToken);
        setRole(newRole);
        setUser(newUser);
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        setToken(null);
        setRole(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, token, role, login, logout, isAuthenticated: !!token }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
