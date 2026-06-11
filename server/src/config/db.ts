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
      host: cleanEnv('DB_HOST', 'localhost'),
      port: parseInt(cleanEnv('DB_PORT', '5432'), 10) || 5432,
      database: cleanEnv('DB_NAME', 'assessment_platform'),
      user: cleanEnv('DB_USER', 'postgres'),
      password: cleanEnv('DB_PASSWORD', 'mohanbalu2004'),
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
        
        // Auto initialize schemas and tables
        await this.initializeDatabaseTables();
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
        
        // Auto initialize schemas and tables
        await this.initializeDatabaseTables();
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

  /**
   * Automatically configures required RDS schemas and seeds starting metadata
   */
  public async initializeDatabaseTables(): Promise<void> {
    console.log('[Db Engine Schema Init] Verification checks starting.');
    
    const schemas = [
      // 1. candidate_profiles (clean auto schema recovery trigger)
      `CREATE TABLE IF NOT EXISTS candidate_profiles (
        id SERIAL PRIMARY KEY,
        full_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(100),
        college VARCHAR(255),
        branch VARCHAR(255),
        academic_year VARCHAR(100),
        cgpa NUMERIC(5,2),
        target_role VARCHAR(255),
        github_url VARCHAR(255),
        linkedin_url VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );`,

      // 2. assessments
      `CREATE TABLE IF NOT EXISTS assessments (
        id VARCHAR(100) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        assessment_type VARCHAR(100),
        duration_minutes INT,
        total_marks INT DEFAULT 100,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );`,

      // 3. questions
      `CREATE TABLE IF NOT EXISTS questions (
        id VARCHAR(100) PRIMARY KEY,
        assessment_id VARCHAR(100) REFERENCES assessments(id) ON DELETE CASCADE,
        question_text TEXT NOT NULL,
        question_type VARCHAR(50) NOT NULL,
        options_json TEXT, -- JSON layout for MCQ answer keys
        correct_answer TEXT,
        marks INT DEFAULT 10,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );`,

      // 4. assessment_attempts
      `CREATE TABLE IF NOT EXISTS assessment_attempts (
        id VARCHAR(100) PRIMARY KEY,
        candidate_id INT REFERENCES candidate_profiles(id) ON DELETE CASCADE,
        assessment_id VARCHAR(100) REFERENCES assessments(id) ON DELETE CASCADE,
        started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        submitted_at TIMESTAMP,
        total_score NUMERIC(5,2),
        percentage NUMERIC(5,2),
        status VARCHAR(50) DEFAULT 'Evaluated'
      );`,

      // 5. candidate_answers
      `CREATE TABLE IF NOT EXISTS candidate_answers (
        id SERIAL PRIMARY KEY,
        attempt_id VARCHAR(100) REFERENCES assessment_attempts(id) ON DELETE CASCADE,
        question_id VARCHAR(100) REFERENCES questions(id) ON DELETE CASCADE,
        answer_text TEXT,
        obtained_marks INT DEFAULT 0,
        evaluated_by_ai BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );`,

      // 6. coding_submissions
      `CREATE TABLE IF NOT EXISTS coding_submissions (
        id SERIAL PRIMARY KEY,
        attempt_id VARCHAR(100) REFERENCES assessment_attempts(id) ON DELETE CASCADE,
        question_id VARCHAR(100) REFERENCES questions(id) ON DELETE CASCADE,
        source_code TEXT,
        language VARCHAR(50),
        execution_result TEXT,
        score INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );`,

      // 7. evaluation_results
      `CREATE TABLE IF NOT EXISTS evaluation_results (
        id SERIAL PRIMARY KEY,
        attempt_id VARCHAR(100) REFERENCES assessment_attempts(id) ON DELETE CASCADE,
        aptitude_score NUMERIC(5,2) DEFAULT 0,
        technical_score NUMERIC(5,2) DEFAULT 0,
        coding_score NUMERIC(5,2) DEFAULT 0,
        mindset_score NUMERIC(5,2) DEFAULT 0,
        final_score NUMERIC(5,2) DEFAULT 0,
        recommendation TEXT,
        strengths TEXT,
        weaknesses TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );`
    ];

    try {
      for (const sql of schemas) {
        await this.query(sql);
      }
      console.log('[Db Engine Schema Init] Tables verified or created successfully.');

      // Seed core assessment if it does not exist
      const checkAsm = await this.query(`SELECT id FROM assessments WHERE id = 'asm-1';`);
      if (checkAsm.rowCount === 0) {
        console.log('[Db Engine Schema Init] Seeding default SE entrance test blueprint.');
        await this.query(`
          INSERT INTO assessments (id, title, description, assessment_type, duration_minutes, total_marks)
          VALUES (
            'asm-1', 
            'Q3 Software Engineering Cohort Entrance Test', 
            'Aptitude, DSA, Web Foundations, and standard coding execution challenges.',
            'Full-stack',
            90,
            100
          );
        `);

        // We can load key seed questions corresponding to the frontend default questions
        const seedQuestions = [
          {
            id: 'apt-1',
            text: 'A train 120m long passes a telegraph post in 6 seconds. Find the speed of the train in km/h.',
            type: 'aptitude_mcq',
            options: ['36 km/h', '54 km/h', '72 km/h', '90 km/h'],
            ans: '72 km/h'
          },
          {
            id: 'apt-2',
            text: 'If 12 men can build a wall in 20 days, how many men will be required to build the same wall in 15 days?',
            type: 'aptitude_mcq',
            options: ['15 men', '16 men', '18 men', '24 men'],
            ans: '16 men'
          },
          {
            id: 'prog-1',
            text: 'Which of the following describes the OOP concept "Polymorphism"?',
            type: 'technical_mcq',
            options: [
              'Hiding internal implementation details',
              'Creating a child class from a parent class',
              'The ability of different classes to respond to the same message in unique ways',
              'Restricting direct access to some of an object\'s components'
            ],
            ans: 'The ability of different classes to respond to the same message in unique ways'
          },
          {
            id: 'web-1',
            text: 'What is the purpose of React\'s "useEffect" cleanup function?',
            type: 'technical_mcq',
            options: [
              'To prevent the component from rendering again',
              'To unsubscribe or cancel asynchronous tasks/timers before the component unmounts or re-runs',
              'To force React to re-fetch state from the server',
              'To reset initial props parameters'
            ],
            ans: 'To unsubscribe or cancel asynchronous tasks/timers before the component unmounts or re-runs'
          },
          {
            id: 'dsa-1',
            text: 'What is the worst-case time complexity of inserting an element into a balanced Binary Search Tree (such as an AVL tree) of size N?',
            type: 'technical_mcq',
            options: ['O(1)', 'O(log N)', 'O(N)', 'O(N log N)'],
            ans: 'O(log N)'
          },
          {
            id: 'coding-1',
            text: 'Write a JavaScript function "fizzBuzz(n)" that returns an array of strings from 1 to n with appropriate Fizz/Buzz/FizzBuzz replacements.',
            type: 'coding',
            options: null,
            ans: null
          },
          {
            id: 'mindset-1',
            text: 'Describe a situation where a major bug reached production under your watch. What remediation steps and professional communications did you lead?',
            type: 'mindset',
            options: null,
            ans: null
          }
        ];

        for (const sq of seedQuestions) {
          await this.query(`
            INSERT INTO questions (id, assessment_id, question_text, question_type, options_json, correct_answer, marks)
            VALUES ($1, $2, $3, $4, $5, $6, $7);
          `, [
            sq.id,
            'asm-1',
            sq.text,
            sq.type,
            sq.options ? JSON.stringify(sq.options) : null,
            sq.ans,
            10
          ]);
        }
        console.log('[Db Engine Schema Init] Core questions table seeded.');
      }
    } catch (schemaErr: any) {
      console.error('[Db Engine Schema Init ERR]: Failed to assert schema structure:', schemaErr.message || schemaErr);
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
