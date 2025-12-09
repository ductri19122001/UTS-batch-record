import type { TableField } from "@/lib/types"
import { Input } from '@/components/ui/input'
import { Label } from "@/components/ui/label"
import { FormItem, FormMessage } from '@/components/ui/form'
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useFieldArray } from "react-hook-form"
import { Plus, Trash2 } from "lucide-react"
import { useEffect } from "react"

interface TableFieldProps {
  field: TableField
  form: any
  readonly?: boolean
}

const TableFieldComponent = ({ field, form, readonly }: TableFieldProps) => {
  // Handle both array format and {rows: []} format from prefill data
  const currentValue = form.watch(field.name)
  
  // Transform data BEFORE useFieldArray initializes
  useEffect(() => {
    if (currentValue?.rows && !Array.isArray(currentValue)) {
      form.setValue(field.name, currentValue.rows)
    }
  }, [currentValue, field.name, form]) // Run when data changes
  
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: field.name
  })

  const addRow = () => {
    const newRow: Record<string, string> = {}
    field.columns?.forEach(column => {
      newRow[column.id] = ''
    })
    append(newRow)
  }

  if (fields.length === 0) {
    addRow()
  }

  return (
    <FormItem className="space-y-4. min-w-0">
      {/* Header with label and add button */}
      <div className="flex items-center justify-between">
        <Label className="text-base font-semibold">{field.label}</Label>
        {!readonly && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addRow}
            className="h-8"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Row
          </Button>
        )}
      </div>
      
      {/* Table */}
      <div className="rounded-md border min-w-0">
        <Table>
          <TableHeader>
            <TableRow>
              {field.columns?.map((column) => (
                <TableHead key={column.id} className="font-medium">
                  {column.label}
                  {field.critical && column.id === 'actualWt' && (
                    <span className="text-red-500 ml-1">*</span>
                  )}
                </TableHead>
              ))}
              <TableHead className="w-16">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {fields.map((row, rowIndex) => (
              <TableRow key={row.id}>
                {field.columns?.map((column) => (
                  <TableCell key={column.id} className="p-2">
                    <Input
                      type={column.type === 'number' ? 'number' : column.type === 'date' ? 'date' : 'text'}
                      step={column.type === 'number' ? 'any' : undefined}
                      placeholder={`${column.label.toLowerCase()}`}
                      className="h-8 border-0 shadow-none focus-visible:ring-1"
                      readOnly={readonly}
                      disabled={readonly}
                      {...form.register(`${field.name}.${rowIndex}.${column.id}`, {
                        required: field.critical && column.id === 'actualWt' ? `${column.label} is required` : false,
                        valueAsNumber: column.type === 'number'
                      })}
                    />
                    {form.formState.errors[field.name]?.[rowIndex]?.[column.id] && (
                      <p className="text-xs text-red-500 mt-1">
                        {form.formState.errors[field.name][rowIndex][column.id]?.message}
                      </p>
                    )}
                  </TableCell>
                ))}
                <TableCell className="p-2">
                  {!readonly && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => remove(rowIndex)}
                      disabled={fields.length === 1}
                      className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      
      {/* Table summary */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{fields.length} row{fields.length !== 1 ? 's' : ''}</span>
        <span className="text-xs">
          {field.columns?.length} columns
        </span>
      </div>
      
      <FormMessage />
    </FormItem>
  )
}

export default TableFieldComponent
