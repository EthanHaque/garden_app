import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/context/Auth";

export function ProtectedLayout() {
    const { user, isLoading } = useAuth();

    // Still loading the user's auth state
    if (isLoading) {
        return <div>Loading...</div>; // Or a loading spinner
    }

    // If the user is not authenticated, redirect to the login page
    if (!user) {
        return <Navigate to="/login" />;
    }

    // If the user is authenticated, render the child routes
    return <Outlet />;
}
