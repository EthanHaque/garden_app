import dotenv from "dotenv";

dotenv.config();

// Helper for exiting on fatal errors
const exitOnMissing = (variable: string) => {
    console.error(`FATAL ERROR: ${variable} is not defined in the environment.`);
    process.exit(1);
};

// Validate essential environment variables
if (!process.env.DATABASE_URL) exitOnMissing("DATABASE_URL");
if (!process.env.JWT_ACCESS_SECRET) exitOnMissing("JWT_ACCESS_SECRET");
if (!process.env.JWT_REFRESH_SECRET) exitOnMissing("JWT_REFRESH_SECRET");

const config = {
    /**
     * The current environment (e.g., 'development', 'production').
     * Defaults to 'development'.
     */
    nodeEnv: process.env.NODE_ENV || "development",

    /**
     * The port the server will run on.
     * Defaults to 3000 if not specified in .env
     */
    port: process.env.PORT || "3000",

    /**
     * The MongoDB connection URI.
     */
    databaseURL: process.env.DATABASE_URL,

    /**
     * Secret for JWT Access Tokens.
     */
    jwtAccessSecret: process.env.JWT_ACCESS_SECRET,

    /**
     * Secret for JWT Refresh Tokens.
     */
    jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
};

export default config;
