import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ChevronsLeft } from "lucide-react";
import { useTranslation } from "react-i18next";

interface Props {
  pageIndex: number;
  hasPrevPage: boolean;
  hasNextPage: boolean;
  isFetching: boolean;
  goFirst: () => void;
  goPrev: () => void;
  goNext: () => void;
}

export function CursorPaginationControls({
  pageIndex, hasPrevPage, hasNextPage, isFetching, goFirst, goPrev, goNext,
}: Props) {
  const { t } = useTranslation();

  if (!hasPrevPage && !hasNextPage) return null;

  return (
    <div className="flex items-center justify-center gap-2 py-4">
      <Button
        variant="outline" size="sm" onClick={goFirst}
        disabled={!hasPrevPage || isFetching}
        className="h-8 w-8 p-0"
      >
        <ChevronsLeft className="h-4 w-4" />
      </Button>
      <Button
        variant="outline" size="sm" onClick={goPrev}
        disabled={!hasPrevPage || isFetching}
        className="h-8 w-8 p-0"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <span className="text-xs text-muted-foreground px-2">
        {t("common.page", "Pagina")} {pageIndex + 1}
      </span>
      <Button
        variant="outline" size="sm" onClick={goNext}
        disabled={!hasNextPage || isFetching}
        className="h-8 w-8 p-0"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
