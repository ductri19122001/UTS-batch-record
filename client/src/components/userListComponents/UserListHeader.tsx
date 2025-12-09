import { Input } from "../ui/input"
import CreateUserDialog from "./CreateUserDialog";
import ToggleActivateUserDialog from "./ToggleActivateUserDialog";
import type { UserListHeaderProps } from "../UserList";
import ChangePasswordDialog from "./ChangePasswordDialog"
// import AddRoleDialogue from "./AddRoleDialogue";


const UserListHeader = ({ selectedUser, onSuccess, setSearchQuery }: UserListHeaderProps) => {
  return (
    <div className="flex items-center space-x-2 w-10/12 rounded-md border h-20 p-5">
      <h1 className="text-3xl text-center font-bold w-2/12">User List</h1>
      <Input placeholder="Search" className="content-center w-8/12 space-x-2" onChange={(e) => setSearchQuery?.(e.target.value)}/>
        {/* <AddRoleDialogue /> */}
        <CreateUserDialog onSuccess={onSuccess}/>
        <ToggleActivateUserDialog selectedUser={selectedUser} onSuccess={onSuccess}/>
        <ChangePasswordDialog selectedUser={selectedUser} onSuccess={onSuccess} />
    </div>
  )
}
export default UserListHeader