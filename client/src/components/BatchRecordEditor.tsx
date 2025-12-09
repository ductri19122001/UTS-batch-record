import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import FormRenderer from "./FormRenderer/FormRenderer";
import { TriangleAlert } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useUserRoles } from "@/hooks/useUserRoles";

const BatchRecordEditor = () => {
  const [searchParams] = useSearchParams();
  const [batchId, setBatchId] = useState<string>("");
  const navigator = useNavigate();
  const { isViewer } = useUserRoles();

  useEffect(() => {
    const id = searchParams.get("id");
    if (id) {
      setBatchId(id);
    }
  }, [searchParams]);

  return batchId ? (<FormRenderer batchRecordId={batchId} forceReadOnly={isViewer} />) : (
    <div className="w-full max-w-lg mx-auto mt-8 px-4">
      <Alert variant="destructive" className="rounded-2xl border-destructive/40 shadow-sm">
        <TriangleAlert className="h-5 w-5" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Batch Record ID must be provided.
        </AlertDescription>

        <div className="p-8">
          <Button
            className="gap-1"
            size="sm"
            variant="outline"
            onClick={() => navigator('/products')}
          >
            <p>Back To Products</p>
          </Button>
        </div>
      </Alert>
    </div>
  );
};

export default BatchRecordEditor;
