import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth';
import vaultRoutes from './routes/vault';
import sharingRoutes from './routes/sharing';
import billingRoutes from './routes/billing';

const app = express();

// Middleware
app.use(helmet());
app.use(cors({
    origin: 'http://localhost:3000', // Update this for production (Vercel URL)
    credentials: true // Allow cookies
}));
app.use(express.json({ limit: '10mb' })); // Allow large vault blobs
app.use(cookieParser());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/vault', vaultRoutes);
app.use('/api/share', sharingRoutes);
app.use('/api/billing', billingRoutes);

// Export the app instance for Vercel and Local Server
export default app;
