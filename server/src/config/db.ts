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
    // Sanitize any env parameters by stripping quotes, carriage returns, or spaces
    const cleanEnv = (key: string, fallback: string = ''): string => {
      const val = process.env[key];
      if (!val) return fallback;
      return val.trim().replace(/^['"]|['"]$/g, '').trim();
    };

    this.poolConfig = {
      host: cleanEnv('DB_HOST', 'assessment-db.c0vy4gm62vv8.us-east-1.rds.amazonaws.com'),
      port: parseInt(cleanEnv('DB_PORT', '5432'), 10) || 5432,
      database: cleanEnv('DB_NAME', 'assessment_platform'),
      user: cleanEnv('DB_USER', 'postgres'),
      password: cleanEnv('DB_PASSWORD', ''),
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

    // Requested DIAGNOSTICS:
    console.log('DB_HOST RAW:', JSON.stringify(process.env.DB_HOST));
    console.log('DB_NAME RAW:', JSON.stringify(process.env.DB_NAME));
    console.log('DB_PORT RAW:', JSON.stringify(process.env.DB_PORT));
    console.log('DB_USER RAW:', JSON.stringify(process.env.DB_USER));
    console.log('Host Length:', process.env.DB_HOST?.length);

    // Run DNS lookup diagnostic on processed host
    const dnsHost = (this.poolConfig.host || '').trim();
    if (dnsHost && dnsHost !== 'localhost' && dnsHost !== '127.0.0.1') {
      try {
        const dns = require('dns').promises;
        console.log(`[Database DNS] Resolving processed DB_HOST hostname: "${dnsHost}"`);
        const result = await dns.lookup(dnsHost);
        console.log(`[Database DNS] Resolved result for "${dnsHost}":`, JSON.stringify(result));
      } catch (dnsErr: any) {
        console.error(`[Database DNS FAIL] Failed to resolve exact hostname "${dnsHost}":`, dnsErr.message || dnsErr);
      }
    }

    // Support unified DATABASE_URL if present (extremely popular on Render, Neon, Supabase, and AWS connection configurations)
    if (process.env.DATABASE_URL) {
      const dbUrlClean = process.env.DATABASE_URL.trim();
      console.log('[Database] Connecting using unified DATABASE_URL configuration.');
      try {
        const testPool = new pg.Pool({
          connectionString: dbUrlClean,
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
      const hostToConnect = this.poolConfig.host;
      const dbToConnect = this.poolConfig.database;
      const userToConnect = this.poolConfig.user;
      const passMasked = this.poolConfig.password ? '****' : '(none)';

      // Print actual connection object (masking password) as requested
      const connectionObjectDiagnostic = {
        host: hostToConnect,
        port: port,
        database: dbToConnect,
        user: userToConnect,
        password: passMasked,
        maxConnections: this.poolConfig.maxConnections,
        idleTimeoutMillis: this.poolConfig.idleTimeoutMillis
      };
      console.log('[Database Pool Config Object]:', JSON.stringify(connectionObjectDiagnostic, null, 2));
      console.log(`[Database] Attempting connection. Host: ${hostToConnect}, Port: ${port}, DB: ${dbToConnect}, User: ${userToConnect}`);
      
      try {
        const useSsl = hostToConnect !== 'localhost' && hostToConnect !== '127.0.0.1';
        const testPool = new pg.Pool({
          host: hostToConnect,
          port: port,
          database: dbToConnect,
          user: userToConnect,
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
