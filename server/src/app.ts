// server/src/app.ts - Primary Express Application Bootstrapping File

import express, { Request, Response, NextFunction } from 'express';
import apiRouter from './routes/api';
import candidateRoutes from './routes/candidateRoutes';
import { dbEngine } from './config/db';

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

// Enable standard parsing middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Simulate production-grade security headers & CORS policies
app.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, PUT, DELETE, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  next();
});

// Register API router
app.use('/api/v1', apiRouter);
app.use('/api', candidateRoutes);

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    databaseConnection: true
  });
});

// Global standard error catcher middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('[Global Error Catch]:', err);
  res.status(err.status || 500).json({
    status: 'error',
    code: err.code || 'UNKNOWN_SERVER_ERROR',
    message: err.message || 'An unexpected operational failure occurred on the server.'
  });
});

// Initialize connection pool and launch server port binding
const startServer = async () => {
  try {
    const connected = await dbEngine.connect();
    if (connected) {
      console.log('[System Server] Decoupled relational persistence storage initialized.');
    }
    
    // Only bind to port if run directly
    if (process.env.RUN_STANDALONE === 'true') {
      app.listen(PORT, '0.0.0.0', () => {
        console.log(`[API Live] Recruitment & Assessment Engine serving requests on Port ${PORT}`);
      });
    }
  } catch (err) {
    console.error('[System Server] Initialization sequences encountered fatal errors:', err);
    process.exit(1);
  }
};

// Launch
startServer();

export default app;
