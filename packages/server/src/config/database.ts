import mongoose from "mongoose";

const connectDB = async () => {
    try {
        const mongoUri = process.env.DATABASE_URL;
        if (!mongoUri) {
            console.error("DATABASE_URL is not defined in the environment variables.");
            process.exit(1);
        }
        await mongoose.connect(mongoUri);
        console.log("MongoDB connected successfully.");
    } catch (error) {
        console.error("MongoDB connection failed:", error);
        process.exit(1);
    }
};

export default connectDB;
