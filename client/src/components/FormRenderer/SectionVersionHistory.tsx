import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import axios from 'axios'
import type { Section } from '@/lib/types'
import {
  buildVersionHistoryPayload,
  type VersionHistoryApprovalRequest,
} from "./historyDataHelpers";

interface ApprovalRequest extends VersionHistoryApprovalRequest {
  id: string
  requestType: string
  status: string
  sectionId: string
  requestedAt: string
  reviewedAt: string | null
  reviewComments: string | null
  existingData: any
  proposedData: any
  requester: {
    name: string
    email: string
  } | null
  reviewer: {
    name: string
    email: string
  } | null
}

interface VersionHistoryItem {
  id: string
  version: number
  isActive: boolean
  sectionData: any
  completedAt: string | null
  updatedAt: string | null
  completedBy: {
    name: string
    email: string
  } | null
  updatedBy: {
    name: string
    email: string
  } | null
  approvalRequestId: string | null
  approvalRequests: ApprovalRequest[]
}

interface SectionVersionHistoryProps {
  batchRecordId: string
  sectionId: string
  isOpen: boolean
  onClose: () => void
  onViewVersion: (section: Section, versionId: string, versionData: any, approvalRequest?: ApprovalRequest | null) => void
  sectionOptions: Section[]
}

const SectionVersionHistory = ({
  batchRecordId,
  sectionId,
  isOpen,
  onClose,
  onViewVersion,
  sectionOptions
}: SectionVersionHistoryProps) => {
  const [history, setHistory] = useState<VersionHistoryItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedSectionId, setSelectedSectionId] = useState<string>(sectionId)
  const serverPath = import.meta.env.VITE_API_SERVER_URL as string

  useEffect(() => {
    setSelectedSectionId(sectionId)
  }, [sectionId])

  useEffect(() => {
    if (isOpen && selectedSectionId) {
      void fetchHistory(selectedSectionId)
    }
  }, [isOpen, selectedSectionId, batchRecordId])

  useEffect(() => {
    if (!sectionOptions.find(option => option.id === selectedSectionId)) {
      const fallbackId = sectionOptions[0]?.id
      if (fallbackId) {
        setSelectedSectionId(fallbackId)
      }
    }
  }, [sectionOptions, selectedSectionId])

  useEffect(() => {
    if (!isOpen) {
      setHistory([])
      setError(null)
    }
  }, [isOpen])

  const fetchHistory = async (targetSectionId: string) => {
    setLoading(true)
    setError(null)
    setHistory([])
    try {
      const response = await axios.get(
        `${serverPath}/api/batchRecordSections/${batchRecordId}/section/${targetSectionId}/history`
      )
      const historyItems: VersionHistoryItem[] = Array.isArray(response.data) ? response.data : []
      setHistory(historyItems)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch version history')
      setHistory([])
    } finally {
      setLoading(false)
    }
  }

  const selectedSection = useMemo(() => {
    const map = new Map(sectionOptions.map((section) => [section.id, section]))
    return map.get(selectedSectionId) ?? null
  }, [sectionOptions, selectedSectionId])

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = date.getFullYear()
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    const seconds = String(date.getSeconds()).padStart(2, '0')
    return `${day}/${month}/${year}, ${hours}:${minutes}:${seconds}`
  }

  if (!isOpen) return null

  if (sectionOptions.length === 0) {
    return (
      <Card className="mt-4 max-w-4xl">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Version History</CardTitle>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground">
            No subsections available for version history.
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!selectedSection) return null

  return (
    <Card className="mt-4 max-w-4xl">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <CardTitle>
              Version History - {selectedSection.title ?? selectedSection.id}
            </CardTitle>
            <select
              className="border rounded-md px-3 py-1 text-sm"
              value={selectedSectionId}
              onChange={(event) => {
                const nextId = event.target.value
                setSelectedSectionId(nextId)
              }}
            >
              {sectionOptions.map((sectionOption) => (
                <option key={sectionOption.id} value={sectionOption.id}>
                  {sectionOption.title ?? sectionOption.id}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading && (
          <div className="flex justify-center p-4">
            <div className="text-muted-foreground">Loading version history...</div>
          </div>
        )}

        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded p-4 mb-4">
            <div className="text-destructive font-medium">Error</div>
            <div className="text-sm text-destructive/80">{error}</div>
          </div>
        )}

        {!loading && !error && history.length === 0 && (
          <div className="text-center p-4 text-muted-foreground">
            No version history found for this section.
          </div>
        )}

        {!loading && !error && history.length > 0 && (
          <div className="space-y-4">
            {history.map((version) => (
              <Card key={version.id} className="border-l-4 border-l-blue-500">
                <CardContent className="pt-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      <Badge variant={version.isActive ? "default" : "secondary"}>
                        Version {version.version}
                      </Badge>
                      {version.isActive && (
                        <Badge variant="outline" className="text-green-600 border-green-600">
                          Current
                        </Badge>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // Find the most relevant approval request (prefer approved, then rejected, then pending)
                        const approvedRequest = version.approvalRequests?.find(ar => ar.status === 'APPROVED')
                        const rejectedRequest = version.approvalRequests?.find(ar => ar.status === 'REJECTED')
                        const mostRelevantRequest = approvedRequest || rejectedRequest || version.approvalRequests?.[0] || null
                        const dataForPreview = buildVersionHistoryPayload(version.sectionData, mostRelevantRequest)
                        console.log(
                          'Viewing version',
                          version.id,
                          'Section',
                          selectedSection.title ?? selectedSection.id,
                          dataForPreview
                        )
                        onViewVersion(selectedSection, version.id, version.sectionData, mostRelevantRequest)
                      }}
                    >
                      View Data
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                    <div>
                      <span className="font-medium text-muted-foreground">Created:</span>
                      <div>{formatDate(version.completedAt)}</div>
                      {version.completedBy && (
                        <div className="text-muted-foreground">
                          by {version.completedBy.name}
                        </div>
                      )}
                    </div>
                    <div>
                      <span className="font-medium text-muted-foreground">Last Modified:</span>
                      <div>{formatDate(version.updatedAt)}</div>
                      {version.updatedBy && (
                        <div className="text-muted-foreground">
                          by {version.updatedBy.name}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Approval Requests */}
                  {version.approvalRequests && version.approvalRequests.length > 0 && (
                    <div className="mt-4 pt-4 border-t">
                      <span className="font-medium text-muted-foreground text-sm mb-2 block">Approval Requests:</span>
                      <div className="space-y-2">
                        {version.approvalRequests.map((ar) => (
                          <Card key={ar.id} className="border-l-4" style={{
                            borderLeftColor: ar.status === 'APPROVED' ? '#10b981' : ar.status === 'REJECTED' ? '#ef4444' : '#fbbf24'
                          }}>
                            <CardContent className="pt-4">
                              <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-2">
                                  <Badge
                                    variant={ar.status === 'APPROVED' ? 'default' : ar.status === 'REJECTED' ? 'destructive' : 'secondary'}
                                    className={ar.status === 'APPROVED' ? 'bg-green-600' : ar.status === 'REJECTED' ? 'bg-red-600' : 'bg-yellow-600'}
                                  >
                                    {ar.status}
                                  </Badge>
                                  <Badge variant="outline" className="text-xs">
                                    {ar.requestType}
                                  </Badge>
                                </div>
                                <span className="text-xs text-muted-foreground">ID: {ar.id}</span>
                              </div>
                              <div className="text-xs text-muted-foreground space-y-1 mt-2">
                                <div>Requested: {formatDate(ar.requestedAt)} by {ar.requester?.name || 'N/A'}</div>
                                {ar.reviewedAt && (
                                  <div>Reviewed: {formatDate(ar.reviewedAt)} by {ar.reviewer?.name || 'N/A'}</div>
                                )}
                                {ar.reviewComments && (
                                  <div className="mt-2 text-sm text-gray-700">Comments: {ar.reviewComments}</div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default SectionVersionHistory
