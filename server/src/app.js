import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { env } from './config/env.js';
import { isDatabaseConnected } from './config/database.js';
import { originGuard } from './middleware/originGuard.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import casesRoutes from './routes/casesRoutes.js';
import sessionRoutes from './routes/sessionRoutes.js';
import { AppError } from './utils/AppError.js';

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
  }),
);
app.use(express.json({ limit: '16kb' }));
app.use(originGuard);

// Infrastructure health check only; product API routes are not implemented yet.
app.get('/api/health', (_request, response) => {
  response.status(200).json({
    success: true,
    data: { status: 'ok', database: isDatabaseConnected() ? 'connected' : 'disconnected' },
  });
});

app.get('/api/ready', (_request, _response, next) => {
  if (!isDatabaseConnected()) {
    return next(new AppError(503, 'DATABASE_UNAVAILABLE', 'The database is not ready.'));
  }
  _response.json({ success: true, data: { status: 'ready' } });
});

app.use('/api/cases', casesRoutes);
app.use('/api/session', sessionRoutes);
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
