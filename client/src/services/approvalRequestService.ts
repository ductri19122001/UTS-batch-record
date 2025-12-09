const API_BASE_URL = 'http://localhost:3001/api';

export interface ApprovalRequest {
  id: string;
  batchRecordId: string;
  sectionId: string;
  parentSectionId?: string;
  requestType: string;
  reason: string;
  description?: string;
  existingData?: any;
  proposedData?: any;
  requestedBy: string;
  requestedAt: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reviewedBy?: string;
  reviewedAt?: string;
  reviewComments?: string;
  requester: {
    firstName: string;
    lastName: string;
    email: string;
  };
  reviewer?: {
    firstName: string;
    lastName: string;
    email: string;
  };
  batchRecord: {
    batchNumber: string;
    product: {
      productName: string;
      productCode: string;
    };
  };
}

export interface CreateApprovalRequestData {
  batchRecordId: string;
  sectionId: string;
  requestType: string;
  reason: string;
  description?: string;
  existingData?: any;
  proposedData?: any;
  parentSectionId?: string;
  userId: string;
}

export interface UpdateApprovalRequestStatusData {
  status: 'APPROVED' | 'REJECTED';
  reviewedBy: string;
  reviewComments?: string;
}

// Get all approval requests
export async function getAllApprovalRequests(): Promise<ApprovalRequest[]> {
  const response = await fetch(`${API_BASE_URL}/approvalRequests`);
  if (!response.ok) {
    throw new Error('Failed to fetch approval requests');
  }
  return response.json();
}

// Get approval request by ID
export async function getApprovalRequestById(requestId: string): Promise<ApprovalRequest> {
  const response = await fetch(`${API_BASE_URL}/approvalRequests/${requestId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch approval request');
  }
  return response.json();
}

// Get approval requests for a specific batch record
export async function getApprovalRequestsByBatch(batchRecordId: string): Promise<ApprovalRequest[]> {
  const response = await fetch(`${API_BASE_URL}/approvalRequests/batch/${batchRecordId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch approval requests for batch');
  }
  return response.json();
}

// Create a new approval request
export async function createApprovalRequest(data: CreateApprovalRequestData): Promise<ApprovalRequest> {
  const response = await fetch(`${API_BASE_URL}/approvalRequests`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    throw new Error('Failed to create approval request');
  }
  return response.json();
}

// Update approval request status
export async function updateApprovalRequestStatus(
  requestId: string, 
  data: UpdateApprovalRequestStatusData
): Promise<ApprovalRequest> {
  const response = await fetch(`${API_BASE_URL}/approvalRequests/${requestId}/status`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    throw new Error('Failed to update approval request status');
  }
  return response.json();
}
