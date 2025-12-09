import type { SelectField } from "@/lib/types";
import { Label } from "@/components/ui/label";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormItem, FormControl, FormMessage } from "@/components/ui/form";
import { useState } from "react";

interface SelectFieldProps {
  field: SelectField
  form: any
  readonly?: boolean
}

const SelectFieldComponent = ({ field, form, readonly }: SelectFieldProps) => {
  const [selectValue, setSelectValue] = useState<string>()
  const fieldName = (field.name || field.label)

  const onSelect = (value: string) => {
    if (readonly) return
    setSelectValue(value)
    form.setValue(field.name, value)
  }

  return (
    <FormItem>
      <Label htmlFor={fieldName}>{fieldName}</Label>
      <FormControl>
        <Select onValueChange={onSelect} disabled={readonly}>
          <SelectTrigger className="w-[180px]">
            <SelectValue
              placeholder={"select an option"}
              value={selectValue}
              {...form.register(fieldName, {
                required: "Please select a value"
              })}
            />
          </SelectTrigger>
          <SelectContent>
            {field.options && field.options.map((option: string) => {
              return (<SelectItem key={option} value={option}>{option}</SelectItem>)
            })}
          </SelectContent>
        </Select>
      </FormControl>
      <FormMessage />
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

export default SelectFieldComponent;
