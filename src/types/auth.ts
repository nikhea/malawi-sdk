import type { StatusResponse } from "./common.js";

export type Role = "admin" | "customer";

/** Issued by register, login, and refresh. */
export interface TokenPair {
  token: string;
  /** ISO-8601 access-token expiry. */
  expires_at: string;
  refresh_token: string;
  /** ISO-8601 refresh-token expiry. */
  refresh_expires_at: string;
  user_id: string;
  email: string;
  name: string;
  role: Role;
}

export interface RegisterInput {
  email: string;
  /** Optional on the wire; send it so receipts have a name. */
  name?: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface VerifyEmailInput {
  email: string;
  /** Six-digit OTP from the verification email. */
  code: string;
}

export interface PasswordResetInput {
  /** Single-use token from the reset email. */
  token: string;
  new_password: string;
}

export type AuthStatusResponse = StatusResponse;
