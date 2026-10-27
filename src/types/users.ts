import type { Role } from "./auth.js";

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  email_verified: boolean;
  /** ISO-8601 timestamp. */
  created_at: string;
}

export interface SetRoleInput {
  role: Role;
}
