import { Badge } from '../ui/badge'
import { CheckCircle, Hourglass, Notebook, PenSquare, HelpCircle } from 'lucide-react'

export type SectionStatus = 'DRAFT' | 'COMPLETED' | 'PENDING_APPROVAL' | 'APPROVED_FOR_CHANGE' | 'APPROVED'

interface SectionStatusIndicatorProps {
  status: SectionStatus
  lockedAt?: string | null
  lockedBy?: string | null
  version?: number
}

const SectionStatusIndicator = ({
  status,
  lockedAt,
  lockedBy,
  version
}: SectionStatusIndicatorProps) => {
  const getStatusConfig = (status: SectionStatus) => {
    switch (status) {
      case 'DRAFT':
        return {
          label: 'Draft',
          variant: 'secondary' as const,
          icon: Notebook,
          description: 'Section is being edited'
        }
      case 'COMPLETED':
        return {
          label: 'Completed',
          variant: 'default' as const,
          icon: CheckCircle,
          description: 'Section is completed and locked'
        }
      case 'PENDING_APPROVAL':
        return {
          label: 'Pending Approval',
          variant: 'secondary' as const,
          icon: Hourglass,
          description: 'Approval request submitted, awaiting review'
        }
      case 'APPROVED_FOR_CHANGE':
        return {
          label: 'Approved for Change',
          variant: 'secondary' as const,
          icon: PenSquare,
          description: 'Section unlocked for edits'
        }
      case 'APPROVED':
        return {
          label: 'Approved',
          variant: 'default' as const,
          icon: CheckCircle,
          description: 'Section has been approved - for changes submit an approval request'
        }
      default:
        return {
          label: 'Unknown',
          variant: 'secondary' as const,
          icon: HelpCircle,
          description: 'Unknown status'
        }
    }
  }

  const config = getStatusConfig(status)
  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  return (
    <div className="inline-flex items-center gap-2">
      <Badge
        variant={config.variant}
      >
        <config.icon className="mr-1 h-3.5 w-3.5" />
        {config.label}
      </Badge>
      {typeof version === 'number' && (
        <Badge variant="outline" className="text-xs">
          v{version}
        </Badge>
      )}

      {(status === 'COMPLETED' && lockedAt) && (
        <div className="text-xs text-muted-foreground">
          Locked {formatDateTime(lockedAt)}
          {lockedBy && (
            <span className="ml-1">by {lockedBy}</span>
          )}
        </div>
      )}
    </div>
  )
}

export default SectionStatusIndicator
