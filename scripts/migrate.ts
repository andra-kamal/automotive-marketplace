import { Kysely, MysqlDialect } from 'kysely';
import { createPool } from 'mysql2';
import * as dotenv from 'dotenv';
import * as initialSchema from '../src/database/migrations/001_initial_schema.js';

dotenv.config();

async function migrateToLatest() {
  const db = new Kysely<any>({
    dialect: new MysqlDialect({
      pool: createPool({
        host: process.env.MYSQLHOST || process.env.DB_HOST || '127.0.0.1',
        user: process.env.MYSQLUSER || process.env.DB_USER || 'user',
        password: process.env.MYSQLPASSWORD || process.env.DB_PASSWORD || 'password',
        database: process.env.MYSQLDATABASE || process.env.DB_NAME || 'automotive_marketplace',
        port: Number(process.env.MYSQLPORT || process.env.DB_PORT) || 3306,
        connectionLimit: 1,
      }),
    }),
  });

  try {
    console.log('Running migration...');
    await initialSchema.up(db);
    console.log('Migration executed successfully!');
  } catch (error) {
    console.error('Failed to migrate', error);
    process.exit(1);
  }

  await db.destroy();
}

migrateToLatest();
