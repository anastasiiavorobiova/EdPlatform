import { VersioningType, type INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { EnvironmentVariables } from '@/config/env.validation.js';

/** Global route prefix of every endpoint. */
export const API_PREFIX = 'api';
/** API version of controllers that do not declare their own. */
export const API_DEFAULT_VERSION = '1';
/** Path of the Swagger UI; the OpenAPI JSON is served at the same path with a `-json` suffix. */
export const SWAGGER_PATH = `${API_PREFIX}/docs`;

/**
 * Applies app-level settings that modules cannot declare: prefix, URI versioning and Swagger.
 * Shared by main.ts and e2e tests, so both expose the same routes.
 */
export function setupApp(app: INestApplication): void {
  app.setGlobalPrefix(API_PREFIX);
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: API_DEFAULT_VERSION,
  });

  const config =
    app.get<ConfigService<EnvironmentVariables, true>>(ConfigService);
  if (config.get('SWAGGER_ENABLED', { infer: true })) {
    setupSwagger(app);
  }
}

/** Builds the OpenAPI document from controllers and DTOs and serves it as UI and JSON. */
function setupSwagger(app: INestApplication): void {
  const document = SwaggerModule.createDocument(
    app,
    new DocumentBuilder()
      .setTitle('EdPlatform API')
      .setDescription('REST API of the EdPlatform learning platform')
      .setVersion(API_DEFAULT_VERSION)
      .build(),
  );
  SwaggerModule.setup(SWAGGER_PATH, app, document);
}
