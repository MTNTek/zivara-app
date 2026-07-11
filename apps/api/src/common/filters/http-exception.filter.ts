import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

interface ErrorResponse {
  statusCode: number;
  error: string;
  message: string;
  requestId: string;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request & { requestId?: string; user?: { id?: string } }>();
    const response = ctx.getResponse<Response>();

    const requestId: string = request.requestId ?? crypto.randomUUID();
    const userId: string | undefined = request.user?.id;
    const method: string = request.method;
    const path: string = request.url;

    let statusCode: number;
    let message: string;
    let error: string;
    let stack: string | undefined;

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      stack = exception.stack;

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
        error = exception.name;
      } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const resp = exceptionResponse as Record<string, unknown>;
        message = Array.isArray(resp['message'])
          ? (resp['message'] as string[]).join('; ')
          : String(resp['message'] ?? exception.message);
        error = String(resp['error'] ?? exception.name);
      } else {
        message = exception.message;
        error = exception.name;
      }
    } else if (exception instanceof Error) {
      statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'Internal server error';
      error = 'InternalServerError';
      stack = exception.stack;
    } else {
      statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'Internal server error';
      error = 'InternalServerError';
    }

    // Log full context server-side (including stack trace) — never exposed to client
    this.logger.error(
      `[${requestId}] ${method} ${path} → ${statusCode} | userId=${userId ?? 'unauthenticated'} | ${message}`,
      stack,
    );

    const body: ErrorResponse = {
      statusCode,
      error,
      message,
      requestId,
    };

    response.status(statusCode).json(body);
  }
}
