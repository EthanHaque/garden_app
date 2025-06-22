import { Schema, model, Document, Types } from "mongoose";

export interface IJob extends Document {
    url: string;
    status: "queued" | "processing" | "completed" | "failed";
    progress: {
        stage: string;
        percentage: number;
    };
    resultType?: "HtmlResult" | "PdfResult";
    result?: Types.ObjectId;
    error?: string;
    user: Types.ObjectId;
    attempts: number;
    manualRetries: number;
}

const jobSchema = new Schema<IJob>(
    {
        url: { type: String, required: true },
        status: { type: String, required: true, default: "queued" },
        progress: {
            stage: { type: String, default: "Starting..." },
            percentage: { type: Number, default: 0 },
        },
        resultType: { type: String, enum: ["HtmlResult", "PdfResult"] },
        result: { type: Schema.Types.ObjectId, refPath: "resultType" },
        error: { type: String },
        user: { type: Schema.Types.ObjectId, ref: "User", required: true },
        attempts: { type: Number, default: 0 },
        manualRetries: { type: Number, default: 0 },
    },
    { timestamps: true },
);

export const Job = model<IJob>("Job", jobSchema);

// Schemas for results
const htmlResultSchema = new Schema({
    htmlContent: String,
    extractedText: String,
    chunks: [
        {
            text: String,
            embedding: [Number],
        },
    ],
});

const pdfResultSchema = new Schema({
    pages: [
        {
            pageNumber: Number,
            imageUrl: String, // Path to the saved image
            ocrText: String,
            chunks: [
                {
                    text: String,
                    embedding: [Number],
                },
            ],
        },
    ],
});

export const HtmlResult = model("HtmlResult", htmlResultSchema);
export const PdfResult = model("PdfResult", pdfResultSchema);
