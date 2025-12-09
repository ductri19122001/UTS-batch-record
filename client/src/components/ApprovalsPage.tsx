import { useState, useEffect } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { useNavigate, useLocation } from 'react-router-dom';

interface ApprovalRequest {
  id: string;
  batchRecordId: string;
  sectionId: string;
  requestType: string;
  reason: string;
  description?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
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

const ApprovalsPage = () => {
  const [approvalRequests, setApprovalRequests] = useState<ApprovalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    fetchApprovalRequests();
  }, []);

  // Refresh when returning from batch edit request page
  useEffect(() => {
    if (location.state?.refresh) {
      fetchApprovalRequests();
      // Clear the refresh flag
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, navigate, location.pathname]);

  const fetchApprovalRequests = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3001/api/approvalRequests');
      if (!response.ok) {
        throw new Error('Failed to fetch approval requests');
      }
      const data = await response.json();
      setApprovalRequests(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch approval requests');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-AU', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'PENDING': { label: 'Pending', className: 'bg-yellow-100 text-yellow-800' },
      'APPROVED': { label: 'Approved', className: 'bg-green-100 text-green-800' },
      'REJECTED': { label: 'Rejected', className: 'bg-red-100 text-red-800' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig['PENDING'];
    
    return (
      <Badge className={config.className}>
        {config.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p>Loading approval requests...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
              <p className="text-gray-600">{error}</p>
              <Button onClick={fetchApprovalRequests} className="mt-4">
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleViewRequest = (requestId: string) => {
    navigate(`/batch-edit-request?requestId=${requestId}`);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header Section */}
            <div className="flex justify-between items-center">
              <h1 className="text-3xl font-bold">Approval Requests</h1>
              <div className="flex gap-3">
                <Button variant="outline">
                  Filter
                </Button>
                <Button onClick={fetchApprovalRequests}>
                  Refresh
                </Button>
              </div>
            </div>

      {/* Table Section */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Request ID</TableHead>
                <TableHead>Batch Number</TableHead>
                <TableHead>Requested By</TableHead>
                <TableHead>Request Date</TableHead>
                <TableHead>Section</TableHead>
                <TableHead>Request Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    Loading approval requests...
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <div className="text-red-600">
                      <p className="font-medium">Error: {error}</p>
                      <Button onClick={fetchApprovalRequests} className="mt-2">
                        Try Again
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : approvalRequests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                    No approval requests found.
                  </TableCell>
                </TableRow>
              ) : (
                approvalRequests.map((request) => (
                  <TableRow key={request.id} className="hover:bg-gray-50">
                    <TableCell className="font-mono text-xs text-gray-600">
                      {request.id}
                    </TableCell>
                    <TableCell className="font-medium">
                      {request.batchRecord.batchNumber}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {request.requester.firstName} {request.requester.lastName}
                        </p>
                        <p className="text-sm text-gray-500">{request.requester.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {formatDate(request.requestedAt)}
                    </TableCell>
                    <TableCell>
                      {request.sectionId}
                    </TableCell>
                    <TableCell>
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                        {request.requestType}
                      </span>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(request.status)}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewRequest(request.id)}
                        >
                          View Request
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default ApprovalsPage;