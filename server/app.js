import express from 'express';
import cors from 'cors';
import morgan from 'morgan';

import authRoutes from './routes/authRoutes.js';
import employeeRoutes from './routes/employeeRoutes.js';
import activityRoutes from './routes/activityRoutes.js';
import pointsRoutes from './routes/pointsRoutes.js';
import leaderboardRoutes from './routes/leaderboardRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import recognitionRoutes from './routes/recognitionRoutes.js';
import integrationRoutes from './routes/integrationRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import statsRoutes from './routes/statsRoutes.js';

import { notFound, errorHandler } from './middleware/errorHandler.js';

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
if (process.env.NODE_ENV !== 'test') app.use(morgan('dev'));

// Health check
app.get('/api/health', (_req, res) => res.json({ success: true, status: 'ok', ts: Date.now() }));

// Feature routes
app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/points', pointsRoutes);
app.use('/api/leaderboards', leaderboardRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/recognition', recognitionRoutes);
app.use('/api/integration', integrationRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/stats', statsRoutes);

// 404 + central error handler (must be last)
app.use(notFound);
app.use(errorHandler);

export default app;
