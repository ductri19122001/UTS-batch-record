import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import axios from "axios";
import { useAuth0 } from "@auth0/auth0-react";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  entityType: string;
  entityId: string;
  canonicalPayload: Record<string, unknown>;
  batchRecordId?: string;
  sectionRecordId?: string;
  sectionTitle?: string;
  onSigned: (signatureId: string) => void;
};

const ElectronicSignatureDialog: React.FC<Props> = ({
  open,
  onOpenChange,
  userId,
  entityType,
  entityId,
  canonicalPayload,
  batchRecordId,
  sectionRecordId,
  sectionTitle,
  onSigned,
}) => {
  const { getAccessTokenSilently } = useAuth0();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sign = async () => {
    try {
      const token = await getAccessTokenSilently({
        authorizationParams: {
          scope: "openid email profile",
          audience: import.meta.env.VITE_AUTH0_AUDIENCE,
        }
      })
      setSubmitting(true);
      setError(null);
      const res = await axios.post(
        `${import.meta.env.VITE_API_SERVER_URL || "http://localhost:3001"}/api/signatures`,
        {
          userId,
          entityType,
          entityId,
          canonicalPayload,
          batchRecordId,
          sectionRecordId,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          }
        }
      );
      if (res.data?.success && res.data?.data?.id) {
        onSigned(res.data.data.id);
        onOpenChange(false);
      } else {
        setError("Failed to create signature");
      }
    } catch (e) {
      setError("Failed to create signature");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Electronic Signature</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            {sectionTitle
              ? `Submitting ${sectionTitle}, please sign here`
              : "Submitting this section, please sign here"}
          </p>
          {error && <div className="text-sm text-red-600">{error}</div>}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button onClick={sign} disabled={submitting}>
              {submitting ? "Signing..." : "Sign"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ElectronicSignatureDialog;
