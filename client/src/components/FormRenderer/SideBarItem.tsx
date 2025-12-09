import type { Section } from "@/lib/types";
import type { SectionStatus as SectionStatusType } from "./SectionStatusIndicator";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle, ChevronRight, Hourglass, PenSquare } from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarItemProps {
  section: Section;
  isActive: boolean;
  isCompleted: boolean;
  onClick: () => void;
  status?: SectionStatusType;
}

const SidebarItem = ({ section, isActive, isCompleted, onClick, status }: SidebarItemProps) => {
  const effectiveStatus: SectionStatusType = status ?? (isCompleted ? 'COMPLETED' : 'DRAFT');

  const { Icon, badgeClass, iconClass, label } = (() => {
    switch (effectiveStatus) {
      case 'COMPLETED':
        return {
          Icon: CheckCircle2,
          iconClass: 'text-green-600',
          badgeClass: 'bg-green-100 text-green-700',
          label: 'Complete'
        };
      case 'PENDING_APPROVAL':
        return {
          Icon: Hourglass,
          iconClass: 'text-amber-600',
          badgeClass: 'bg-amber-100 text-amber-700',
          label: 'Pending Approval'
        };
      case 'APPROVED_FOR_CHANGE':
        return {
          Icon: PenSquare,
          iconClass: 'text-blue-600',
          badgeClass: 'bg-blue-100 text-blue-700',
          label: 'Approved for Change'
        };
      case 'APPROVED':
        return {
          Icon: CheckCircle2,
          iconClass: 'text-green-700',
          badgeClass: 'bg-green-200 text-green-800',
          label: 'Approved'
        };
      default:
        return {
          Icon: Circle,
          iconClass: isActive ? 'text-primary' : 'text-muted-foreground',
          badgeClass: isActive ? 'bg-blue-100 text-blue-700' : 'bg-muted text-muted-foreground',
          label: isActive ? 'In Progress' : 'Draft'
        };
    }
  })();

  return (
    <Button
      onClick={onClick}
      variant={isActive ? "secondary" : "ghost"}
      className={cn(
        "w-full justify-start h-auto p-3 text-left font-normal",
        isActive && "bg-primary/10 border-l-2 border-primary rounded-l-none",
        !isActive && "hover:bg-muted/50"
      )}
    >
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center space-x-3">
          <Icon className={cn("h-5 w-5", iconClass)} />
          <div className="flex flex-col items-start space-y-1">
            <span
              className={cn(
                "font-medium text-sm",
                isActive ? "text-primary" : "text-foreground"
              )}
            >
              {section.title}
            </span>
            <div
              className={cn(
                "px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap",
                badgeClass
              )}
            >
              {label}
            </div>
            {section.subsections && section.subsections.length > 0 && (
              <span className="text-xs text-muted-foreground">
                {section.subsections.length} subsections
              </span>
            )}
          </div>
        </div>
        {isActive && <ChevronRight className="h-4 w-4 text-primary" />}
      </div>
    </Button>
  );
};

export default SidebarItem;
