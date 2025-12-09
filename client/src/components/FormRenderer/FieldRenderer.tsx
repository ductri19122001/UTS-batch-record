// Delegate the field to the indiviual components
import DateFieldComponent from "./FieldComponents/DateFieldComponent"
import DurationFieldComponent from "./FieldComponents/DurationFieldComponent"
import NumberFieldComponent from "./FieldComponents/NumberFieldComponent"
import RangeFieldComponent from "./FieldComponents/RangeFieldComponent"
import SelectFieldComponent from "./FieldComponents/SelectFieldComponent"
import TableFieldComponent from "./FieldComponents/TableFieldComponent"
import TextFieldComponent from "./FieldComponents/TextFieldComponent"
import type { Field } from "@/lib/types"

interface FieldRendererProps {
  field: Field
  form: any
  name?: string
  readonly?: boolean
}

const FieldRenderer = ({ field, form, name, readonly }: FieldRendererProps) => {

  let contentToRender;

  switch (field.type) {
    case 'text':
      contentToRender = <TextFieldComponent field={field} form={form} name={name} readonly={readonly} />
      break;
    case 'number':
      contentToRender = <NumberFieldComponent field={field} form={form} name={name} readonly={readonly} />
      break;
    case 'range':
      contentToRender = <RangeFieldComponent field={field} form={form} readonly={readonly} />
      break
    case 'table':
      contentToRender = <TableFieldComponent field={field} form={form} readonly={readonly} />
      break
    case 'duration':
      contentToRender = <DurationFieldComponent field={field} form={form} readonly={readonly} />
      break
    case 'select':
      contentToRender = <SelectFieldComponent field={field} form={form} readonly={readonly} />
      break
    case 'date':
      contentToRender = <DateFieldComponent field={field} form={form} name={name} readonly={readonly} />
      break
    default:
      contentToRender = `<div>Unrecognised Field Type</div>`
  }

  return (
    <div>
      {contentToRender}
    </div>
  )
}

export default FieldRenderer
