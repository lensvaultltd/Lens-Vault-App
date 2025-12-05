import { Request, Response, NextFunction } from 'express';
import { auth } from '../firebase';

export interface AuthRequest extends Request {
    user?: {
        uid: string;
        email: string;
        [key: string]: any;
    };
}

export const authenticateToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    try {
        const decodedToken = await auth.verifyIdToken(token);
        req.user = {
            uid: decodedToken.uid,
            email: decodedToken.email || '',
            ...decodedToken
        };
        next();
    } catch (error) {
        console.error('Error verifying token:', error);
        return res.status(403).json({ error: 'Forbidden: Invalid token' });
    }
};
