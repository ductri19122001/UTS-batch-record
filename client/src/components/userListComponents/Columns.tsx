import type { ColumnDef } from '@tanstack/react-table'
import type { User } from './User'
import { Checkbox } from '@/components/ui/checkbox'

export const columns: ColumnDef<User>[] = [
    {
    id: "select",
    header: '',
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
    {
        accessorKey: 'id',
        header: 'ID',
    },
    {
        accessorKey: 'firstName',
        header: 'First Name',
    },
    {
        accessorKey: 'lastName',
        header: 'Last Name',
    },
    {
        accessorKey: 'email',
        header: 'Email',
    },
    {
      accessorKey: 'isActive',
      header: 'Active',
      cell: ({ row }) => {
        return row.getValue('isActive') ? 'Active' : 'Inactive'
      }
    },
    {
        accessorKey: 'role',
        header: 'Role',
    },
    {
        accessorKey: 'createdAt',
        header: 'Created At',
    },
    {
        accessorKey: 'updatedAt',
        header: 'Updated At',
    },

]
