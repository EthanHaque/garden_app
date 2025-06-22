import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "@/App.tsx";
import "@/styles/globals.css";
import { ThemeProvider } from "@/components/theme_provider.tsx";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "@/context/Auth.tsx";

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <BrowserRouter>
            <ThemeProvider storageKey="vite-ui-theme">
                <AuthProvider>
                    <App />
                </AuthProvider>
            </ThemeProvider>
        </BrowserRouter>
    </StrictMode>,
);
