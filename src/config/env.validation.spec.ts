import { validateEnv } from '@/config/env.validation.js';

const validEnv = {
  DB_HOST: 'localhost',
  DB_PORT: '5432',
  DB_USER: 'postgres',
  DB_PASSWORD: 'secret',
  DB_NAME: 'edplatform',
};

describe('validateEnv', () => {
  it('parses a valid env and applies defaults', () => {
    expect(validateEnv(validEnv)).toEqual({
      ...validEnv,
      DB_PORT: 5432,
      NODE_ENV: 'development',
      PORT: 3000,
      DB_LOGGING: false,
      SWAGGER_ENABLED: true,
    });
  });

  it('disables Swagger by default only in production', () => {
    expect(validateEnv(validEnv).SWAGGER_ENABLED).toBe(true);
    expect(
      validateEnv({ ...validEnv, NODE_ENV: 'production' }).SWAGGER_ENABLED,
    ).toBe(false);
    expect(
      validateEnv({
        ...validEnv,
        NODE_ENV: 'production',
        SWAGGER_ENABLED: 'true',
      }).SWAGGER_ENABLED,
    ).toBe(true);
  });

  it('parses DB_LOGGING from "true"/"false" strings', () => {
    expect(validateEnv({ ...validEnv, DB_LOGGING: 'true' }).DB_LOGGING).toBe(
      true,
    );
    expect(validateEnv({ ...validEnv, DB_LOGGING: 'false' }).DB_LOGGING).toBe(
      false,
    );
  });

  it('rejects a DB_LOGGING value other than true/false', () => {
    expect(() => validateEnv({ ...validEnv, DB_LOGGING: 'yes' })).toThrow(
      /at DB_LOGGING/,
    );
  });

  it('lists every missing variable', () => {
    expect(() => validateEnv({})).toThrow(
      /DB_HOST[\s\S]*DB_PORT[\s\S]*DB_USER[\s\S]*DB_PASSWORD[\s\S]*DB_NAME/,
    );
  });

  it('rejects empty and whitespace-only values', () => {
    expect(() => validateEnv({ ...validEnv, DB_PASSWORD: '' })).toThrow(
      /at DB_PASSWORD/,
    );
    expect(() => validateEnv({ ...validEnv, DB_PASSWORD: '   ' })).toThrow(
      /at DB_PASSWORD/,
    );
  });

  it('drops unrelated variables from the validated config', () => {
    expect(validateEnv({ ...validEnv, PATH: '/usr/bin' })).not.toHaveProperty(
      'PATH',
    );
  });

  it('rejects an invalid port', () => {
    expect(() => validateEnv({ ...validEnv, PORT: 'abc' })).toThrow(/at PORT/);
    expect(() => validateEnv({ ...validEnv, DB_PORT: '70000' })).toThrow(
      /at DB_PORT/,
    );
  });

  it('rejects an unknown NODE_ENV', () => {
    expect(() => validateEnv({ ...validEnv, NODE_ENV: 'staging' })).toThrow(
      /at NODE_ENV/,
    );
  });
});
