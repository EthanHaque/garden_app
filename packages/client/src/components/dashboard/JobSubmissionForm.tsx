import { useState } from "react";
import { useAuth } from "@/context/Auth";
import { type IJob } from "../../types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface JobSubmissionFormProps {
    onJobCreated: (job: IJob) => void;
}

export function JobSubmissionForm({ onJobCreated }: JobSubmissionFormProps) {
    const { api } = useAuth();
    const [url, setUrl] = useState("");
    const [submitError, setSubmitError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setSubmitError(null);
        try {
            const res = await api.fetch("/api/jobs", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url }),
            });
            const responseData = await res.json();

            if (!res.ok) {
                if (res.status === 422 && responseData.errors && responseData.errors.url) {
                    throw new Error(responseData.errors.url);
                }
                throw new Error(responseData.message || "Failed to start job");
            }
            onJobCreated(responseData);
            setUrl("");
        } catch (error: any) {
            setSubmitError(error.message);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col items-start gap-2 mb-4">
            <div className="flex items-center gap-2 w-full">
                <Input
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://example.com"
                    className="flex-grow"
                    aria-invalid={!!submitError}
                />
                <Button type="submit">Start Job</Button>
            </div>
            {submitError && <p className="text-red-500 text-xs">{submitError}</p>}
        </form>
    );
}
