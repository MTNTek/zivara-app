import { HttpException, HttpStatus } from '@nestjs/common';
import { HttpExceptionFilter } from './http-exception.filter';

interface MockResponse {
  status: jest.Mock;
  json: jest.Mock;
}

interface MockRequest {
  method: string;
  url: string;
  requestId?: string;
  user?: { id?: string };
}

describe('HttpExceptionFilter', () => {
  let filter: HttpExceptionFilter;
  let mockResponse: MockResponse;
  let mockRequest: MockRequest;
  let mockHost: {
    switchToHttp: () => {
      getRequest: () => MockRequest;
      getResponse: () => MockResponse;
    };
  };

  beforeEach(() => {
    filter = new HttpExceptionFilter();

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockRequest = {
      method: 'GET',
      url: '/test',
    };

    mockHost = {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
        getResponse: () => mockResponse,
      }),
    };
  });

  it('should return standard error shape without stack traces', () => {
    const exception = new HttpException('Forbidden', HttpStatus.FORBIDDEN);

    filter.catch(exception, mockHost as Parameters<typeof filter.catch>[1]);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.FORBIDDEN);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.FORBIDDEN,
        error: expect.any(String) as string,
        message: expect.any(String) as string,
        requestId: expect.any(String) as string,
      }),
    );

    // Stack trace must NOT be in the response
    const jsonArg = (mockResponse.json as jest.Mock).mock.calls[0][0] as Record<string, unknown>;
    expect(jsonArg).not.toHaveProperty('stack');
    expect(JSON.stringify(jsonArg)).not.toContain('at ');
  });

  it('should return 500 for unexpected errors without exposing internals', () => {
    const exception = new Error('DB connection failed — internal details');

    filter.catch(exception, mockHost as Parameters<typeof filter.catch>[1]);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);

    const jsonArg = (mockResponse.json as jest.Mock).mock.calls[0][0] as Record<string, unknown>;
    expect(jsonArg['message']).toBe('Internal server error');
    expect(JSON.stringify(jsonArg)).not.toContain('DB connection failed');
    expect(jsonArg).not.toHaveProperty('stack');
  });

  it('should include requestId in every response', () => {
    const exception = new HttpException('Not Found', HttpStatus.NOT_FOUND);

    filter.catch(exception, mockHost as Parameters<typeof filter.catch>[1]);

    const jsonArg = (mockResponse.json as jest.Mock).mock.calls[0][0] as Record<string, unknown>;
    expect(jsonArg['requestId']).toBeDefined();
    expect(typeof jsonArg['requestId']).toBe('string');
    expect((jsonArg['requestId'] as string).length).toBeGreaterThan(0);
  });
});
