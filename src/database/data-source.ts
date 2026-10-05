import { existsSync } from 'node:fs';
import { DataSource } from 'typeorm';
import { validateEnv } from '@/config/env.validation.js';
import { buildDataSourceOptions } from '@/database/database.options.js';

if (existsSync('.env')) {
  process.loadEnvFile('.env');
}
const env = validateEnv(process.env);

export default new DataSource({
  ...buildDataSourceOptions(env),
  entities: [`${import.meta.dirname}/../**/*.entity.js`],
  migrations: [`${import.meta.dirname}/migrations/*.js`],
});
