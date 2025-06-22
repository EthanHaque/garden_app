import type { Request, Response, NextFunction } from "express";
import { z, ZodError } from "zod";

const signupSchema = z.object({
    name: z.string().trim().min(1, "Name is required"),
    email: z.string().email("Please enter a valid email address"),
    password: z.string().min(10, "Password must be at least 10 characters long"),
});

const loginSchema = z.object({
    email: z.string().email("Please enter a valid email address"),
    password: z.string().min(1, "Password is required"),
});

const jobCreationSchema = z.object({
    url: z.string().url({ message: "A valid URL is required." }),
});

/**
 * Middleware factory to validate request body against a Zod schema.
 * @param schema The Zod schema to validate against.
 * @returns An Express middleware function.
 */
const validate = (schema: z.ZodObject<any, any>) => (req: Request, res: Response, next: NextFunction) => {
    try {
        schema.parse(req.body);
        next();
    } catch (error) {
        if (error instanceof ZodError) {
            const extractedErrors: { [key: string]: string } = {};
            error.errors.forEach((err) => {
                const path = err.path[0];
                if (path) {
                    extractedErrors[path] = err.message;
                }
            });
            res.status(422).json({ errors: extractedErrors });
            return;
        }
        // For unexpected errors
        res.status(500).json({ message: "Internal Server Error" });
    }
};

export const validateSignup = validate(signupSchema);
export const validateLogin = validate(loginSchema);
export const validateJobCreation = validate(jobCreationSchema);
