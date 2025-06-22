import { Router } from "express";
import { protect } from "../middleware/auth";
import { Job, HtmlResult, PdfResult } from "../models/job";
import { crawlerQueue } from "../../../crawler/src/queue";
import { validateJobCreation } from "../middleware/validators";

export const jobRouter: Router = Router();

jobRouter.post("/", protect, validateJobCreation, async (req, res) => {
    const { url } = req.body;

    const job = new Job({ url, user: req.user._id });
    await job.save();

    await crawlerQueue.add(
        "process-url",
        { url, jobId: job._id },
        {
            attempts: 3,
            backoff: {
                type: "exponential",
                delay: 1000,
            },
        },
    );

    res.status(201).json(job);
});

jobRouter.get("/", protect, async (req, res) => {
    const jobs = await Job.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(jobs);
});

// We also need an endpoint to get the detailed result
jobRouter.get("/:id", protect, async (req, res) => {
    const job = await Job.findOne({ _id: req.params.id, user: req.user._id }).populate("result");
    if (!job) {
        return res.status(404).json({ message: "Job not found" });
    }
    res.json(job);
});

jobRouter.delete("/:id", protect, async (req, res) => {
    try {
        const job = await Job.findOne({ _id: req.params.id, user: req.user._id });

        if (!job) {
            return res.status(404).json({ message: "Job not found" });
        }

        // Clean up associated result data from the database
        if (job.result) {
            if (job.resultType === "HtmlResult") {
                await HtmlResult.findByIdAndDelete(job.result);
            } else if (job.resultType === "PdfResult") {
                await PdfResult.findByIdAndDelete(job.result);
            }
        }

        // Delete the job document itself
        await Job.findByIdAndDelete(req.params.id);

        // Notify the client in real-time
        const io = req.app.get("io");
        io.to(job.user.toString()).emit("job:delete", { jobId: job._id });

        res.status(200).json({ message: "Job deleted successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
});

jobRouter.post("/:id/retry", protect, async (req, res) => {
    try {
        const job = await Job.findOne({ _id: req.params.id, user: req.user._id });
        if (!job) {
            return res.status(404).json({ message: "Job not found" });
        }

        if (job.status !== "failed") {
            return res.status(400).json({ message: "Only failed jobs can be retried." });
        }

        job.status = "queued";
        job.error = undefined;
        job.progress = { stage: "Re-queued", percentage: 0 };
        job.attempts = 0;
        job.manualRetries = (job.manualRetries || 0) + 1;
        await job.save();

        await crawlerQueue.add(
            "process-url",
            { url: job.url, jobId: job._id },
            {
                attempts: 3,
                backoff: {
                    type: "exponential",
                    delay: 1000,
                },
            },
        );

        const io = req.app.get("io");
        io.to(job.user.toString()).emit("job:update", {
            jobId: job._id,
            status: "queued",
            progress: job.progress,
            error: undefined,
            attempts: 0,
            manualRetries: job.manualRetries,
        });

        res.status(200).json(job);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
});
