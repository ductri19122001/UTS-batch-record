export interface VersionHistoryApprovalRequest {
  status?: string | null;
  existingData?: unknown;
  proposedData?: unknown;
}

const isMeaningfulData = (data: unknown): boolean => {
  if (data === null || data === undefined) return false;
  if (Array.isArray(data)) return data.length > 0;
  if (typeof data === "object") return Object.keys(data as Record<string, unknown>).length > 0;
  return true;
};

export const cloneHistoryData = <T>(data: T): T => {
  return JSON.parse(JSON.stringify(data ?? {})) as T;
};

export const buildVersionHistoryPayload = <T>(
  baseData: T,
  approvalRequest?: VersionHistoryApprovalRequest | null
): T => {
  const baseHasContent = isMeaningfulData(baseData);

  if (!approvalRequest) {
    return cloneHistoryData(baseData);
  }

  const status = approvalRequest.status?.toString().toUpperCase();

  if (baseHasContent) {
    return cloneHistoryData(baseData);
  }

  if (status === "REJECTED" && approvalRequest.existingData) {
    return cloneHistoryData(approvalRequest.existingData) as T;
  }

  if (status === "APPROVED" && approvalRequest.proposedData) {
    return cloneHistoryData(approvalRequest.proposedData) as T;
  }

  return cloneHistoryData(baseData);
};
