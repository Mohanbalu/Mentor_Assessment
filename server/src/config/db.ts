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
    
    console.log(`[Database] Establishing enterprise connection pool to ${this.poolConfig.host}:${this.poolConfig.port}/${this.poolConfig.database}`);
    
    try {
      const useSsl = this.poolConfig.host !== 'localhost' && this.poolConfig.host !== '127.0.0.1';
      this.pool = new pg.Pool({
        host: this.poolConfig.host,
        port: this.poolConfig.port,
        database: this.poolConfig.database,
        user: this.poolConfig.user,
        password: this.poolConfig.password,
        max: this.poolConfig.maxConnections,
        idleTimeoutMillis: this.poolConfig.idleTimeoutMillis,
        ssl: useSsl ? { rejectUnauthorized: false } : undefined
      });

      const client = await this.pool.connect();
      client.release();
      this.isConnected = true;
      console.log('[Database] PostgreSQL connection verified and active.');
      return true;
    } catch (err) {
      console.error('[Database] Failed to connect to PostgreSQL:', err);
      this.isConnected = false;
      throw err;
    }
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
