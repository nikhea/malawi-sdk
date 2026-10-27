import { MalawiStoreError } from "../errors.js";
import type { HttpClient } from "../http.js";
import type {
  AuthStatusResponse,
  LoginInput,
  PasswordResetInput,
  RegisterInput,
  TokenPair,
  VerifyEmailInput,
} from "../types/index.js";

/** Register, login, session rotation, verification, and password reset. */
export class AuthResource {
  constructor(private readonly http: HttpClient) {}

  async register(input: RegisterInput): Promise<TokenPair> {
    const pair = await this.http.request<TokenPair>("POST", "/auth/register", {
      body: input,
      skipAuth: true,
      retry: false,
    });
    this.http.setTokenPair(pair);
    return pair;
  }

  async login(input: LoginInput): Promise<TokenPair> {
    const pair = await this.http.request<TokenPair>("POST", "/auth/login", {
      body: input,
      skipAuth: true,
      retry: false,
    });
    this.http.setTokenPair(pair);
    return pair;
  }

  /**
   * Rotates the refresh token into a fresh pair and stores it.
   * Omit the argument to use the token held by the client.
   */
  async refresh(refreshToken?: string): Promise<TokenPair> {
    const token = refreshToken ?? this.http.getRefreshToken();
    if (!token) {
      throw new MalawiStoreError({
        code: "VALIDATION_ERROR",
        message: "A refresh token is required",
      });
    }

    const pair = await this.http.request<TokenPair>("POST", "/auth/refresh", {
      body: { refresh_token: token },
      skipAuth: true,
      skipAutoRefresh: true,
      retry: false,
    });
    this.http.setTokenPair(pair);
    return pair;
  }

  /**
   * Revokes one refresh token. Local tokens are cleared even when the
   * server call fails.
   */
  async logout(refreshToken?: string): Promise<void> {
    const token = refreshToken ?? this.http.getRefreshToken();
    try {
      if (token) {
        await this.http.request<void>("POST", "/auth/logout", {
          body: { refresh_token: token },
          skipAuth: true,
          skipAutoRefresh: true,
          retry: false,
        });
      }
    } finally {
      this.http.clearTokens();
    }
  }

  /** Resends the email-verification OTP. Always succeeds (no enumeration). */
  async requestEmailVerification(email: string): Promise<AuthStatusResponse> {
    return this.http.request<AuthStatusResponse>(
      "POST",
      "/auth/verify-email/request",
      { body: { email }, skipAuth: true, retry: false },
    );
  }

  async verifyEmail(input: VerifyEmailInput): Promise<AuthStatusResponse> {
    return this.http.request<AuthStatusResponse>("POST", "/auth/verify-email", {
      body: input,
      skipAuth: true,
      retry: false,
    });
  }

  /** Sends a password-reset link. Always succeeds (no enumeration). */
  async requestPasswordReset(email: string): Promise<AuthStatusResponse> {
    return this.http.request<AuthStatusResponse>(
      "POST",
      "/auth/password/forgot",
      { body: { email }, skipAuth: true, retry: false },
    );
  }

  /** Consumes the reset token, sets the password, and revokes sessions. */
  async resetPassword(input: PasswordResetInput): Promise<AuthStatusResponse> {
    const result = await this.http.request<AuthStatusResponse>(
      "POST",
      "/auth/password/reset",
      { body: input, skipAuth: true, retry: false },
    );
    this.http.clearTokens();
    return result;
  }
}
