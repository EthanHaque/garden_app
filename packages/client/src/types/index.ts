export interface User {
    _id: string;
    name: string;
    email: string;
}

export interface IJob {
    _id: string;
    url: string;
    status: "queued" | "processing" | "completed" | "failed";
    progress: {
        stage: string;
        percentage: number;
    };
    result?: {
        htmlContent?: string;
        extractedText?: string;
        chunks?: { text: string; embedding: number[] }[];
    };
    error?: string;
    createdAt: string;
    attempts: number;
    manualRetries?: number;
}
