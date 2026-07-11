import { validateConfig } from './config.schema';

const validConfig = {
  DATABASE_URL: 'postgresql://postgres:password@localhost:5432/zivara',
  JWT_ACCESS_SECRET: 'a'.repeat(32),
  JWT_REFRESH_SECRET: 'b'.repeat(32),
  JWT_ACCESS_EXPIRY: '15m',
  JWT_REFRESH_EXPIRY: '30d',
  SMTP_HOST: 'smtp.example.com',
  SMTP_PORT: '587',
  SMTP_USER: 'user',
  SMTP_PASS: 'pass',
  AWS_S3_BUCKET: 'zivara-documents',
  AWS_REGION: 'me-south-1',
  NODE_ENV: 'test',
  API_PORT: '4000',
  WEB_PORT: '3000',
  NEXT_PUBLIC_API_URL: 'http://localhost:4000',
};

describe('validateConfig', () => {
  it('should return a valid config object when all variables are present', () => {
    const config = validateConfig(validConfig);
    expect(config.DATABASE_URL).toBe(validConfig.DATABASE_URL);
    expect(config.API_PORT).toBe(4000); // transformed to number
    expect(config.SMTP_PORT).toBe(587); // transformed to number
  });

  it('should throw a descriptive error when required variables are missing', () => {
    expect(() => validateConfig({})).toThrow(
      expect.objectContaining({
        message: expect.stringContaining('invalid environment variables') as string,
      }),
    );
  });

  it('should list ALL missing variables in a single error', () => {
    let errorMessage = '';
    try {
      validateConfig({});
    } catch (err) {
      errorMessage = (err as Error).message;
    }

    // Should mention several required variables in one error
    expect(errorMessage).toContain('DATABASE_URL');
    expect(errorMessage).toContain('JWT_ACCESS_SECRET');
    expect(errorMessage).toContain('NODE_ENV');
  });

  it('should fail fast with a descriptive error for invalid NODE_ENV', () => {
    expect(() =>
      validateConfig({ ...validConfig, NODE_ENV: 'invalid_env' }),
    ).toThrow(expect.objectContaining({ message: expect.stringContaining('NODE_ENV') as string }));
  });

  it('should transform API_PORT string to number', () => {
    const config = validateConfig(validConfig);
    expect(typeof config.API_PORT).toBe('number');
  });
});
