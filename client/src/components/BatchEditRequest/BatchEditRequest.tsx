import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";
import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import axios from "axios";
import { useAuth0 } from '@auth0/auth0-react';
import ElectronicSignatureDialog from "../FormRenderer/ElectronicSignatureDialog";

interface ApprovalRequestData {
  id: string;
  batchRecordId: string;
  sectionId: string;
  requestType: string;
  reason: string;
  description?: string;
  existingData?: any;
  proposedData?: any;
  status: string;
  requestedBy: string;
  requestedAt: string;
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

const BatchEditRequest = () => {
  const [searchParams] = useSearchParams();
  const requestId = searchParams.get('requestId');
  const { user, getAccessTokenSilently } = useAuth0();
  const [approvalRequest, setApprovalRequest] = useState<ApprovalRequestData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [status, setStatus] = useState<"Pending" | "Rejected" | "Approved">("Pending");
  const [isApproveOpen, setIsApproveOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [approveReason, setApproveReason] = useState("");
  const [approveError, setApproveError] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [rejectError, setRejectError] = useState("");
  const [showSignatureDialog, setShowSignatureDialog] = useState(false);
  const [signatureDialogState, setSignatureDialogState] = useState<{
    entityType: string;
    entityId: string;
    canonicalPayload: Record<string, unknown>;
    batchRecordId?: string;
    sectionRecordId?: string;
    sectionTitle?: string;
    onSigned: (signatureId: string) => Promise<void>;
  } | null>(null);

  const serverPath = import.meta.env.VITE_API_SERVER_URL as string;

  // Fetch approval request data
  useEffect(() => {
    const fetchApprovalRequest = async () => {
      if (!requestId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        // Get token using Auth0Provider's default configuration (uses cached token)
        const token = await getAccessTokenSilently();

        const response = await axios.get(`${serverPath}/api/approvalRequests/${requestId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        setApprovalRequest(response.data);
        setStatus(response.data.status === 'PENDING' ? 'Pending' : response.data.status === 'APPROVED' ? 'Approved' : 'Rejected');
      } catch (err: any) {
        console.error('Error fetching approval request:', err);
        const errorMessage = err.response?.data?.error || err.message || 'Failed to load approval request';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchApprovalRequest();
    } else {
      setLoading(false);
      setError('User not authenticated');
    }
  }, [requestId, getAccessTokenSilently, serverPath, user]);

  const openReject = () => {
    setRejectError("");
    setIsRejectOpen(true);
  };

  const closeReject = () => {
    setIsRejectOpen(false);
    setRejectError("");
  };
  const submitReject = async () => {
    if (!rejectReason.trim()) {
      setRejectError("Please enter a rejection statement");
      return;
    }
    if (!approvalRequest || !user) {
      setRejectError("Missing required data");
      return;
    }

    try {
      setIsRejectOpen(false);
      setRejectError("");

      const token = await getAccessTokenSilently();

      // Call the reject API endpoint
      const response = await axios.post(
        `${serverPath}/api/approvalRequests/${approvalRequest.id}/reject`,
        {
          batchRecordId: approvalRequest.batchRecordId,
          sectionId: approvalRequest.sectionId,
          reviewedBy: user.sub,
          reviewComments: rejectReason.trim()
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.status === 200) {
        setRejectReason("");

        // Refresh the approval request data to get updated status
        const updatedResponse = await axios.get(`${serverPath}/api/approvalRequests/${approvalRequest.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setApprovalRequest(updatedResponse.data);
        setStatus(updatedResponse.data.status === 'PENDING' ? 'Pending' : updatedResponse.data.status === 'APPROVED' ? 'Approved' : 'Rejected');
      }
    } catch (err: any) {
      console.error('Error rejecting request:', err);
      setRejectError(err.response?.data?.error || 'Failed to reject request');
      setIsRejectOpen(true);
    }
  };

  const openApprove = () => { setApproveError(""); setIsApproveOpen(true); };
  const closeApprove = () => setIsApproveOpen(false);
  const confirmApprove = async () => {
    if (!approveReason.trim()) {
      setApproveError("Please enter an approval statement");
      return;
    }

    if (!approvalRequest || !user) {
      setApproveError("Missing required data");
      return;
    }

    setIsApproveOpen(false);
    setApproveError("");

    const canonicalPayload = {
      action: "APPROVE_CHANGE_REQUEST",
      entityType: "ApprovalRequest",
      entityId: approvalRequest.id,
      batchRecordId: approvalRequest.batchRecordId,
      sectionId: approvalRequest.sectionId,
    };

    setSignatureDialogState({
      entityType: "ApprovalRequest",
      entityId: approvalRequest.id,
      canonicalPayload,
      batchRecordId: approvalRequest.batchRecordId,
      sectionTitle: approvalRequest.sectionId,
      onSigned: async (signatureId: string) => {
        try {
          const token = await getAccessTokenSilently({
            authorizationParams: {
              scope: 'openid email profile',
              audience: import.meta.env.VITE_AUTH0_AUDIENCE
            }
          });

          const response = await axios.post(
            `${serverPath}/api/approvalRequests/${approvalRequest.id}/approve`,
            {
              batchRecordId: approvalRequest.batchRecordId,
              sectionId: approvalRequest.sectionId,
              signatureId,
              reviewedBy: user.sub,
              reviewComments: approveReason.trim()
            },
            {
              headers: { Authorization: `Bearer ${token}` }
            }
          );

          if (response.status === 200) {
            setApproveReason("");
            setApproveError("");

            const updatedResponse = await axios.get(`${serverPath}/api/approvalRequests/${approvalRequest.id}`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            setApprovalRequest(updatedResponse.data);
            setStatus(updatedResponse.data.status === 'PENDING' ? 'Pending' : updatedResponse.data.status === 'APPROVED' ? 'Approved' : 'Rejected');
          }
        } catch (err: any) {
          console.error('Error approving request:', err.response?.data ?? err);
          setApproveError(err.response?.data?.error || 'Failed to approve request');
          setIsApproveOpen(true);
        } finally {
          setShowSignatureDialog(false);
          setSignatureDialogState(null);
        }
      }
    });

    setShowSignatureDialog(true);
  };

  if (!requestId) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-600 mb-4">No Request Selected</h2>
              <p className="text-gray-600">
                Please select an approval request from the approvals page to view its details.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p>Loading approval request...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !approvalRequest) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
              <p className="text-gray-600">{error || 'Failed to load approval request'}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Helper function to deeply compare two values
  const deepEqual = (obj1: any, obj2: any): boolean => {
    if (obj1 === obj2) return true;
    if (obj1 == null || obj2 == null) return obj1 === obj2;
    if (typeof obj1 !== typeof obj2) return false;

    if (typeof obj1 === 'object') {
      const keys1 = Object.keys(obj1);
      const keys2 = Object.keys(obj2);
      if (keys1.length !== keys2.length) return false;

      for (const key of keys1) {
        if (!keys2.includes(key) || !deepEqual(obj1[key], obj2[key])) {
          return false;
        }
      }
      return true;
    }

    return obj1 === obj2;
  };

  // Helper function to check if two values are different
  const hasChanged = (key: string) => {
    if (!approvalRequest.existingData || !approvalRequest.proposedData) return false;
    const existingValue = approvalRequest.existingData[key];
    const proposedValue = approvalRequest.proposedData[key];

    // Handle missing keys as changes
    if (existingValue === undefined && proposedValue !== undefined) return true;
    if (existingValue !== undefined && proposedValue === undefined) return true;

    return !deepEqual(existingValue, proposedValue);
  };

  const normalizeRow = (row: any, index: number): Record<string, any> => {
    if (row == null) {
      return { [`row_${index}`]: '-' };
    }

    if (Array.isArray(row)) {
      const obj: Record<string, any> = {};
      row.forEach((value, idx) => {
        obj[`column_${idx + 1}`] = value;
      });
      return obj;
    }

    if (typeof row === 'object') {
      if (Array.isArray(row.columns)) {
        const obj: Record<string, any> = {};
        row.columns.forEach((column: any, idx: number) => {
          if (column && typeof column === 'object') {
            const key = column.id ?? column.label ?? `column_${idx + 1}`;
            const value = 'value' in column ? column.value : column.columnValue ?? column.data ?? '';
            obj[key] = value;
          }
        });
        return obj;
      }
      return row;
    }

    return { [`row_${index}`]: row };
  };

  const renderTable = (rows: any[]): React.ReactNode => {
    if (!rows || rows.length === 0) {
      return <span className="text-sm text-muted-foreground">No rows</span>;
    }

    const columnSet = new Set<string>();
    const normalizedRows = rows.map((row, idx) => normalizeRow(row, idx));

    normalizedRows.forEach((row) => {
      if (row && typeof row === 'object') {
        Object.keys(row).forEach((key) => columnSet.add(key));
      }
    });

    const columns = Array.from(columnSet);

    if (columns.length === 0) {
      return <span className="text-sm text-muted-foreground">No columns</span>;
    }

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full border text-xs">
          <thead>
            <tr>
              {columns.map((column) => (
                <th
                  key={column}
                  className="border px-2 py-1 text-left bg-gray-100 font-semibold text-gray-700"
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {normalizedRows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {columns.map((column) => (
                  <td key={column} className="border px-2 py-1 align-top">
                    {renderValue(row?.[column])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderValue = (value: any): React.ReactNode => {
    if (value === null || value === undefined) {
      return <span className="block text-right text-muted-foreground">-</span>;
    }

    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      return <span className="block text-right">{String(value)}</span>;
    }

    if (Array.isArray(value)) {
      if (value.length === 0) {
        return <span className="block text-right text-muted-foreground">[]</span>;
      }

      const items = value.map((item, index) => (
        <div key={index} className="rounded border border-gray-200 bg-gray-50 px-2 py-1 text-left text-xs">
          {renderValue(item)}
        </div>
      ));

      return <div className="space-y-2">{items}</div>;
    }

    if (typeof value === 'object') {
      if (value.rows && Array.isArray(value.rows)) {
        return renderTable(value.rows);
      }

      if (value.table && value.table.rows && Array.isArray(value.table.rows)) {
        return renderTable(value.table.rows);
      }

      if (value.data && value.data.rows && Array.isArray(value.data.rows)) {
        return renderTable(value.data.rows);
      }

      const keys = Object.keys(value);
      if (keys.length === 0) {
        return <span className="block text-right text-muted-foreground">{'{}'}</span>;
      }

      if (Array.isArray(value.columns)) {
        return renderTable([value]);
      }

      return (
        <pre className="whitespace-pre-wrap break-words text-left text-xs bg-gray-50 border border-gray-200 rounded px-2 py-1">
          {JSON.stringify(value, null, 2)}
        </pre>
      );
    }

    return <span className="block text-right">{String(value)}</span>;
  };

  // Helper function to get all keys from both datasets, handling nested structures
  const getAllKeys = (): string[] => {
    const existingKeys = approvalRequest.existingData ? Object.keys(approvalRequest.existingData) : [];
    const proposedKeys = approvalRequest.proposedData ? Object.keys(approvalRequest.proposedData) : [];
    return Array.from(new Set([...existingKeys, ...proposedKeys])).sort();
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-AU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const hasExistingData =
    Boolean(
      approvalRequest.existingData &&
      Object.keys(approvalRequest.existingData).length > 0
    );

  const hasProposedData =
    Boolean(
      approvalRequest.proposedData &&
      Object.keys(approvalRequest.proposedData).length > 0
    );

  return (
    <div className="p-6 space-y-6">
      {signatureDialogState && user?.sub && (
        <ElectronicSignatureDialog
          open={showSignatureDialog}
          onOpenChange={(open) => {
            setShowSignatureDialog(open);
            if (!open) {
              setSignatureDialogState(null);
            }
          }}
          userId={user.sub}
          entityType={signatureDialogState.entityType}
          entityId={signatureDialogState.entityId}
          canonicalPayload={signatureDialogState.canonicalPayload}
          batchRecordId={signatureDialogState.batchRecordId}
          sectionTitle={signatureDialogState.sectionTitle}
          onSigned={signatureDialogState.onSigned}
        />
      )}
      <Card>
        {/* Card header with title */}
        <CardHeader>
          <CardTitle className="text-3xl font-bold">Batch Edit Request</CardTitle>
        </CardHeader>

        <CardContent>
          {/* Top info row */}
          <div className="grid grid-cols-4 gap-4 items-center border-b pb-4 mb-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Batch Number</p>
              <p className="font-semibold">{approvalRequest.batchRecord.batchNumber}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Requested By</p>
              <p className="font-semibold">
                {approvalRequest.requester.firstName} {approvalRequest.requester.lastName}
              </p>
              <p className="text-xs text-muted-foreground">{approvalRequest.requester.email}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Request Date</p>
              <p className="font-semibold">{formatDate(approvalRequest.requestedAt)}</p>
            </div>
            <div className="text-right">
              {status === "Pending" && (
                <span className="px-3 py-1 rounded-md text-sm font-medium bg-yellow-200 text-yellow-800">Pending</span>
              )}
              {status === "Rejected" && (
                <div className="flex flex-col items-end space-y-1">
                  <span className="px-3 py-1 rounded-md text-sm font-medium bg-red-200 text-red-800">Rejected</span>
                  {approvalRequest.reviewedAt && (
                    <span className="text-xs text-muted-foreground">Rejected on {formatDate(approvalRequest.reviewedAt)}</span>
                  )}
                </div>
              )}
              {status === "Approved" && (
                <div className="flex flex-col items-end space-y-1">
                  <span className="px-3 py-1 rounded-md text-sm font-medium bg-green-200 text-green-800">Approved</span>
                  {approvalRequest.reviewedAt && (
                    <span className="text-xs text-muted-foreground">Approved on {formatDate(approvalRequest.reviewedAt)}</span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Two-column comparison */}
          {hasExistingData ? (
            <div className="grid grid-cols-2 gap-6">
              {/* Original data */}
              <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                <h2 className="text-lg font-semibold mb-6 text-gray-900">Original Batch Data</h2>
                <dl className="space-y-1">
                  {getAllKeys().map((key) => {
                    const value = approvalRequest.existingData?.[key];
                    const displayValue = renderValue(value);

                    return (
                      <div key={key} className="flex justify-between items-start py-2 border-b border-gray-100">
                        <dt className="text-sm text-gray-600 font-medium flex-shrink-0 mr-4">{key}</dt>
                        <dd className="font-semibold text-gray-900 break-words flex-1">{displayValue}</dd>
                      </div>
                    );
                  })}
                </dl>
              </div>

              {/* Requested changes */}
              <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                <h2 className="text-lg font-semibold mb-6 text-gray-900">Requested Changes</h2>
                <dl className="space-y-1">
                  {getAllKeys().map((key) => {
                    const value = approvalRequest.proposedData?.[key];
                    const displayValue = renderValue(value);
                    const changed = hasChanged(key);

                    return (
                      <div
                        key={key}
                        className={`flex justify-between items-start py-2 border-b border-gray-100 ${changed ? 'bg-blue-50 rounded-md px-3 border border-blue-200 my-1' : ''}`}
                      >
                        <dt className={`text-sm font-medium flex-shrink-0 mr-4 ${changed ? 'text-blue-700' : 'text-gray-600'}`}>
                          {key}
                        </dt>
                        <dd className={`font-semibold break-words flex-1 ${changed ? 'text-blue-700 font-bold' : 'text-gray-900'}`}>
                          {displayValue}
                        </dd>
                      </div>
                    );
                  })}
                </dl>
              </div>
            </div>
          ) : hasProposedData ? (
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <h2 className="text-lg font-semibold mb-6 text-gray-900">Section Data</h2>
              <dl className="space-y-1">
                {Object.keys(approvalRequest.proposedData ?? {}).map((key) => {
                  const value = approvalRequest.proposedData?.[key];
                  const displayValue = renderValue(value);

                  return (
                    <div key={key} className="flex justify-between items-start py-2 border-b border-gray-100">
                      <dt className="text-sm text-gray-600 font-medium flex-shrink-0 mr-4">{key}</dt>
                      <dd className="font-semibold text-gray-900 break-words flex-1">{displayValue}</dd>
                    </div>
                  );
                })}
              </dl>
            </div>
          ) : (
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <h2 className="text-lg font-semibold mb-2 text-gray-900">Section Data</h2>
              <p className="text-sm text-muted-foreground">
                No data provided with this request.
              </p>
            </div>
          )}

          {/* Reason for Change Request */}
          <div className="mt-6 p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">Reason for Change Request</h3>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
              <p className="text-sm text-gray-700 leading-relaxed">
                {approvalRequest.reason}
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="mt-6 flex space-x-3">
            <Button
              className="bg-blue-600 hover:bg-blue-700"
              onClick={openApprove}
              disabled={status !== "Pending"}
            >
              Approve
            </Button>
            <Button
              variant="outline"
              onClick={openReject}
              disabled={status !== "Pending"}
            >
              Reject
            </Button>
          </div>

          {isRejectOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              <div className="absolute inset-0 bg-black/50" onClick={closeReject} />
              <div className="relative z-10 w-full max-w-lg rounded-lg bg-white p-6 shadow-lg">
                <h3 className="mb-4 text-lg font-semibold">Please state the reason for rejection</h3>
                <div className="mb-4 space-y-2">
                  <Label htmlFor="reject-reason">Reason</Label>
                  <textarea
                    id="reject-reason"
                    className="w-full min-h-[120px] rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Enter your reason here"
                  />
                  {rejectError && (
                    <p className="text-sm text-red-600">{rejectError}</p>
                  )}
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={closeReject}>Cancel</Button>
                  <Button className="bg-blue-600 hover:bg-blue-700" onClick={submitReject}>Send Response</Button>
                </div>
              </div>
            </div>
          )}
          {isApproveOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              <div className="absolute inset-0 bg-black/50" onClick={closeApprove} />
              <div className="relative z-10 w-full max-w-lg rounded-lg bg-white p-6 shadow-lg">
                <h3 className="mb-4 text-lg font-semibold">Please state the reason for approval</h3>
                <div className="mb-4 space-y-2">
                  <Label htmlFor="approve-reason">Reason</Label>
                  <textarea
                    id="approve-reason"
                    className="w-full min-h-[120px] rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    value={approveReason}
                    onChange={(e) => setApproveReason(e.target.value)}
                    placeholder="Enter your reason here"
                  />
                  {approveError && (
                    <p className="text-sm text-red-600">{approveError}</p>
                  )}
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={closeApprove}>Cancel</Button>
                  <Button className="bg-green-600 hover:bg-green-700" onClick={confirmApprove}>Send Approval</Button>
                </div>
              </div>
            </div>
          )}

        </CardContent>
      </Card>

      {/* Request History */}
      {approvalRequest && approvalRequest.status !== 'PENDING' && (approvalRequest.reviewComments || approvalRequest.reviewedAt) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Request History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {approvalRequest.reviewedAt && (
                <Card className="border-l-4" style={{ borderLeftColor: approvalRequest.status === 'APPROVED' ? '#10b981' : approvalRequest.status === 'REJECTED' ? '#ef4444' : '#6b7280' }}>
                  <CardContent className="pt-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={approvalRequest.status === 'APPROVED' ? 'default' : approvalRequest.status === 'REJECTED' ? 'destructive' : 'secondary'}
                          className={approvalRequest.status === 'APPROVED' ? 'bg-green-600' : approvalRequest.status === 'REJECTED' ? 'bg-red-600' : ''}
                        >
                          {approvalRequest.status === 'APPROVED' ? 'Approved' : approvalRequest.status === 'REJECTED' ? 'Rejected' : 'Pending'}
                        </Badge>
                        {approvalRequest.status !== 'PENDING' && (
                          <Badge variant="outline">
                            {approvalRequest.status === 'APPROVED' ? 'Current' : 'Final'}
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                      <div>
                        <span className="font-medium text-muted-foreground">Reviewed:</span>
                        <div>{formatDate(approvalRequest.reviewedAt)}</div>
                        {approvalRequest.reviewer && (
                          <div className="text-muted-foreground">
                            by {approvalRequest.reviewer.firstName} {approvalRequest.reviewer.lastName}
                          </div>
                        )}
                      </div>
                      <div>
                        <span className="font-medium text-muted-foreground">Requested:</span>
                        <div>{formatDate(approvalRequest.requestedAt)}</div>
                        {approvalRequest.requester && (
                          <div className="text-muted-foreground">
                            by {approvalRequest.requester.firstName} {approvalRequest.requester.lastName}
                          </div>
                        )}
                      </div>
                    </div>

                    {approvalRequest.reviewComments && (
                      <div className="mt-3 pt-3 border-t">
                        <span className="font-medium text-muted-foreground text-sm">Review Comments:</span>
                        <p className="text-sm text-gray-700 mt-2">{approvalRequest.reviewComments}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BatchEditRequest;
