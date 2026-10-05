import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    root: './',
    include: ['**/*.e2e-spec.ts'],
    // e2e tests run against the dev Postgres from docker compose: connection
    // settings come from .env (ConfigModule loads it), but always in the
    // separate test database created by docker/postgres/init
    env: {
      NODE_ENV: 'test',
      DB_NAME: 'edplatform_test',
    },
  },
});
