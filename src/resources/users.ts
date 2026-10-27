import type { HttpClient } from "../http.js";
import { segment } from "../path.js";
import type { SetRoleInput, User } from "../types/index.js";

export class UsersResource {
  constructor(private readonly http: HttpClient) {}

  /** The caller's own account, read from the JWT. */
  me(): Promise<User> {
    return this.http.request<User>("GET", "/users/me");
  }

  get(id: string): Promise<User> {
    return this.http.request<User>("GET", `/users/${segment(id)}`);
  }

  /** Admin only. */
  setRole(id: string, input: SetRoleInput): Promise<User> {
    return this.http.request<User>("PATCH", `/admin/users/${segment(id)}/role`, {
      body: input,
    });
  }
}
