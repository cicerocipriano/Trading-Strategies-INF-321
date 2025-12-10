import { ChevronLeft, ChevronRight } from 'lucide-react';

interface StrategiesPaginationProps {
    readonly currentPage: number;
    readonly totalPages: number;
    readonly showingFrom: number;
    readonly showingTo: number;
    readonly totalStrategies: number;
    readonly onPageChange: (page: number) => void;
}

export function StrategiesPagination({
    currentPage,
    totalPages,
    showingFrom,
    showingTo,
    totalStrategies,
    onPageChange,
}: StrategiesPaginationProps) {
    const handlePrev = () => {
        onPageChange(Math.max(1, currentPage - 1));
    };

    const handleNext = () => {
        onPageChange(Math.min(totalPages, currentPage + 1));
    };

    return (
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
            <p className="text-muted-foreground">
                Mostrando{' '}
                <span className="font-medium text-foreground">
                    {showingFrom}–{showingTo}
                </span>{' '}
                de{' '}
                <span className="font-medium text-foreground">
                    {totalStrategies}
                </span>{' '}
                estratégias
            </p>

            <div className="inline-flex items-center gap-2">
                <button
                    type="button"
                    onClick={handlePrev}
                    disabled={currentPage === 1}
                    className="inline-flex items-center gap-1 rounded-lg border border-border bg-card/70 px-3 py-1.5 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-card/90 transition-colors"
                >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Anterior</span>
                </button>

                <span className="text-muted-foreground">
                    Página{' '}
                    <span className="font-medium text-foreground">{currentPage}</span>{' '}
                    de{' '}
                    <span className="font-medium text-foreground">{totalPages}</span>
                </span>

                <button
                    type="button"
                    onClick={handleNext}
                    disabled={currentPage === totalPages}
                    className="inline-flex items-center gap-1 rounded-lg border border-border bg-card/70 px-3 py-1.5 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-card/90 transition-colors"
                >
                    <span>Próxima</span>
                    <ChevronRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}
