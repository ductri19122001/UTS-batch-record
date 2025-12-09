import type { TextField } from "@/lib/types"
import { Input } from '@/components/ui/input'
import { Label } from "@/components/ui/label"
import {FormItem, FormControl, FormMessage} from '@/components/ui/form'

interface TextFieldProps {
    field: TextField
    form: any
    name?: string
    readonly?: boolean
}

const TextFieldComponent = ({field, form, name, readonly}: TextFieldProps) => {
    const fieldName = name || field.name;
    return (
        <FormItem className="space-y-3">
            <div className="flex items-center justify-between">
                <Label htmlFor={field.name}>
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
                    id={fieldName}
                    type="text"
                    readOnly={readonly}
                    disabled={readonly}
                    {...form.register(fieldName ,{
                        required: "This field is required"
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

export default TextFieldComponent