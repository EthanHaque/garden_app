import { useState, useEffect } from "react";
import { useAuth } from "@/context/Auth";
import io from "socket.io-client";

export function DashboardPage() {
    const { api, user } = useAuth();
    const [url, setUrl] = useState("");
    const [jobs, setJobs] = useState([]);

    useEffect(() => {
        api.fetch("/api/jobs")
            .then((res) => res.json())
            .then(setJobs);
    }, [api]);

    // Listen for real-time updates
    useEffect(() => {
        if (!user) return;
        const socket = io("http://localhost:3000"); // Your server address

        socket.on(`job:update:${user._id}`, (data) => {
            setJobs((prevJobs) => prevJobs.map((job) => (job._id === data.jobId ? { ...job, ...data } : job)));
        });

        return () => {
            socket.disconnect();
        };
    }, [user]);

    const handleSubmit = (e) => {
        e.preventDefault();
        api.fetch("/api/jobs", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url }),
        })
            .then((res) => res.json())
            .then((newJob) => {
                setJobs((prevJobs) => [newJob, ...prevJobs]);
                setUrl("");
            });
    };

    return (
        <div>
            <h1>Crawler Dashboard</h1>
            <form onSubmit={handleSubmit}>
                <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Enter URL to process" />
                <Button type="submit">Start Job</Button>
            </form>

            {/* Render the list of jobs with their status and progress */}
            <div>
                {jobs.map((job) => (
                    <div key={job._id}>
                        <p>
                            {job.url} - {job.status}
                        </p>
                        <p>
                            {job.progress?.stage} - {job.progress?.percentage}%
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
}
