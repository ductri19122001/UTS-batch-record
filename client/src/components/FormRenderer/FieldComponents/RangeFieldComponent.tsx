import type { RangeField } from "@/lib/types"
import { FormControl, FormItem, FormMessage } from "@/components/ui/form"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"

interface RangeFieldProps {
  field: RangeField
  form: any
  min?: number
  max?: number
  step?: number
  readonly?: boolean
}

const RangeInput = ({ field, form, readonly }: RangeFieldProps) => {
  const { watch, setValue } = form
  const currentValue = watch(field.name) || field.min || 0

  const handleValueChange = (values: number[]) => {
    if (readonly) return
    const newValue = values[0]
    setValue(field.name, newValue, { shouldValidate: true })
  }

  return (
    <FormItem className="space-y-3">
      <div className="flex items-center justify-between">
        <Label htmlFor={field.name} className="text-sm font-medium">
          {field.label || field.name}
        </Label>
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-primary">
            {currentValue}
          </span>
          {field.spec && (
            <span className="text-xs text-muted-foreground">
              (Target: {field.spec})
            </span>
          )}
        </div>
      </div>
      
      <FormControl>
        <div className="space-y-3">
          {/* Slider Component */}
          <Slider
            id={field.name}
            min={field.min || 0}
            max={field.max || 100}
            step={field.stepSize || 0.1}
            value={[currentValue]}
            onValueChange={handleValueChange}
            className="w-full"
            disabled={readonly}
            {...form.register(field.name, {
              valueAsNumber: true,
              min: field.min || 0,
              max: field.max || 100
            })}
          />
          
          {/* Range indicators */}
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{field.min || 0}</span>
            <span>{field.max || 100}</span>
          </div>
          
          {/* Method info if available */}
          {field.method && (
            <p className="text-xs text-muted-foreground">
              Method: {field.method}
            </p>
          )}
        </div>
      </FormControl>
      
      <FormMessage />
    </FormItem>
  )
}

export default RangeInput