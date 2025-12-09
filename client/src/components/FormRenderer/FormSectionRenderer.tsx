import FieldRenderer from "./FieldRenderer";
import type { Section, Field, ApprovalDialogState } from "@/lib/types";
import type { SectionStatus as SectionStatusValue } from "./SectionStatusIndicator";
import { useForm, type UseFormReturn } from 'react-hook-form'
import { Button } from "../ui/button";
import { Form } from "../ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { useEffect } from "react";
import type { TemplateRule } from '@/types/rules';

export interface FormSectionProps {
  section: Section;
  onSelectionSave: (sectionId: string, data: any, parentSectionId?: string) => void
  initialData?: Record<string, any>;
  parentSectionId?: string;
  readonly?: boolean;
  openApprovalDialog?: (dialogState: ApprovalDialogState) => void;
  isHistory: boolean;
  onFormRegister?: (sectionId: string, form: UseFormReturn<any>) => void;
  sectionStatuses?: Record<string, { status: SectionStatusValue; lockedAt?: string; lockedBy?: string }>;
  fieldValidationRules?: Record<string, TemplateRule[]>;
  sectionDependencyRules?: Record<string, TemplateRule[]>;
  allowEditRequests?: boolean;
  allowSave?: boolean;
  sectionDataMap?: Record<string, any>;
  renderSubsections?: boolean;
}
const FormSectionRenderer = (props: FormSectionProps) => {

  const form = useForm({
    defaultValues: props.initialData || {}
  });

  useEffect(() => {
    if (props.sectionDataMap && props.sectionDataMap[props.section.id]) {
      form.reset(props.sectionDataMap[props.section.id] ?? {})
    } else {
      form.reset(props.initialData || {})
    }
  }, [props.initialData, props.sectionDataMap, props.section.id, form])

  useEffect(() => {
    props.onFormRegister?.(props.section.id, form)
  }, [form, props.onFormRegister, props.section.id])

  const statusEntry = props.sectionStatuses?.[props.section.id]?.status;

  const computedReadonly = Boolean(
    props.readonly || statusEntry === 'COMPLETED' || statusEntry === 'PENDING_APPROVAL' || statusEntry === 'APPROVED'
  );
  const isPendingApproval = statusEntry === 'PENDING_APPROVAL';

  const onSubmit = (data: any) => {
    // Transform table fields back to {rows: [...]} format for consistency
    const transformedData = { ...data }

    props.section.fields?.forEach(field => {
      if (field.type === 'table' && Array.isArray(transformedData[field.name])) {
        transformedData[field.name] = {
          rows: transformedData[field.name]
        }
      }
    })

    if (props.allowSave === false) {
      console.warn(`Save suppressed for section ${props.section.id} due to read-only configuration`)
      return
    }
    props.onSelectionSave?.(props.section.id, transformedData, props.parentSectionId);
  };

  const subsections = Array.isArray(props.section.subsections) ? props.section.subsections : []
  const hasSubsections = subsections.length > 0
  const shouldRenderSubsections = hasSubsections && props.renderSubsections !== false

  return (
    <div className="space-y-6">
      {shouldRenderSubsections ? (
        <>
          {/* Section description */}
          <div className="mb-4">
            <p className="text-muted-foreground">
              This section contains {subsections.length} subsections.
              Complete each subsection below.
            </p>
          </div>

          {/* Subsection cards */}
          <div className="grid gap-10">
            {subsections.map((subsection: Section, index: number) => (
              <Card
                key={`${subsection.id}-${props.sectionStatuses?.[subsection.id] ?? "0"}`}
                className="min-w-0"
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center justify-between">
                    <span className="flex items-center gap-3">
                      <span className="bg-primary/10 text-primary w-8 h-8 rounded-full text-sm flex items-center justify-center font-medium">
                        {index + 1}
                      </span>
                      <span className="flex flex-col">
                        <span>{subsection.title}</span>
                      </span>
                    </span>
                    <div className="px-3 py-1 bg-muted rounded-full text-xs text-muted-foreground font-medium">
                      {subsection.fields?.length || 0} fields
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <FormSectionRenderer
                    section={subsection}
                    onSelectionSave={props.onSelectionSave}
                    parentSectionId={props.section.id}
                    initialData={
                      props.sectionDataMap?.[subsection.id] ??
                      props.initialData?.[subsection.id] ??
                      {}
                    }
                    readonly={
                      props.readonly ||
                      ['COMPLETED', 'APPROVED'].includes(
                        (props.sectionStatuses?.[props.section.id]?.status ?? '').toString().toUpperCase()
                      )
                    }
                    allowEditRequests={props.allowEditRequests}
                    openApprovalDialog={props.openApprovalDialog}
                    isHistory={props.isHistory}
                    onFormRegister={props.onFormRegister}
                    sectionStatuses={props.sectionStatuses}
                    allowSave={props.allowSave}
                    sectionDataMap={props.sectionDataMap}
                    renderSubsections={props.renderSubsections}
                  />
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      ) : (
        /* No subsections (or disabled), so render form elements */
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              {props.section.fields?.map((field: Field) => (
                <div key={field.name} className="p-4">
                  <FieldRenderer
                    field={field}
                    form={form}
                    readonly={computedReadonly}
                  />
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                {props.section.fields?.length || 0} fields in this section
              </p>
              {!props.isHistory && (
                computedReadonly ? (
                  isPendingApproval ? (
                    <span className="text-sm text-muted-foreground">
                      Approval request pending review
                    </span>
                  ) : props.allowEditRequests !== false ? (
                    <Button
                      size="sm"
                      type="button"
                      onClick={() => props.openApprovalDialog?.({
                        sectionId: props.section.id,
                        section: props.section,
                        currentValues: form.getValues(),
                        existingValues: props.initialData ?? {},
                        parentSectionId: props.parentSectionId
                      })}
                      className="px-6 bg-amber-600 hover:bg-amber-700"
                    >
                      Request Edit Access
                    </Button>
                  ) : null
                ) : props.allowSave !== false ? (
                  <Button size="sm" type="submit" className="px-6 bg-green-700">
                    Save Section
                  </Button>
                ) : null
              )}
            </div>
          </form>
        </Form>
      )}
    </div>
  )
}

export default FormSectionRenderer
