import { Response } from 'express';

/**
 * Standardized API response format
 */
export class ApiResponse {
  /**
   * Success response
   */
  static success<T>(res: Response, data: T, message: string = 'Success', statusCode: number = 200) {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
    });
  }

  /**
   * Created response (201)
   */
  static created<T>(res: Response, data: T, message: string = 'Created successfully') {
    return res.status(201).json({
      success: true,
      message,
      data,
    });
  }

  /**
   * Error response
   */
  static error(res: Response, message: string, statusCode: number = 400, errors?: unknown) {
    return res.status(statusCode).json({
      success: false,
      message,
      ...(errors && { errors }),
    });
  }

  /**
   * Not found response (404)
   */
  static notFound(res: Response, message: string = 'Resource not found') {
    return res.status(404).json({
      success: false,
      message,
    });
  }

  /**
   * Unauthorized response (401)
   */
  static unauthorized(res: Response, message: string = 'Unauthorized') {
    return res.status(401).json({
      success: false,
      message,
    });
  }

  /**
   * Forbidden response (403)
   */
  static forbidden(res: Response, message: string = 'Forbidden') {
    return res.status(403).json({
      success: false,
      message,
    });
  }

  /**
   * Paginated response
   */
  static paginated<T>(
    res: Response,
    data: T[],
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    },
    message: string = 'Success'
  ) {
    return res.status(200).json({
      success: true,
      message,
      data,
      pagination,
    });
  }
}

/**
 * Custom application error with status code
 */
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 400) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}
