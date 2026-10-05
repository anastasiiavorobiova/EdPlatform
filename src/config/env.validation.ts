import Joi from 'joi';

/** Supported values of NODE_ENV. */
export enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

/** Validated and type-converted environment variables available through ConfigService. */
export interface EnvironmentVariables {
  /** Runtime environment; defaults to development. */
  NODE_ENV: Environment;
  /** HTTP port of the API; defaults to 3000. */
  PORT: number;
  /** PostgreSQL host. */
  DB_HOST: string;
  /** PostgreSQL port. */
  DB_PORT: number;
  /** PostgreSQL user. */
  DB_USER: string;
  /** PostgreSQL password. */
  DB_PASSWORD: string;
  /** PostgreSQL database name. */
  DB_NAME: string;
  /** Logs every SQL query executed by TypeORM; defaults to false. */
  DB_LOGGING: boolean;
  /** Serves Swagger UI and OpenAPI JSON; defaults to false in production and true elsewhere. */
  SWAGGER_ENABLED: boolean;
}

/** Joi schema of EnvironmentVariables; strict mode makes the compiler require a schema of the matching kind for every key. */
const envSchema = Joi.object<EnvironmentVariables, true>({
  NODE_ENV: Joi.string()
    .valid(...Object.values(Environment))
    .default(Environment.Development),
  PORT: Joi.number().port().default(3000),
  DB_HOST: Joi.string().trim().required(),
  DB_PORT: Joi.number().port().required(),
  DB_USER: Joi.string().trim().required(),
  DB_PASSWORD: Joi.string().trim().required(),
  DB_NAME: Joi.string().trim().required(),
  DB_LOGGING: Joi.boolean().default(false),
  SWAGGER_ENABLED: Joi.boolean().default(
    (env: Partial<EnvironmentVariables>) =>
      env.NODE_ENV !== Environment.Production,
  ),
});

/**
 * Validates and converts raw environment variables, throwing one error that lists every problem.
 * Used by ConfigModule and the migrations CLI.
 */
export function validateEnv(
  config: Record<string, unknown>,
): EnvironmentVariables {
  const { error, value } = envSchema.validate(config, {
    abortEarly: false,
    stripUnknown: true,
    errors: { wrap: { label: false } },
  });

  if (error) {
    const details = error.details
      .map((detail) => `✖ ${detail.message}\n  → at ${detail.path.join('.')}`)
      .join('\n');
    throw new Error(`Invalid environment configuration:\n${details}`);
  }

  return value;
}
