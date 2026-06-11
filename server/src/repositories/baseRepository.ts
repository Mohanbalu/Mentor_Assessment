// server/src/repositories/baseRepository.ts - Enterprise Repository Abstraction Interface

import { dbEngine } from '../config/db';

export interface WriteOperationsRepository<T> {
  create(entity: Partial<T>): Promise<T>;
  update(id: string, entity: Partial<T>): Promise<T | null>;
  delete(id: string): Promise<boolean>;
}

export interface ReadOperationsRepository<T> {
  findById(id: string): Promise<T | null>;
  findAll(filters?: any): Promise<T[]>;
}

/**
 * Base database repository linking SQL operations to runtime interfaces
 */
export abstract class BaseRepository<T> implements WriteOperationsRepository<T>, ReadOperationsRepository<T> {
  protected tableName: string;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  async findById(id: string): Promise<T | null> {
    const queryStr = `SELECT * FROM ${this.tableName} WHERE id = $1 LIMIT 1;`;
    const result = await dbEngine.query<T>(queryStr, [id]);
    return result.rows.length > 0 ? result.rows[0] : null;
  }

  async findAll(filters: any = {}): Promise<T[]> {
    const keys = Object.keys(filters);
    if (keys.length === 0) {
      const queryStr = `SELECT * FROM ${this.tableName} ORDER BY created_at DESC;`;
      const result = await dbEngine.query<T>(queryStr);
      return result.rows;
    }

    const whereClauses = keys.map((key, i) => `${key} = $${i + 1}`).join(' AND ');
    const values = keys.map(key => filters[key]);
    const queryStr = `SELECT * FROM ${this.tableName} WHERE ${whereClauses} ORDER BY created_at DESC;`;
    
    const result = await dbEngine.query<T>(queryStr, values);
    return result.rows;
  }

  async create(entity: Partial<T>): Promise<T> {
    const keys = Object.keys(entity);
    const columns = keys.join(', ');
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
    const values = keys.map(key => (entity as any)[key]);

    const queryStr = `INSERT INTO ${this.tableName} (${columns}) VALUES (${placeholders}) RETURNING *;`;
    const result = await dbEngine.query<T>(queryStr, values);
    
    if (result.rows.length === 0) {
      throw new Error(`[Repository] Insertion failed inside table ${this.tableName}`);
    }
    return result.rows[0];
  }

  async update(id: string, entity: Partial<T>): Promise<T | null> {
    const keys = Object.keys(entity).filter(k => k !== 'id' && k !== 'created_at');
    if (keys.length === 0) return this.findById(id);

    const setClause = keys.map((key, i) => `${key} = $${i + 2}`).join(', ');
    const values = [id, ...keys.map(key => (entity as any)[key])];

    const queryStr = `UPDATE ${this.tableName} SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *;`;
    const result = await dbEngine.query<T>(queryStr, values);
    
    return result.rows.length > 0 ? result.rows[0] : null;
  }

  async delete(id: string): Promise<boolean> {
    const queryStr = `DELETE FROM ${this.tableName} WHERE id = $1;`;
    const result = await dbEngine.query(queryStr, [id]);
    return result.rowCount > 0;
  }
}
