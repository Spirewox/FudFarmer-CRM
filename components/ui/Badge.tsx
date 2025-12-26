import type { ReactNode } from "react";
import { cn } from "../../lib/utils";

interface BadgeProps {
  variant?: "default" | "success" | "warning" | "destructive" | "outline" | "secondary";
  children: ReactNode;
  className?: string;
}

const variantStyles = {
  default: "bg-primary text-primary-foreground",
  success: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
  warning: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100",
  destructive: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
  outline: "border border-border text-foreground",
  secondary: "bg-secondary text-secondary-foreground",
};

export function Badge({ variant = "default", children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
