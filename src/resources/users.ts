import type { HttpClient } from "../http.js";
import { segment } from "../path.js";
import type {
  ListUsersParams,
  SetRoleInput,
  User,
  UserListResponse,
} from "../types/index.js";

export class UsersResource {
  constructor(private readonly http: HttpClient) {}

  /** The caller's own account, read from the JWT. */
  me(): Promise<User> {
    return this.http.request<User>("GET", "/users/me");
  }

  get(id: string): Promise<User> {
    return this.http.request<User>("GET", `/users/${segment(id)}`);
  }

  /** Admin only. User directory without envelope metadata. */
  list(params: ListUsersParams = {}): Promise<User[]> {
    return this.http.request<User[]>("GET", "/admin/users", {
      query: {
        q: params.q,
        role: params.role,
        email_verified: params.email_verified,
        created_after: params.created_after,
        created_before: params.created_before,
        sort: params.sort,
        page: params.page,
        limit: params.limit,
        offset: params.offset,
      },
    });
  }

  /** Admin only. Same filters as `list`, plus `meta` paging counters. */
  listPage(params: ListUsersParams = {}): Promise<UserListResponse> {
    return this.http.request<UserListResponse>("GET", "/admin/users", {
      query: {
        q: params.q,
        role: params.role,
        email_verified: params.email_verified,
        created_after: params.created_after,
        created_before: params.created_before,
        sort: params.sort,
        page: params.page,
        limit: params.limit,
        offset: params.offset,
      },
      unwrap: false,
    });
  }

  /** Admin only. */
  setRole(id: string, input: SetRoleInput): Promise<User> {
    return this.http.request<User>("PATCH", `/admin/users/${segment(id)}/role`, {
      body: input,
    });
  }
}
