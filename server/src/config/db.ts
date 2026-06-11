// server/src/config/db.ts - Production PostgreSQL Connection Pool Custom Initializer
import pg from 'pg';

export interface DatabasePoolConfig {
  host?: string;
  port?: number;
  database?: string;
  user?: string;
  password?: string;
  maxConnections?: number;
  idleTimeoutMillis?: number;
}

export class ProductionDatabaseEngine {
  private static instance: ProductionDatabaseEngine;
  private isConnected: boolean = false;
  private pool: pg.Pool | null = null;
  private poolConfig: DatabasePoolConfig;

  private constructor() {
    this.poolConfig = {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      database: process.env.DB_NAME || 'assessment_platform',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || '',
      maxConnections: 20,
      idleTimeoutMillis: 30000
    };
  }

  public static getInstance(): ProductionDatabaseEngine {
    if (!ProductionDatabaseEngine.instance) {
      ProductionDatabaseEngine.instance = new ProductionDatabaseEngine();
    }
    return ProductionDatabaseEngine.instance;
  }

  public async connect(): Promise<boolean> {
    if (this.isConnected && this.pool) return true;
    
    // Support unified DATABASE_URL if present (extremely popular on Render, Neon, Supabase, and AWS connection configurations)
    if (process.env.DATABASE_URL) {
      console.log('[Database] Connecting using unified DATABASE_URL configuration.');
      try {
        const testPool = new pg.Pool({
          connectionString: process.env.DATABASE_URL,
          max: this.poolConfig.maxConnections,
          idleTimeoutMillis: this.poolConfig.idleTimeoutMillis,
          ssl: { rejectUnauthorized: false }, // Allow secure SSL/TLS connections commonly enforced by cloud DB providers
          connectionTimeoutMillis: 7000
        });

        const client = await testPool.connect();
        client.release();

        this.pool = testPool;
        this.isConnected = true;
        console.log('[Database] PostgreSQL database connection successfully verified and active via DATABASE_URL.');
        return true;
      } catch (err: any) {
        console.error('[Database] Connection attempt failed using DATABASE_URL:', err.message || err);
        this.isConnected = false;
        throw err;
      }
    }
    
    const portsToTry: number[] = [this.poolConfig.port || 5432];
    if (this.poolConfig.port && this.poolConfig.port !== 5432) {
      portsToTry.push(5432);
    }

    let lastError: any = null;

    for (const port of portsToTry) {
      console.log(`[Database] Attempting connection. Host: ${this.poolConfig.host}, Port: ${port}, DB: ${this.poolConfig.database}, User: ${this.poolConfig.user}`);
      
      try {
        const useSsl = this.poolConfig.host !== 'localhost' && this.poolConfig.host !== '127.0.0.1';
        const testPool = new pg.Pool({
          host: this.poolConfig.host,
          port: port,
          database: this.poolConfig.database,
          user: this.poolConfig.user,
          password: this.poolConfig.password,
          max: this.poolConfig.maxConnections,
          idleTimeoutMillis: this.poolConfig.idleTimeoutMillis,
          ssl: useSsl ? { rejectUnauthorized: false } : undefined,
          connectionTimeoutMillis: 5000 // Fast fail-over timeout
        });

        const client = await testPool.connect();
        client.release();

        // Successful connection
        this.pool = testPool;
        this.poolConfig.port = port; // Update to the successful port
        this.isConnected = true;
        console.log(`[Database] PostgreSQL connection successfully verified and active on port ${port}.`);
        return true;
      } catch (err: any) {
        console.warn(`[Database] Connection attempt failed on port ${port}:`, err.message || err);
        lastError = err;
      }
    }

    this.isConnected = false;
    console.error('[Database] All connection attempts to PostgreSQL failed.', lastError);
    throw lastError;
  }

  public async query<T = any>(sql: string, params: any[] = []): Promise<{ rows: T[]; rowCount: number }> {
    if (!this.isConnected || !this.pool) {
      await this.connect();
    }
    
    console.log(`[Database Query SQL]: ${sql.substring(0, 150)}... | Params len: ${params.length}`);
    
    if (!this.pool) {
      throw new Error('[Database] Pool is not initialized');
    }

    const res = await this.pool.query(sql, params);
    return {
      rows: res.rows as T[],
      rowCount: res.rowCount ?? 0
    };
  }

  public async closePool(): Promise<void> {
    if (this.pool) {
      console.log('[Database] Shutting down connection pool smoothly.');
      await this.pool.end();
      this.pool = null;
      this.isConnected = false;
    }
  }
}

export const dbEngine = ProductionDatabaseEngine.getInstance();
