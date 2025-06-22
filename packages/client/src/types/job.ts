export interface IHtmlResult {
    htmlContent?: string;
    extractedText?: string;
    chunks?: { _id: string; text: string; embedding: number[] }[];
}

export interface IPdfPage {
    _id: string;
    pageNumber: number;
    imageUrl: string;
    ocrText: string;
    chunks: { _id: string; text: string; embedding: number[] }[];
}

export interface IPdfResult {
    _id: string;
    pages: IPdfPage[];
}

export interface IJob {
    _id: string;
    url: string;
    status: "queued" | "processing" | "completed" | "failed";
    progress: {
        stage: string;
        percentage: number;
    };
    resultType?: "HtmlResult" | "PdfResult";
    result?: IHtmlResult | IPdfResult;
    error?: string;
    createdAt: string;
    attempts: number;
    manualRetries?: number;
}
