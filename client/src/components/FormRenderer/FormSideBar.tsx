import type { Section } from "@/lib/types";
import type { SectionStatus as SectionStatusType } from "./SectionStatusIndicator";
import SideBarItem from "./SideBarItem";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

type SectionStatusEntry = {
  status: SectionStatusType;
  lockedAt?: string;
  lockedBy?: string;
};

interface FormSidebarProps {
  sections: Section[];
  activeSectionId: string;
  completedSections: Set<string>;
  onSectionSelect: (sectionId: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  sectionStatuses: Record<string, SectionStatusEntry>;
}

const FormSidebar = ({
  sections,
  activeSectionId,
  completedSections,
  onSectionSelect,
  isCollapsed,
  onToggleCollapse,
  sectionStatuses,
}: FormSidebarProps) => {
  const progressPercentage =
    (completedSections.size / (sections?.length || 1)) * 100;

  return (
    <div
      className={`${isCollapsed ? "w-16" : "w-80"} bg-background border-r h-full flex flex-col transition-all duration-300`}
    >
      {/* Toggle button */}
      <div className="p-2 border-b">
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleCollapse}
          className="w-full justify-center"
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {!isCollapsed && (
        <Card className="border-0 rounded-none flex-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-xl">Form Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Progress indicator */}
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium">
                  {completedSections.size} of {sections?.length} complete
                </span>
              </div>
              {/* Custom progress bar */}
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>

            {/* Custom separator */}
            <div className="h-px bg-border" />

            {/* Section list */}
            <div className="space-y-1">
              <h3 className="font-medium text-sm text-muted-foreground mb-3 uppercase tracking-wider">
                Sections
              </h3>
              {/* Custom scroll area */}
              <div className="max-h-[calc(100vh-300px)] overflow-y-auto">
                <nav className="space-y-1 pr-2">
                  {sections?.map((section) => (
                    <SideBarItem
                      key={section.id}
                      section={section}
                      isActive={section.id === activeSectionId}
                      isCompleted={completedSections.has(section.id)}
                      status={sectionStatuses[section.id]?.status}
                      onClick={() => onSectionSelect(section.id)}
                    />
                  ))}
                </nav>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {isCollapsed && (
        <div className="flex-1 flex flex-col items-center py-4 space-y-2">
          {sections?.map((section) => {
            const status = sectionStatuses[section.id]?.status?.toString();
            let colorClass: string;

            switch (status) {
              case 'COMPLETED':
                colorClass = 'bg-green-500';
                break;
              case 'PENDING_APPROVAL':
                colorClass = 'bg-amber-500';
                break;
              case 'APPROVED_FOR_CHANGE':
                colorClass = 'bg-blue-500';
                break;
              case 'APPROVED':
                colorClass = 'bg-emerald-500';
                break;
              default:
                colorClass = section.id === activeSectionId ? 'bg-primary' : 'bg-muted-foreground';
                break;
            }

            return (
              <Button
                key={section.id}
                variant={section.id === activeSectionId ? "secondary" : "ghost"}
                size="sm"
                onClick={() => onSectionSelect(section.id)}
                className="w-10 h-10 p-0 relative"
              >
                <div className={`w-3 h-3 rounded-full ${colorClass}`} />
              </Button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default FormSidebar;
