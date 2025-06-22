import { Routes, Route } from "react-router-dom";
import { ProtectedLayout } from "@/components/protected_layout";
import { LoginForm } from "@/components/login_form";
import { SignupForm } from "@/components/signup_form";
import { HomePage } from "@/pages/HomePage";
import { LandingPage } from "@/pages/LandingPage";
import { DashboardPage } from "./pages/DashboardPage";

function App() {
    return (
        <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginForm />} />
            <Route path="/signup" element={<SignupForm />} />

            {/* Protected Routes */}
            <Route element={<ProtectedLayout />}>
                <Route path="/home" element={<HomePage />} />
                <Route path="/dashboard" element={<DashboardPage />} />
            </Route>
        </Routes>
    );
}

export default App;
