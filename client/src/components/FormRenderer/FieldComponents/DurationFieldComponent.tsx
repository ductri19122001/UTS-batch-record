import { FormControl, FormItem } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import type { DurationField } from "@/lib/types"
import { useState } from "react"

interface DurationFieldProps {
  field: DurationField
  form: any
  readonly?: boolean
}

const DurationFieldComponent = ({field, form, readonly}: DurationFieldProps) => {
  const [value, setValue] = useState<string>("")
  const [unit, setUnit] = useState<string>("minutes")

  const handleValueChange = (newValue: string) => {
    if (readonly) return
    setValue(newValue)
    updateFormValue(newValue, unit)
  }

  const handleUnitChange = (newUnit: string) => {
    if (readonly) return
    setUnit(newUnit)
    updateFormValue(value, newUnit)
  }

  const updateFormValue = (val: string, selectedUnit: string) => {
    const formattedValue = val ? `${val} ${selectedUnit}` : ""
    form.setValue(field.name, formattedValue)
  }

  return (
    <FormItem>
      <Label htmlFor={field.name}>{field.label || field.name}</Label>
      <FormControl>
        <div className="flex gap-2 items-center">
          <Input
            id={field.name}
            {...form.register(field.name)}
            type="number"
            placeholder="Enter duration"
            value={value}
            onChange={(e) => handleValueChange(e.target.value)}
            className="flex-1"
            min="0"
            step="0.1"
            readOnly={readonly}
            disabled={readonly}
          />
          <Select value={unit} onValueChange={handleUnitChange} disabled={readonly}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="seconds">Seconds</SelectItem>
              <SelectItem value="minutes">Minutes</SelectItem>
              <SelectItem value="hours">Hours</SelectItem>
              <SelectItem value="days">Days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </FormControl>
    </FormItem>
  )
}

export default DurationFieldComponent