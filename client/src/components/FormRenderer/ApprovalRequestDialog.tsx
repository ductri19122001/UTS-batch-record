import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import axios from "axios";
import type { Section } from "@/lib/types";
import FormSectionRenderer from "./FormSectionRenderer";
import type { UseFormReturn } from "react-hook-form";
import { useAuth0 } from "@auth0/auth0-react";

interface ApprovalRequestDialogProps {
  batchRecordId: string;
  sectionId: string;
  sectionTitle: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  formValues: Record<string, any>;
  sectionDefinition?: Section | null;
  parentSectionId?: string;
  existingValues: Record<string, any>;
}

const ApprovalRequestDialog = ({
  batchRecordId,
  sectionId,
  sectionTitle,
  isOpen,
  onClose,
  onSuccess,
  formValues,
  sectionDefinition,
  parentSectionId,
  existingValues,
}: ApprovalRequestDialogProps) => {
  const [requestType, setRequestType] = useState<string>("DEVIATION");
  const [reason, setReason] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const serverPath = import.meta.env.VITE_API_SERVER_URL as string;
  const { isAuthenticated, user, getAccessTokenSilently } = useAuth0();
  const formRegistry = useRef<Record<string, UseFormReturn<any>>>({});

  const handleFormRegister = (sectionId: string, form: UseFormReturn<any>) => {
    formRegistry.current[sectionId] = form;
  };

  const collectSectionValues = (section: Section): Record<string, any> => {
    const form = formRegistry.current[section.id];
    const raw = form?.getValues() ?? {};
    const result: Record<string, any> = {};

    section.fields?.forEach((field) => {
      const value = raw[field.name];
      if (value !== undefined) {
        result[field.name] =
          field.type === "table" && Array.isArray(value)
            ? { rows: value }
            : value;
      }
    });

    section.subsections?.forEach((sub) => {
      const child = collectSectionValues(sub);
      if (Object.keys(child).length) result[sub.id] = child;
    });

    return result;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!reason.trim()) {
      setError("Reason is required");
      return;
    }

    if (!sectionDefinition) {
      setError("Section definition unavailable");
      return;
    }

    if (!user || !isAuthenticated) {
      setError("User not authenticated. Please try logging in again");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const proposedData = collectSectionValues(sectionDefinition);
      const userId = user.sub;
      const token = await getAccessTokenSilently({
        authorizationParams: {
          audience: import.meta.env.VITE_AUTH0_AUDIENCE,
          scope: "openid profile email",
        },
      });

      const payload = {
        batchRecordId,
        sectionId,
        requestType,
        reason: reason.trim(),
        description: description.trim() || null,
        parentSectionId: parentSectionId ?? null,
        existingData: existingValues,
        proposedData,
        userId: userId,
      };

      const response = await axios.post(
        `${serverPath}/api/approvalRequests`,
        payload,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.status === 201) {
        onSuccess();
        handleClose();
      }
    } catch (err: any) {
      setError(
        err.response?.data?.error || "Failed to submit approval request"
      );
      console.error("Error submitting approval request:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setRequestType("DEVIATION");
    setReason("");
    setDescription("");
    setError(null);
    formRegistry.current = {};
    onClose();
  };

  if (!isOpen || !sectionDefinition) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ">
      <Card className="w-full max-w-5xl max-h-5/6 mx-4 overflow-scroll">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-xl font-bold">
              Request Approval for Changes
            </CardTitle>
            <Button variant="outline" onClick={handleClose}>
              ×
            </Button>
          </div>
          <div className="mt-2">
            <Badge variant="outline" className="mr-2">
              Section: {sectionTitle}
            </Badge>
            <Badge variant="secondary">Status: COMPLETED (Locked)</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start gap-2">
              <span className="text-amber-600 font-medium">⚠️</span>
              <div>
                <div className="font-medium text-amber-800">Section Locked</div>
                <div className="text-sm text-amber-700">
                  This section has been completed and locked. To make changes,
                  you must submit an approval request for review by QA
                  personnel.
                </div>
              </div>
            </div>
          </div>

          <div className="p-2 border-gray-300 border">
            <div>
              <h1 className="text-l font-medium">New Values</h1>
            </div>
            <div>
              <FormSectionRenderer
                section={sectionDefinition}
                onSelectionSave={() => {}}
                initialData={formValues}
                parentSectionId={parentSectionId}
                readonly={false}
                isHistory={true}
                onFormRegister={handleFormRegister}
              />
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="requestType"
                className="block text-sm font-medium mb-2"
              >
                Request Type *
              </label>
              <select
                id="requestType"
                value={requestType}
                onChange={(e) => setRequestType(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="DEVIATION">Deviation</option>
                <option value="CAPA">
                  CAPA (Corrective and Preventive Action)
                </option>
                <option value="CHANGE_REQUEST">Change Request</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="reason"
                className="block text-sm font-medium mb-2"
              >
                Reason for Changes *
              </label>
              <textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[100px]"
                placeholder="Explain why changes are needed to this completed section..."
                required
              />
            </div>

            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium mb-2"
              >
                Additional Details (Optional)
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[80px]"
                placeholder="Provide any additional context or details..."
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="text-red-800 text-sm">{error}</div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !reason.trim()}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isSubmitting ? "Submitting..." : "Submit Request"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ApprovalRequestDialog;
