import { useState } from "react";
import type { UserListHeaderProps } from "../UserList";
import { useAuth0 } from "@auth0/auth0-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "../ui/button";
import ResultDialog from "./ResultDialog";


const ChangePasswordDialog = ({ selectedUser, onSuccess }: UserListHeaderProps) => {
  const [open, setOpen] = useState(false);
  const [isLoading, setLoading] = useState(false);
  const { getAccessTokenSilently } = useAuth0();
  const [isDialogOpen, setDialogOpen] = useState(false)
  const [dialogProp, setDialogProp] = useState({
    message: "",
    type: "confirm" as "confirm" | "error" | "result"
  })

  const handleSubmit = async () => {
    setLoading(true)
    const token = await getAccessTokenSilently()
    console.log("Email: ", selectedUser?.email)
    const result = await fetch(`${import.meta.env.VITE_API_SERVER_URL}/api/profiles/changePassword`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          id: selectedUser?.id,
          email: selectedUser?.email
        })
      })

    if (result.ok) {
      setLoading(false)
      setDialogProp({
        type: "result",
        message: "Email Sent! Please check your inbox"
      })
      setDialogOpen(true)
      console.log(await result.json())
      setOpen(false)
      onSuccess()
    } else {
      setLoading(false)
      setDialogProp({
        type: "error",
        message: "Failed to send email. Please try again."
      })
      setOpen(false)
      setDialogOpen(true)
    }


  }

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="default">Change User Password</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            {selectedUser ? (
              <>
                <DialogTitle>Change Password</DialogTitle>
                <DialogDescription>
                  Do you want to send password change email to {selectedUser?.email}?
                </DialogDescription>
              </>
            ) : (
              <>
                <DialogTitle>Error</DialogTitle>
                <DialogDescription>
                  Please select user first
                </DialogDescription>
              </>
            )}

          </DialogHeader>

          <DialogFooter>
            <DialogClose>
              <Button variant={"outline"}>Cancel</Button>
            </DialogClose>
            {selectedUser &&
              <Button
                type="submit"
                disabled={isLoading || !selectedUser}
                onClick={handleSubmit}>
                {isLoading ? "Processing..." : "Send"}
              </Button>
            }
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ResultDialog open={isDialogOpen} onOpenChange={setDialogOpen} message={dialogProp.message} type={dialogProp.type} />
    </>
  )
}
export default ChangePasswordDialog
