import { NextResponse } from "next/server";

export type ApiErrorCode =
  | "BAD_REQUEST"
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "CONFLICT"
  | "INTERNAL_ERROR";

export type ApiErrorBody = {
  data: null;
  error: {
    code: ApiErrorCode;
    message: string;
    issues?: unknown;
  };
};

export type ApiSuccessBody<T> = {
  data: T;
  error: null;
};

export class AppError extends Error {
  public readonly status: number;
  public readonly code: ApiErrorCode;
  public readonly issues?: unknown;

  constructor(
    message: string,
    status = 500,
    code: ApiErrorCode = "INTERNAL_ERROR",
    issues?: unknown,
  ) {
    super(message);
    this.status = status;
    this.code = code;
    this.issues = issues;
  }
}

export class ValidationError extends AppError {
  constructor(message = "Invalid request", issues?: unknown) {
    super(message, 400, "VALIDATION_ERROR", issues);
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Not found") {
    super(message, 404, "NOT_FOUND");
  }
}

export class ConflictError extends AppError {
  constructor(message = "Conflict") {
    super(message, 409, "CONFLICT");
  }
}

function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

export function errorResponse(error: unknown): NextResponse<ApiErrorBody> {
  if (isAppError(error)) {
    return NextResponse.json(
      {
        data: null,
        error: {
          code: error.code,
          message: error.message,
          ...(error.issues === undefined ? {} : { issues: error.issues }),
        },
      },
      { status: error.status },
    );
  }

  return NextResponse.json(
    {
      data: null,
      error: {
        code: "INTERNAL_ERROR",
        message: "An unexpected error occurred",
      },
    },
    { status: 500 },
  );
}

export function successResponse<T>(
  data: T,
  status = 200,
): NextResponse<ApiSuccessBody<T>> {
  return NextResponse.json({ data, error: null }, { status });
}
