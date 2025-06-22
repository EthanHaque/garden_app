import type { IJob, IHtmlResult, IPdfResult } from "../../types/job";
import { HtmlResultDetails } from "./HtmlResultDetails";
import { PdfResultDetails } from "./PdfResultDetails";

interface JobDetailsProps {
    job: IJob | null;
    isLoading: boolean;
}

export function JobDetails({ job, isLoading }: JobDetailsProps) {
    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <p>Loading details...</p>
            </div>
        );
    }

    if (!job) {
        return (
            <div className="flex items-center justify-center h-full">
                <p>No job selected.</p>
            </div>
        );
    }

    if (!job.result) {
        return (
            <div className="flex items-center justify-center h-full">
                <p>This job has not produced a result yet.</p>
            </div>
        );
    }

    if (job.resultType === "PdfResult") {
        return <PdfResultDetails result={job.result as IPdfResult} />;
    }

    if (job.resultType === "HtmlResult") {
        return <HtmlResultDetails result={job.result as IHtmlResult} />;
    }

    return (
        <div className="flex items-center justify-center h-full">
            <p>Unsupported job result type.</p>
        </div>
    );
}
