import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "@/src/lib/utils";
import { X } from "lucide-react";

interface DialogProps extends HTMLAttributes<HTMLDivElement> {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

const Dialog = forwardRef<HTMLDivElement, DialogProps>(
  ({ className, open, onClose, title, children, ...props }, ref) => {
    if (!open) return null;

    return (
      <>
        {/* Backdrop */}
        <div 
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />
        {/* Dialog */}
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
          <div
            ref={ref}
            className={cn(
              "bg-background w-full max-w-lg max-h-[90vh] rounded-xl border shadow-2xl overflow-hidden pointer-events-auto flex flex-col",
              className
            )}
            onClick={(e) => e.stopPropagation()}
            {...props}
          >
            {title && (
              <div className="flex items-center justify-between p-6 border-b flex-shrink-0">
                <h2 className="text-lg font-semibold">{title}</h2>
                <button
                  onClick={onClose}
                  className="rounded-full p-1 hover:bg-secondary transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
            <div className="p-6 overflow-y-auto flex-1">{children}</div>
          </div>
        </div>
      </>
    );
  }
);
Dialog.displayName = "Dialog";

export { Dialog };