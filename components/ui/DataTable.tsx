import type { ReactNode } from "react";
import { cn } from "@/src/lib/utils";

interface Column<T> {
  key: keyof T | string;
  header: string;
  render?: (item: T) => ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  onRowClick?: (item: T) => void;
}

export function DataTable<T extends { id: string }>({
  data,
  columns,
  onRowClick,
}: DataTableProps<T>) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border">
            {columns.map((col) => (
              <th
                key={String(col.key)}
                className={cn(
                  "px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider",
                  col.className
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {data.map((item) => (
            <tr
              key={item.id}
              onClick={() => onRowClick?.(item)}
              className={cn(
                "hover:bg-muted/50 transition-colors",
                onRowClick && "cursor-pointer"
              )}
            >
              {columns.map((col) => (
                <td
                  key={`${item.id}-${String(col.key)}`}
                  className={cn("px-4 py-3 text-sm text-foreground", col.className)}
                >
                  {col.render
                    ? col.render(item)
                    : String((item as Record<string, unknown>)[col.key as string] ?? "")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {data.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No data available
        </div>
      )}
    </div>
  );
}
