import { NextResponse } from "next/server";

export type ApiSuccess<T> = {
  success: true;
  data: T;
  message?: string;
};

export type ApiFailure = {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
};

export function apiSuccess<T>(data: T, init?: { message?: string; status?: number }) {
  return NextResponse.json<ApiSuccess<T>>(
    {
      success: true,
      data,
      ...(init?.message ? { message: init.message } : {}),
    },
    { status: init?.status ?? 200 },
  );
}

export function apiMessage(message: string, status = 200) {
  return NextResponse.json<ApiSuccess<null>>(
    {
      success: true,
      data: null,
      message,
    },
    { status },
  );
}

export function apiError(message: string, status = 400, errors?: Record<string, string[]>) {
  return NextResponse.json<ApiFailure>(
    {
      success: false,
      message,
      ...(errors ? { errors } : {}),
    },
    { status },
  );
}

export function apiRateLimit(message: string, retryAfterSeconds: number) {
  return NextResponse.json<ApiFailure>(
    {
      success: false,
      message,
    },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfterSeconds),
      },
    },
  );
}



