import type { DataSourceOptions } from 'typeorm';
import type { EnvironmentVariables } from '@/config/env.validation.js';

/** Subset of EnvironmentVariables needed to connect to PostgreSQL. */
export type DatabaseEnv = Pick<
  EnvironmentVariables,
  'DB_HOST' | 'DB_PORT' | 'DB_USER' | 'DB_PASSWORD' | 'DB_NAME' | 'DB_LOGGING'
>;

/**
 * Builds TypeORM connection options shared by the Nest app and the migrations CLI.
 * Schema sync is disabled: the schema changes only through migrations.
 */
export function buildDataSourceOptions(env: DatabaseEnv): DataSourceOptions {
  return {
    type: 'postgres',
    host: env.DB_HOST,
    port: env.DB_PORT,
    username: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    synchronize: false,
    logging: env.DB_LOGGING,
  };
}
