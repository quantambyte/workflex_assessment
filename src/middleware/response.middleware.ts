import { Request, Response, NextFunction } from "express";

export interface AppResponse<T = any> {
  data?: T;
  error?: string;
  errors?: string[];
  statusCode: number;
}

declare global {
  namespace Express {
    interface Response {
      success<T>(data: T, statusCode?: number): void;
      error(error: string | string[], statusCode?: number): void;
    }
  }
}

export const responseMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  res.success = <T>(data: T, statusCode: number = 200) => {
    let translatedData = data;

    const translate = (msg: string) =>
      (req as any).t ? (req as any).t(msg) : msg;

    // If data is a string, translate it
    if (typeof data === "string") {
      translatedData = translate(data) as any;
    }
    // If data is an object with a message property, translate the message
    else if (data && typeof data === "object" && (data as any).message) {
      (translatedData as any).message = translate((data as any).message);
    }

    const response: AppResponse<T> = {
      data: translatedData,
      statusCode,
    };
    res.status(statusCode).json(response);
  };

  res.error = (error: string | string[], statusCode: number = 500) => {
    const response: AppResponse = {
      statusCode,
    };

    const translate = (msg: string) =>
      (req as any).t ? (req as any).t(msg) : msg;

    if (Array.isArray(error)) {
      response.errors = error.map(translate);
    } else {
      response.error = translate(error);
    }

    res.status(statusCode).json(response);
  };

  next();
};

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  console.error(err);
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  const translate = (msg: string) =>
    (req as any).t ? (req as any).t(msg) : msg;

  const response: AppResponse = {
    statusCode,
  };

  if (err.errors && Array.isArray(err.errors)) {
    response.errors = err.errors.map(translate);
  } else {
    response.error = translate(message);
  }

  res.status(statusCode).json(response);
};
