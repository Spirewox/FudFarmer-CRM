
import { Button } from "@/src/components/ui/Button";

interface PaginationProps {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}

export const Pagination = ({ page, totalPages, onPageChange }: PaginationProps) => {
  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t">
      <span className="text-sm text-muted-foreground">
        Page {page} of {totalPages}
      </span>

      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          disabled={page === 1}
          onClick={() => onPageChange(page - 1)}
        >
          Previous
        </Button>

        <Button
          size="sm"
          variant="outline"
          disabled={page === totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  )
}
