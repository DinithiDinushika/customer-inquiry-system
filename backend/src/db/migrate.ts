import fs from 'fs';
import path from 'path';
import { pool } from '../config/db.js';

interface MigrationFile {
  version: string;
  description: string;
  script: string;
  filePath: string;
}

const ensureDatabaseExists = async (): Promise<void> => {
  const dbName = process.env.DB_NAME || 'customer_inquiries';
  // Use a temporary client connected to default 'postgres' database to check/create target database
  const tempPool = new (await import('pg')).default.Pool({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: 'postgres',
  });

  try {
    const res = await tempPool.query('SELECT 1 FROM pg_database WHERE datname = $1', [dbName]);
    if (res.rowCount === 0) {
      console.log(`Database '${dbName}' does not exist. Creating it now...`);
      await tempPool.query(`CREATE DATABASE "${dbName}";`);
      console.log(`Database '${dbName}' created successfully.`);
    }
  } catch (err: any) {
    // If user doesn't have permission to query pg_database or create, log and continue
    console.warn(`Database check notice: ${err.message}`);
  } finally {
    await tempPool.end();
  }
};

const ensureFlywayTableExists = async (client: any): Promise<void> => {
  await client.query(`
    CREATE TABLE IF NOT EXISTS flyway_schema_history (
      installed_rank INT NOT NULL PRIMARY KEY,
      version VARCHAR(50),
      description VARCHAR(200) NOT NULL,
      type VARCHAR(20) NOT NULL,
      script VARCHAR(1000) NOT NULL,
      checksum INT,
      installed_by VARCHAR(100) NOT NULL,
      installed_on TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      execution_time INT NOT NULL,
      success BOOLEAN NOT NULL
    );
  `);
};

export const runMigrations = async (): Promise<void> => {
  console.log('--- Starting Database Migrations (Flyway Compatible) ---');
  await ensureDatabaseExists();

  const client = await pool.connect();
  try {
    await ensureFlywayTableExists(client);

    const historyRes = await client.query('SELECT version FROM flyway_schema_history WHERE success = true');
    const appliedVersions = new Set<string>(historyRes.rows.map((r: any) => r.version));

    const migrationsDir = path.resolve(process.cwd(), 'migrations');
    if (!fs.existsSync(migrationsDir)) {
      throw new Error(`Migrations directory not found at: ${migrationsDir}`);
    }

    const files = fs.readdirSync(migrationsDir)
      .filter((file) => /^V\d+__.*\.sql$/.test(file))
      .sort((a, b) => {
        const numA = parseInt(a.slice(1).split('__')[0], 10);
        const numB = parseInt(b.slice(1).split('__')[0], 10);
        return numA - numB;
      });

    console.log(`Discovered ${files.length} migration file(s) in migrations/`);

    let rankCounter = historyRes.rowCount ? historyRes.rowCount + 1 : 1;

    for (const file of files) {
      const match = file.match(/^V(\d+)__(.*)\.sql$/);
      if (!match) continue;

      const version = match[1];
      const description = match[2].replace(/_/g, ' ');

      if (appliedVersions.has(version)) {
        console.log(`[Flyway] V${version} (${description}) already applied. Skipping.`);
        continue;
      }

      console.log(`[Flyway] Applying V${version} (${description})...`);
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf-8');

      const startTime = Date.now();
      await client.query('BEGIN');
      try {
        await client.query(sql);

        const executionTime = Date.now() - startTime;
        await client.query(
          `INSERT INTO flyway_schema_history 
          (installed_rank, version, description, type, script, checksum, installed_by, execution_time, success)
          VALUES ($1, $2, $3, 'SQL', $4, NULL, current_user, $5, true)`,
          [rankCounter++, version, description, file, executionTime]
        );

        await client.query('COMMIT');
        console.log(`[Flyway] V${version} applied successfully in ${executionTime}ms.`);
      } catch (err) {
        await client.query('ROLLBACK');
        console.error(`[Flyway] Failed applying V${version} (${file}):`, err);
        throw err;
      }
    }

    console.log('--- All Database Migrations are Up to Date! ---\n');
  } finally {
    client.release();
  }
};

// If executed directly from command line (e.g. tsx src/db/migrate.ts)
if (process.argv[1] && process.argv[1].endsWith('migrate.ts')) {
  runMigrations()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Migration failed:', err);
      process.exit(1);
    });
}
