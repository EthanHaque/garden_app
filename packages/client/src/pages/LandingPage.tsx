import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";
import { ModeToggle } from "@/components/mode_toggle";
import { useRef } from "react";

export function LandingPage() {
    const container = useRef(null);

    useGSAP(
        () => {
            const tl = gsap.timeline({ defaults: { ease: "power2.inOut", duration: 0.6 } });

            tl.from("h2", {
                x: -100,
                opacity: 0,
            })
                .from(
                    "p",
                    {
                        x: -100,
                        opacity: 0,
                    },
                    "<0.1",
                )
                .from(
                    ".card",
                    {
                        y: 50,
                        opacity: 0,
                        stagger: 0.1,
                    },
                    "-=0.4",
                );
        },
        { scope: container },
    );

    return (
        <div ref={container} className="flex flex-col min-h-screen bg-background">
            <header className="container mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
                <h1 className="text-xl sm:text-2xl font-bold">
                    <Link to="/">Cultivar</Link>
                </h1>
                <nav className="flex items-center gap-x-2 sm:gap-x-4">
                    <Button asChild variant="ghost" className="sm:size-auto">
                        <Link to="/login">Login</Link>
                    </Button>
                    <Button asChild className="sm:size-auto">
                        <Link to="/signup">Sign Up</Link>
                    </Button>
                    <ModeToggle />
                </nav>
            </header>

            <main className="flex-grow flex items-center py-12 sm:py-16">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h2 className="text-3xl sm:text-4xl md:text-6xl font-extrabold tracking-tight text-foreground mb-4">
                        Extract Meaning from Web Documents
                    </h2>
                    <p className="max-w-2xl mx-auto text-base sm:text-lg md:text-xl text-muted-foreground mb-8">
                        Cultivar processes and transforms online documents into clean, structured knowledge—perfect for
                        research, comparison, and analysis.
                    </p>
                    <Button asChild size="lg">
                        <Link to="/signup">Get Started for Free</Link>
                    </Button>
                </div>
            </main>

            <section className="bg-muted py-12 sm:py-16 rounded-xl">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <Card className="card">
                            <CardHeader>
                                <CheckCircle className="h-8 w-8 text-primary mb-2" />
                                <CardTitle>Easy to Use</CardTitle>
                                <CardDescription>
                                    A clean and intuitive interface that makes task management a breeze.
                                </CardDescription>
                            </CardHeader>
                        </Card>
                        <Card className="card">
                            <CardHeader>
                                <CheckCircle className="h-8 w-8 text-primary mb-2" />
                                <CardTitle>Secure Authentication</CardTitle>
                                <CardDescription>
                                    Your data is protected with secure, modern authentication.
                                </CardDescription>
                            </CardHeader>
                        </Card>
                        <Card className="card">
                            <CardHeader>
                                <CheckCircle className="h-8 w-8 text-primary mb-2" />
                                <CardTitle>Cross-Platform</CardTitle>
                                <CardDescription>Access your tasks from any device, anywhere.</CardDescription>
                            </CardHeader>
                        </Card>
                    </div>
                </div>
            </section>

            <footer className="container mx-auto py-6 px-4 sm:px-6 lg:px-8 text-center text-muted-foreground">
                <p>&copy; {new Date().getFullYear()} Ethan Haque. All Rights Reserved.</p>
            </footer>
        </div>
    );
}
