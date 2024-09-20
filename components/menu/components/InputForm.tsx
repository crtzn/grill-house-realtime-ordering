import React, { InputHTMLAttributes } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface InputFormProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "id"> {
  id: string;
  label: string;
  name: string;
}

const InputForm: React.FC<InputFormProps> = ({ id, name, label, ...props }) => {
  return (
    <div className="grid grid-cols-4 items-center gap-4">
      <Label htmlFor={id} className="text-right">
        {label}
      </Label>
      <Input
        id={id}
        name={name}
        {...props}
        className={`col-span-3 ${props.className || ""}`}
      />
    </div>
  );
};

export default InputForm;
