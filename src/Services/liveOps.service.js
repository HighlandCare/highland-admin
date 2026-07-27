import { Action } from "../config/action";

function getAuthHeaders() {
  const authToken =
    typeof window !== "undefined" ? JSON.parse(localStorage.getItem("token")) : null;
  return {
    Authorization: `Bearer ${authToken}`,
  };
}

export async function getLiveOpsSnapshot(params = {}) {
  const response = await Action.get("admin/live-ops/snapshot", {
    params,
    headers: getAuthHeaders(),
  });
  return response.data;
}
