import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { User, type IUser } from "../models/user";
import config from "../config";

export interface AuthenticatedRequest extends Request {
    user?: IUser;
}

export const protect = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    let token;
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.split(" ")[1];
    }

    if (!token) {
        res.status(401).json({ message: "Not authorized, no token" });
        return;
    }

    if (!config.jwtAccessSecret) {
        res.status(500).json({ message: "JWT access secret is not defined" });
        return;
    }

    try {
        const decoded = jwt.verify(token, config.jwtAccessSecret) as jwt.JwtPayload;
        const user = await User.findById(decoded.userId).select("-password");
        if (!user) {
            res.status(401).json({ message: "Not authorized, user not found" });
            return;
        }
        req.user = user;
        next();
    } catch (error) {
        // This will catch expired tokens and invalid tokens
        res.status(401).json({ message: "Not authorized, token failed" });
    }
};
