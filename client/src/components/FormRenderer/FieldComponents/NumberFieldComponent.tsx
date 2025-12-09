import type { NumberField } from "@/lib/types"
import { FormControl, FormItem, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface NumberFieldProps {
  field: NumberField
  form: any
  name?: string
  readonly?: boolean
}

const NumberInput = ({field, form, name, readonly}: NumberFieldProps) => {
  const fieldName = name || field.name
  return (
    <FormItem className="space-y-3 max-w-1">
        <div className="flex items-center justify-between">
            <Label htmlFor={fieldName}>
                {fieldName}
            </Label>
            <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-primary gap-2 flex">
                    Input: <p className="font-light">{field.type}</p>
                </span>
            </div>
        </div>
      <FormControl>
          <Input
            id={field.id}
            type="number"
            step="any"
            readOnly={readonly}
            disabled={readonly}
            {...form.register(fieldName, {
              required: "This field is required",
              valueAsNumber: "Must be a number"
            })}
          />
      </FormControl>
      <FormMessage/>
      {/* If there's an validation error show it */}
      {form.formState.errors[fieldName] && (
          <p className="text-xs text-red-500 mt-1">
          {console.error(form.formState.errors[fieldName])}
          {form.formState.errors[fieldName].message}
          </p>
      )}
    </FormItem>
  )
}

export default NumberInput