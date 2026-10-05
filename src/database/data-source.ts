import { existsSync } from 'node:fs';
import { DataSource } from 'typeorm';
import { validateEnv } from '@/config/env.validation.js';
import { buildDataSourceOptions } from '@/database/database.options.js';

if (existsSync('.env')) {
  process.loadEnvFile('.env');
}
/** Environment validated with the same rules as the app, so migrations fail fast on bad config. */
const env = validateEnv(process.env);

/** DataSource used by the TypeORM CLI to run and generate migrations. */
export default new DataSource({
  ...buildDataSourceOptions(env),
  entities: [`${import.meta.dirname}/../**/*.entity.js`],
  migrations: [`${import.meta.dirname}/migrations/*.js`],
});
