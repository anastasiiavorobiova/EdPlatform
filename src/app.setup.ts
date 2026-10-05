import type { INestApplication } from '@nestjs/common';

export const API_PREFIX = 'api';

// App-level settings that cannot be declared in a module. Shared by main.ts
// and e2e tests, so tests hit the same routes as the running app.
export function setupApp(app: INestApplication): void {
  app.setGlobalPrefix(API_PREFIX);
}
