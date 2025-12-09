import {columns} from './userListComponents/Columns'
import type {User} from './userListComponents/User'
import UserListHeader from './userListComponents/UserListHeader';
import axios from 'axios';
import type { ColumnDef } from "@tanstack/react-table";
import { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type RowSelectionState,
} from "@tanstack/react-table"

 
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import EditUserDialog from './userListComponents/EditUserDialog';


 
interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  setselectedUser: (user: User | undefined) => void
  onUserUpdate: () => void
}

export type UserListHeaderProps = {
  selectedUser?: User
  onSuccess: () => void
  setSearchQuery?: (query:string) => void
}

export function DataTable<TData, TValue>({
  columns,
  data,
  setselectedUser,
  onUserUpdate,
}: DataTableProps<TData, TValue>) {
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => (row as User).id,
    state: {
      rowSelection,
    },
    onRowSelectionChange: setRowSelection,
    enableRowSelection: true,
    enableMultiRowSelection: false,
  })

  useEffect(() => {
    const selected = table.getSelectedRowModel().rows.map(row => row.original as User)
    setselectedUser(selected.length > 0 ? selected[0] : undefined)
  }, [rowSelection])

  return (
    <div className="rounded-md border bg-white w-10/12 h-180 flex flex-col">
        <Table className="relative">
          <TableHeader className='sticky bg-white top-0 z-10 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-px after:bg-border'>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead className="text-center bg-white" key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                      )}
                    </TableHead>
                  )
                })}
                <TableHead className="bg-white">Actions</TableHead>
              </TableRow>
            ))}
          </TableHeader>
            <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell className='text-center' key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                  <TableCell>
                    <EditUserDialog selectedUser={row.original as User} onSuccess={onUserUpdate}/>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        </div>
  )
}
  async function getTableData(getAccessTokenSilently:any): Promise<User[]>{
    const token = await getAccessTokenSilently();
    const response = await axios.get(`${import.meta.env.VITE_API_SERVER_URL}/api/profiles`,{
      headers:{
        Authorization: `Bearer ${token}`
      }
    })
    if(response){
      console.log(response)
    }
    return response.data
  }
export function UserList(){
  const { getAccessTokenSilently } = useAuth0();
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [selectedUser, setselectedUser] = useState<User>()
  const [searchQuery, setSearchQuery] = useState("")

  const loadTable = async() => {
    setLoading(true)
    getTableData(getAccessTokenSilently).then((data) => {
      setUsers(data ?? [])
    }).catch((error) => {
      console.log("Failed to load users", error.message)
    }).finally(() => {
      setLoading(false)
    })
  }
  useEffect(() => {
    loadTable()
  }, [])

  const filteredUsers = users.filter(user => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      user.firstName?.toLowerCase().includes(query) ||
      user.lastName?.toLowerCase().includes(query) ||
      user.email?.toLowerCase().includes(query) ||
      user.role?.toLowerCase().includes(query) ||
      user.id?.toLowerCase().includes(query)
    );
  });
  
  return (
        <div className="flex flex-col items-center space-y-4 mt-10">
            <UserListHeader selectedUser={selectedUser} onSuccess={loadTable} setSearchQuery={setSearchQuery}/>
            {loading ? (
              <div>Loading Users</div>
            ) : 
            (<DataTable columns={columns} data={filteredUsers} setselectedUser={setselectedUser} onUserUpdate={loadTable} />

            )}
            
        </div>
    )
}
export default UserList
