import { type Request, type Response } from "express";
import { User } from "../models/user";
import jwt from "jsonwebtoken";
import type { AuthenticatedRequest } from "../middleware/auth";
import config from "../config";

const JWT_ACCESS_SECRET = config.jwtAccessSecret;
const JWT_REFRESH_SECRET = config.jwtRefreshSecret;

const generateAccessToken = (userId: string) => {
    if (!JWT_ACCESS_SECRET) {
        throw new Error("JWT access secret is not defined");
    }
    return jwt.sign({ userId }, JWT_ACCESS_SECRET, { expiresIn: "15m" });
};

const generateRefreshToken = (userId: string) => {
    if (!JWT_REFRESH_SECRET) {
        throw new Error("JWT refresh secret is not defined");
    }
    return jwt.sign({ userId }, JWT_REFRESH_SECRET, { expiresIn: "7d" });
};

const sendRefreshToken = (res: Response, token: string) => {
    res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV !== "development",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
};

class AuthController {
    public async signup(req: Request, res: Response): Promise<void> {
        const { name, email, password } = req.body;

        try {
            const userExists = await User.findOne({ email });
            if (userExists) {
                res.status(400).json({ message: "User with that email already exists" });
                return;
            }

            const user = new User({ name, email, password });
            await user.save();

            const savedUser = await User.findOne({ email });

            if (savedUser) {
                const accessToken = generateAccessToken(savedUser.id);
                const refreshToken = generateRefreshToken(savedUser.id);
                sendRefreshToken(res, refreshToken);

                res.status(201).json({
                    accessToken,
                    user: {
                        _id: savedUser._id,
                        name: savedUser.name,
                        email: savedUser.email,
                    },
                });
            } else {
                res.status(400).json({ message: "Invalid user data" });
            }
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Server error" });
        }
    }

    public async login(req: Request, res: Response): Promise<void> {
        const { email, password } = req.body;

        try {
            const user = await User.findOne({ email }).select("+password");

            if (user && (await user.comparePassword(password))) {
                const accessToken = generateAccessToken(user.id);
                const refreshToken = generateRefreshToken(user.id);
                sendRefreshToken(res, refreshToken);

                res.json({
                    accessToken,
                    user: {
                        _id: user._id,
                        name: user.name,
                        email: user.email,
                    },
                });
            } else {
                res.status(401).json({ message: "Invalid email or password" });
            }
        } catch (error) {
            console.log(error);
            res.status(500).json({ message: "Server error" });
        }
    }

    public async refreshToken(req: Request, res: Response): Promise<void> {
        const refreshToken = req.cookies.token;

        if (!refreshToken) {
            res.status(401).json({ message: "Not authenticated" });
            return;
        }

        if (!JWT_REFRESH_SECRET) {
            res.status(500).json({ message: "JWT refresh secret is not defined" });
            return;
        }

        try {
            const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as jwt.JwtPayload;
            const newAccessToken = generateAccessToken(decoded.userId);
            res.json({ accessToken: newAccessToken });
        } catch (error) {
            res.status(403).json({ message: "Invalid refresh token" });
        }
    }

    public logout(_req: Request, res: Response): void {
        res.cookie("token", "", {
            httpOnly: true,
            expires: new Date(0),
            sameSite: "strict",
        });
        res.status(200).json({ message: "Logged out successfully" });
    }

    public async checkAuth(req: AuthenticatedRequest, res: Response): Promise<void> {
        res.status(200).json(req.user);
    }
}

export const authController = new AuthController();
