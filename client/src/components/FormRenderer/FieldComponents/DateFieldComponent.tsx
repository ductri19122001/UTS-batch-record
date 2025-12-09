import type { DateField } from "@/lib/types"
import { FormControl, FormItem } from "@/components/ui/form"
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@radix-ui/react-label";
import { useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";


interface DateFieldProps {
    field: DateField;
    form: any;
    name?: string;
    readonly?: boolean;
}

const DateFieldComponent = ({field, form, name, readonly}: DateFieldProps) => {
    const [date, setDate] = useState<Date | undefined>(new Date())

    return (
        <div>
            <FormItem>
                <Label htmlFor={field.name}>{field.label || field.name}</Label>
                <div className="flex justify-between gap-x-20">
                    <FormControl>
                        <Input 
                            type="date"
                            {...form.register(name || field.name)}
                            value={date?.toISOString().split('T')[0] || ''}
                            readOnly={readonly}
                            disabled={readonly}
                            className=""
                        />
                    </FormControl>
                    {!readonly && (
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button className="w-30">Select Date</Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-70">
                                <Calendar
                                    mode="single"
                                    defaultMonth={date}
                                    selected={date}
                                    onSelect={setDate}
                                    className="rounded-md border shadow-sm"
                                    captionLayout="dropdown"
                                />
                            </PopoverContent>
                        </Popover>
                    )}
                </div>
            </FormItem>
        </div>
    )
}

export default DateFieldComponent