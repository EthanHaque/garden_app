import { Worker } from "bullmq";
import puppeteer from "puppeteer";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { CustomEmbeddingClient } from "./embeddingClient";
import { Job, HtmlResult, PdfResult } from "../../server/src/models/job";
import { connection, CRAWLER_QUEUE_NAME } from "./queue";
import connectDB from "../../server/src/config/database"; // Reuse db connection
import axios from "axios";
import fs from "fs/promises";
import path from "path";

const processJob = async (job) => {
    console.log(`Processing job ${job.id} for URL: ${job.data.url}. Attempt ${job.attemptsMade}`);
    try {
        await job.updateProgress({ stage: "Starting", percentage: 5, attempts: job.attemptsMade });

        const browser = await puppeteer.launch({
            headless: true,
            args: ["--no-sandbox", "--disable-setuid-sandbox"],
        });
        const page = await browser.newPage();
        const response = await page.goto(job.data.url, { waitUntil: "networkidle2" });
        const contentType = response.headers()["content-type"] || "";

        if (contentType.includes("application/pdf")) {
            await job.updateProgress({ stage: "Processing PDF", percentage: 20, attempts: job.attemptsMade });

            // Re-purpose the page for PDF rendering with pdf.js
            await page.setContent(`
                <html><body></body><script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js"></script></html>
            `);
            await page.evaluate(() => {
                (window as any).pdfjsLib.GlobalWorkerOptions.workerSrc =
                    `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js`;
            });

            // Function to be executed in browser context to render PDF pages to images
            const pageImages = await page.evaluate(async (pdfUrl) => {
                const pdf = await (window as any).pdfjsLib.getDocument(pdfUrl).promise;
                const pages = [];
                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    const viewport = page.getViewport({ scale: 1.5 });
                    const canvas = document.createElement("canvas");
                    const context = canvas.getContext("2d");
                    canvas.height = viewport.height;
                    canvas.width = viewport.width;
                    await page.render({ canvasContext: context, viewport: viewport }).promise;
                    pages.push(canvas.toDataURL("image/jpeg"));
                }
                return pages;
            }, job.data.url);

            const allPagesData = [];
            const UPLOAD_DIR = path.resolve(__dirname, "../../server/public/uploads");
            const jobUploadDir = path.join(UPLOAD_DIR, job.data.jobId);
            await fs.mkdir(jobUploadDir, { recursive: true });

            const embeddings = new CustomEmbeddingClient();
            const splitter = new RecursiveCharacterTextSplitter({ chunkSize: 1000, chunkOverlap: 100 });

            for (let i = 0; i < pageImages.length; i++) {
                const pageNumber = i + 1;
                await job.updateProgress({
                    stage: `Processing Page ${pageNumber}/${pageImages.length}`,
                    percentage: Math.round(20 + 60 * (pageNumber / pageImages.length)),
                    attempts: job.attemptsMade,
                });

                const base64Data = pageImages[i].replace(/^data:image\/jpeg;base64,/, "");
                const imageBuffer = Buffer.from(base64Data, "base64");

                // Save image
                const imagePath = path.join(jobUploadDir, `page-${pageNumber}.jpeg`);
                await fs.writeFile(imagePath, imageBuffer);
                const imageUrl = `/uploads/${job.data.jobId}/page-${pageNumber}.jpeg`;

                // OCR
                const ocrResponse = await axios.post("http://localhost:4001/ocr", imageBuffer, {
                    headers: { "Content-Type": "image/jpeg" },
                });
                const ocrText = ocrResponse.data.text;

                // Chunk & Embed
                const chunks = await splitter.splitText(ocrText);
                const chunkEmbeddings = await embeddings.embedDocuments(chunks);

                allPagesData.push({
                    pageNumber,
                    imageUrl,
                    ocrText,
                    chunks: chunks.map((chunk, j) => ({ text: chunk, embedding: chunkEmbeddings[j] })),
                });
            }

            const result = new PdfResult({ pages: allPagesData });
            await result.save();
            await Job.updateOne({ _id: job.data.jobId }, { result: result._id, resultType: "PdfResult" });
        } else {
            // HTML Processing
            await job.updateProgress({ stage: "Extracting HTML", percentage: 30, attempts: job.attemptsMade });
            const htmlContent = await page.content();
            const extractedText = await page.evaluate(() => document.body.innerText);

            await job.updateProgress({ stage: "Chunking Text", percentage: 60, attempts: job.attemptsMade });
            const splitter = new RecursiveCharacterTextSplitter({ chunkSize: 1000, chunkOverlap: 100 });
            const chunks = await splitter.splitText(extractedText);

            await job.updateProgress({ stage: "Generating Embeddings", percentage: 80, attempts: job.attemptsMade });
            const embeddings = new CustomEmbeddingClient();
            const chunkEmbeddings = await embeddings.embedDocuments(chunks);

            const result = new HtmlResult({
                htmlContent,
                extractedText,
                chunks: chunks.map((chunk, i) => ({ text: chunk, embedding: chunkEmbeddings[i] })),
            });
            await result.save();

            await Job.updateOne({ _id: job.data.jobId }, { result: result._id, resultType: "HtmlResult" });
        }

        await browser.close();
        await job.updateProgress({ stage: "Completed", percentage: 100, attempts: job.attemptsMade });
        console.log(`Job ${job.id} completed.`);
    } catch (error) {
        console.error(`Job ${job.id} failed on attempt ${job.attemptsMade} with error: ${error.message}`);
        throw error;
    }
};

export const startWorker = () => {
    console.log("Starting crawler worker...");
    connectDB();
    new Worker(CRAWLER_QUEUE_NAME, processJob, { connection });
};
