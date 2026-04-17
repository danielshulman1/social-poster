import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * Global HTTP Exception Filter
 * Handles all HTTP exceptions and returns formatted error responses
 * Sanitizes error messages to prevent information leakage
 */
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();

    // Log error for debugging
    this.logger.error(
      `[${request.method}] ${request.url} - Status: ${status}`,
      exception.getResponse(),
    );

    // Prepare error response
    const errorResponse = {
      statusCode: status,
      message: this.getSafeErrorMessage(exception, status),
      timestamp: new Date().toISOString(),
      path: request.url,
      // Only include validation errors in development
      ...(process.env.NODE_ENV !== 'production' && {
        details: exception.getResponse(),
      }),
    };

    response.status(status).json(errorResponse);
  }

  /**
   * Get safe error message that doesn't leak information
   */
  private getSafeErrorMessage(exception: HttpException, status: number): string {
    const response = exception.getResponse();

    // Handle validation errors
    if (status === HttpStatus.BAD_REQUEST && typeof response === 'object') {
      const errorObject = response as any;
      if (errorObject.message && Array.isArray(errorObject.message)) {
        return 'Validation failed';
      }
      if (errorObject.message) {
        return errorObject.message;
      }
    }

    // Handle authentication errors
    if (status === HttpStatus.UNAUTHORIZED) {
      return 'Authentication required';
    }

    // Handle forbidden errors
    if (status === HttpStatus.FORBIDDEN) {
      return 'Access denied';
    }

    // Default messages
    return exception.message || 'An error occurred';
  }
}
