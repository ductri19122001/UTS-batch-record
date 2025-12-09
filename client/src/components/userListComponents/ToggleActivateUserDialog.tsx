import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogClose,
  DialogFooter,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { useState } from "react";
import type { User } from "./User";
import { useAuth0 } from "@auth0/auth0-react";
import ResultDialog from "./ResultDialog";

interface ToggleActivateUserDialogProps {
  selectedUser?: User;
  onSuccess: () => void;
}

const ToggleActivateUserDialog = ({
  selectedUser,
  onSuccess,
}: ToggleActivateUserDialogProps) => {
  const { getAccessTokenSilently } = useAuth0();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [dialogProp, setDialogProp] = useState({
    message: "",
    type: "confirm" as "confirm" | "error" | "result",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedUser) {
      alert("Please select a user first");
      return;
    }

    setLoading(true);

    try {
      const token = await getAccessTokenSilently({
        authorizationParams: {
          audience: import.meta.env.VITE_AUTH0_AUDIENCE,
        },
      });

      const url = selectedUser.isActive
        ? `${import.meta.env.VITE_API_SERVER_URL}/api/profiles/deactivate/${selectedUser?.id}`
        : `${import.meta.env.VITE_API_SERVER_URL}/api/profiles/activate/${selectedUser?.id}`;
      const result = await fetch(url, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (result.ok) {
        setDialogProp({ type: "result", message: "Edit Account Successful!" });
        setDialogOpen(true);
      } else {
        setDialogProp({
          type: "error",
          message: `Failed to Edit Account. \n Please try again`,
        });
        setDialogOpen(true);
        throw Error;
      }
      setOpen(false);
      onSuccess();
    } catch (error) {
      console.error("Error updating user status:", error);
      alert("Failed to update user status");
    } finally {
      setLoading(false);
    }
  };
  return (
    <>
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive">Switch User Activity</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Toggle User Activity</DialogTitle>
            <DialogDescription>
              {!selectedUser
                ? "Please select a user first."
                : `Do you want to toggle activity for ${selectedUser?.firstName} ${selectedUser?.lastName}?`}
            </DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <div className="py-4">
              <p className="text-xl text-gray-600">
                Selected user:{" "}
                {selectedUser.firstName + " " + selectedUser.lastName}
              </p>
              <p className="text-xl text-gray-600 font-bold">
                {selectedUser.isActive ? "Active" : "Inactive"} →{" "}
                {!selectedUser.isActive ? "Active" : "Inactive"}
              </p>
            </div>
          )}

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" type="button">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={loading || !selectedUser}>
              {loading ? "Processing..." : "Confirm"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
    <ResultDialog
      open={isDialogOpen}
      onOpenChange={setDialogOpen}
      message={dialogProp.message}
      type={dialogProp.type}
      onConfirm={undefined}
    />
    </>
  );
};
export default ToggleActivateUserDialog;
