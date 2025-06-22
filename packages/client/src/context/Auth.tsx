import { createContext, useState, useContext, useEffect, useMemo, useRef, type ReactNode } from "react";
import { type User } from "../types";
import { useNavigate } from "react-router-dom";
import { ApiClient } from "@/lib/api";

interface AuthContextType {
    user: User | null;
    api: ApiClient;
    login: (e: React.FormEvent<HTMLFormElement>) => Promise<void>;
    signup: (e: React.FormEvent<HTMLFormElement>) => Promise<void>;
    logout: () => Promise<void>;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [accessToken, setAccessToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();

    const tokenRef = useRef(accessToken);
    useEffect(() => {
        tokenRef.current = accessToken;
    }, [accessToken]);

    const apiBaseUrl = import.meta.env.PROD ? "" : import.meta.env.VITE_API_BASE_URL;

    const handleAuthResponse = (data: { accessToken: string; user: User }) => {
        setAccessToken(data.accessToken);
        setUser(data.user);
        navigate("/dashboard");
    };

    const refreshToken = async (): Promise<string | null> => {
        try {
            const res = await fetch(`${apiBaseUrl}/api/auth/refresh`, { method: "POST" });
            if (!res.ok) {
                setUser(null);
                setAccessToken(null);
                return null;
            }
            const data = await res.json();
            setAccessToken(data.accessToken);
            return data.accessToken;
        } catch (error) {
            setUser(null);
            setAccessToken(null);
            return null;
        }
    };

    const api = useMemo(() => new ApiClient(apiBaseUrl, () => tokenRef.current, refreshToken), [apiBaseUrl]);

    useEffect(() => {
        const checkUser = async () => {
            setIsLoading(true);
            const newAccessToken = await refreshToken();
            if (newAccessToken) {
                // If we got a token, fetch user details
                try {
                    const res = await api.fetch("/api/auth/check");
                    if (res.ok) {
                        const userData = await res.json();
                        setUser(userData);
                    }
                } catch (error) {
                    console.error("Failed to fetch user details after refresh", error);
                }
            }
            setIsLoading(false);
        };
        checkUser();
    }, []);

    const login = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const data = Object.fromEntries(formData.entries());
        try {
            const res = await fetch(`${apiBaseUrl}/api/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            const responseData = await res.json();
            if (!res.ok) {
                if (res.status === 422 && responseData.errors) throw { validationErrors: responseData.errors };
                throw new Error(responseData.message || "Login failed");
            }
            handleAuthResponse(responseData);
        } catch (error) {
            console.error("An error occurred during login", error);
            throw error;
        }
    };

    const signup = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const data = Object.fromEntries(formData.entries());
        try {
            const res = await fetch(`${apiBaseUrl}/api/auth/signup`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            const responseData = await res.json();
            if (!res.ok) {
                if (res.status === 422 && responseData.errors) throw { validationErrors: responseData.errors };
                throw new Error(responseData.message || "Signup failed");
            }
            handleAuthResponse(responseData);
        } catch (error) {
            console.error("An error occurred during signup", error);
            throw error;
        }
    };

    const logout = async () => {
        setUser(null);
        setAccessToken(null);
        try {
            await fetch(`${apiBaseUrl}/api/auth/logout`, { method: "POST" });
        } catch (error) {
            console.error("Logout failed on server", error);
        } finally {
            navigate("/login");
        }
    };

    const value = { user, api, login, signup, logout, isLoading };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};
