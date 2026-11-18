import type { HttpClient } from "../http.js";
import type { DashboardOverview } from "../types/index.js";

/** Admin-only reporting reads, mounted under `/admin/dashboard`. */
export class DashboardResource {
  constructor(private readonly http: HttpClient) {}

  /** Whole-store snapshot: catalog, customers, orders, stock and demand. */
  overview(): Promise<DashboardOverview> {
    return this.http.request<DashboardOverview>("GET", "/admin/dashboard/overview");
  }
}
