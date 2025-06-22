import { useState, useEffect } from "react";
import { useAuth } from "@/context/Auth";
import io from "socket.io-client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { IJob } from "@/types";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { JobSubmissionForm } from "@/components/dashboard/JobSubmissionForm";
import { JobsTable } from "@/components/dashboard/JobsTable";
import { JobDetails } from "@/components/dashboard/JobDetails";

export function DashboardPage() {
    const { api, user } = useAuth();
    const [jobs, setJobs] = useState<IJob[]>([]);
    const [selectedJob, setSelectedJob] = useState<IJob | null>(null);
    const [isLoadingDetails, setIsLoadingDetails] = useState(false);

    useEffect(() => {
        api.fetch("/api/jobs")
            .then((res) => res.json())
            .then((data) => setJobs(data));
    }, [api]);

    useEffect(() => {
        if (!user) return;
        const socket = io("http://localhost:3000");

        socket.on("connect", () => {
            socket.emit("join", user._id);
        });

        socket.on(`job:update`, (data) => {
            setJobs((prevJobs) => prevJobs.map((job) => (job._id === data.jobId ? { ...job, ...data } : job)));
            setSelectedJob((prevSelectedJob) => {
                if (prevSelectedJob && prevSelectedJob._id === data.jobId) {
                    return { ...prevSelectedJob, ...data };
                }
                return prevSelectedJob;
            });
        });

        socket.on(`job:delete`, (data: { jobId: string }) => {
            setJobs((prevJobs) => prevJobs.filter((job) => job._id !== data.jobId));
            setSelectedJob((prevSelectedJob) =>
                prevSelectedJob && prevSelectedJob._id === data.jobId ? null : prevSelectedJob,
            );
        });

        return () => {
            socket.disconnect();
        };
    }, [user]);

    const handleJobCreated = (job: IJob) => {
        setJobs((prevJobs) => [job, ...prevJobs]);
    };

    const handleRowClick = (job: IJob) => {
        setIsLoadingDetails(true);
        setSelectedJob(job);
        api.fetch(`/api/jobs/${job._id}`)
            .then((res) => res.json())
            .then((jobDetails) => {
                setSelectedJob(jobDetails);
                setIsLoadingDetails(false);
            })
            .catch(() => setIsLoadingDetails(false));
    };

    return (
        <div className="h-screen flex flex-col p-4 sm:p-6 lg:p-8 gap-4 bg-muted/40">
            <DashboardHeader />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-grow">
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Jobs</CardTitle>
                        <CardDescription>A list of all submitted jobs. Enter a URL to start a new one.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <JobSubmissionForm onJobCreated={handleJobCreated} />
                        <JobsTable jobs={jobs} onRowClick={handleRowClick} selectedJobId={selectedJob?._id} />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Job Details</CardTitle>
                        <CardDescription>Select a job to see its details.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <JobDetails job={selectedJob} isLoading={isLoadingDetails} />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
