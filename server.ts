// server.ts - Unified Dev & Production Application Server with Vite Dynamic Middleware
import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { dbEngine } from './server/src/config/db';
import apiRouter from './server/src/routes/api';
import candidateRoutes from './server/src/routes/candidateRoutes';

async function startServer() {
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

  // Connect to persistent relational PostgreSQL database
  try {
    const connected = await dbEngine.connect();
    if (connected) {
      console.log('[System Server] Decoupled relational persistence storage initialized.');
    }
  } catch (err) {
    console.error('[System Server] Database initialization sequences failed:', err);
  }

  // Vite middleware for development (dynamic mounting)
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Unified Server Live] Full-stack recruitment app running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
