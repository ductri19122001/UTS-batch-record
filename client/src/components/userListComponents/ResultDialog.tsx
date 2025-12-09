import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction} from "../ui/alert-dialog";

export type DialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  message: string;
  type: "error" | "confirm" | "result";
  onConfirm?: () => void;
}

const ResultDialog = (props: DialogProps) => {
  return (  
    <AlertDialog open={props.open} onOpenChange={props.onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {props.type === "error" ? "Error" :(props.type==="confirm" ? "Confirm" : "Result")}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {props.message}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          {props.type === "error" ? (
            <AlertDialogCancel onClick={() => props.onOpenChange(false)}>
              OK
            </AlertDialogCancel>
          ) : (props.type === "confirm" ? (
            <>
              <AlertDialogCancel onClick={() => props.onOpenChange(false)}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction onClick={() => {
                props.onConfirm?.();
                props.onOpenChange(false);
              }}>
                Confirm
              </AlertDialogAction>
            </>
          ): (
            <>
              <AlertDialogAction onClick={() => {
                props.onConfirm?.();
                props.onOpenChange(false);
              }}>
                OK
              </AlertDialogAction>    
            </> 
          ))}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default ResultDialog;