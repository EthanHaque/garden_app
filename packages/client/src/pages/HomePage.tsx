import { useState, useEffect } from "react";
import { useAuth } from "@/context/Auth";
import ReactSVG from "@/assets/react.svg";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/mode_toggle";
import "@/App.css";

export function HomePage() {
    const [count, setCount] = useState(0);
    const [message, setMessage] = useState("Loading...");
    const { api, user, logout } = useAuth();

    useEffect(() => {
        api.fetch("/api/healthz")
            .then((res) => {
                if (res.ok) {
                    return res.json();
                }
                throw new Error("Network response was not ok.");
            })
            .then((data) => setMessage(`Server status: ${data.status}`))
            .catch((error) => setMessage(`Failed to fetch status: ${error.message}`));
    }, [api]);

    return (
        <main className="flex flex-col items-center justify-center h-screen">
            <div className="flex flex-col items-center gap-y-4">
                <div className="inline-flex items-center gap-x-4">
                    <img src={ReactSVG} alt="React Logo" className="w-32" />
                    <span className="text-6xl">+</span>
                    <img src={"/vite.svg"} alt="Vite Logo" className="w-32" />
                </div>
                <a href="https://ui.shadcn.com" rel="noopener noreferrer nofollow" target="_blank">
                    <Badge variant="outline">shadcn/ui</Badge>
                </a>

                <p className="text-lg font-medium">Welcome, {user?.name || "Guest"}!</p>
                <p className="text-lg font-medium">{message}</p>

                <div className="flex flex-row items-center gap-x-4">
                    <Button onClick={() => setCount((count) => count + 1)}>Count is: {count}</Button>
                    <Button variant="outline" onClick={logout}>
                        Logout
                    </Button>
                    <ModeToggle />
                </div>
            </div>
        </main>
    );
}
