import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  itemLabel: string;
  onPageChange: (page: number) => void;
}

export function Pagination({
  currentPage,
  totalPages,
  pageSize,
  totalItems,
  itemLabel,
  onPageChange,
}: PaginationProps) {
  if (totalItems === 0 || totalPages <= 1) {
    return null;
  }

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);
  const visiblePages = Array.from({ length: totalPages }, (_, index) => index + 1).filter((page) => (
    page === 1
    || page === totalPages
    || Math.abs(page - currentPage) <= 1
  ));

  const pagesWithGaps = visiblePages.reduce<(number | 'ellipsis')[]>((acc, page, index) => {
    const previousPage = visiblePages[index - 1];

    if (previousPage && page - previousPage > 1) {
      acc.push('ellipsis');
    }

    acc.push(page);
    return acc;
  }, []);

  return (
    <div className="flex flex-col gap-4 border-t border-white/5 bg-surface px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <p className="text-sm text-foreground-muted">
        Affichage de <span className="font-bold text-white">{startItem}</span> a{' '}
        <span className="font-bold text-white">{endItem}</span> sur{' '}
        <span className="font-bold text-white">{totalItems}</span> {itemLabel}
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          aria-label="Page précédente"
          className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/10 bg-surface-elevated px-4 text-sm font-bold text-white transition-colors duration-200 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft size={16} />
          <span className="hidden sm:inline">Précédent</span>
        </button>

        <div className="flex items-center gap-2">
          {pagesWithGaps.map((page, index) => (
            page === 'ellipsis' ? (
              <span
                key={`ellipsis-${index}`}
                className="px-1 text-sm font-bold text-foreground-muted"
              >
                ...
              </span>
            ) : (
              <button
                key={page}
                type="button"
                onClick={() => onPageChange(page)}
                aria-label={`Page ${page}`}
                aria-current={page === currentPage ? 'page' : undefined}
                className={`flex h-11 min-w-11 items-center justify-center rounded-full px-3 text-sm font-bold transition-colors duration-200 ${
                  page === currentPage
                    ? 'bg-teal text-white shadow-lg shadow-teal/20'
                    : 'bg-surface-elevated text-foreground-muted hover:bg-white/10 hover:text-white'
                }`}
              >
                {page}
              </button>
            )
          ))}
        </div>

        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          aria-label="Page suivante"
          className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/10 bg-surface-elevated px-4 text-sm font-bold text-white transition-colors duration-200 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <span className="hidden sm:inline">Suivant</span>
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
