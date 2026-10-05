import Joi from 'joi';

export enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

export interface EnvironmentVariables {
  NODE_ENV: Environment;
  PORT: number;
  DB_HOST: string;
  DB_PORT: number;
  DB_USER: string;
  DB_PASSWORD: string;
  DB_NAME: string;
  DB_LOGGING: boolean;
}

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
});

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
