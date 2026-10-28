import type { Role } from "./auth.js";
import type { PageParams, Paginated } from "./common.js";

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

export type UserSort =
  | "newest"
  | "oldest"
  | "name_asc"
  | "name_desc"
  | "email_asc"
  | "email_desc";

/** Admin user directory filters. */
export interface ListUsersParams extends PageParams {
  /** Case-insensitive substring over email or name. */
  q?: string;
  role?: Role;
  email_verified?: boolean;
  /** RFC3339 timestamp or YYYY-MM-DD. */
  created_after?: string;
  created_before?: string;
  sort?: UserSort;
}

export type UserListResponse = Paginated<User>;
