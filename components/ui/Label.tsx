import { forwardRef, type LabelHTMLAttributes } from "react";
import { cn } from "@/src/lib/utils";

const Label = forwardRef<HTMLLabelElement, LabelHTMLAttributes<HTMLLabelElement>>(
  ({ className, ...props }, ref) => (
    <label
      ref={ref}
      className={cn(
        "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 mb-1.5 block",
        className
      )}
      {...props}
    />
  )
);
Label.displayName = "Label";

export { Label };