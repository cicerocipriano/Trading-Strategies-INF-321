import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { StrategiesPagination } from '@/components/strategies/StrategyPagination';

type OnPageChangeFn = (page: number) => void;

interface RenderOptions {
    currentPage?: number;
    totalPages?: number;
    showingFrom?: number;
    showingTo?: number;
    totalStrategies?: number;
    onPageChangeMock?: ReturnType<typeof vi.fn<OnPageChangeFn>>;
}

function renderPagination(options: RenderOptions = {}) {
    const {
        currentPage = 1,
        totalPages = 1,
        showingFrom = 0,
        showingTo = 0,
        totalStrategies = 0,
        onPageChangeMock = vi.fn<OnPageChangeFn>(),
    } = options;

    render(
        <StrategiesPagination
            currentPage={currentPage}
            totalPages={totalPages}
            showingFrom={showingFrom}
            showingTo={showingTo}
            totalStrategies={totalStrategies}
            onPageChange={onPageChangeMock}
        />,
    );

    return { onPageChangeMock };
}

describe('StrategiesPagination', () => {
    it('renderiza resumo de paginação corretamente', () => {
        renderPagination({
            currentPage: 1,
            totalPages: 5,
            showingFrom: 1,
            showingTo: 10,
            totalStrategies: 42,
        });

        const summary = screen.getByText((_, element) =>
            element?.tagName === 'P' &&
            !!element.textContent?.includes('Mostrando') &&
            element.textContent.includes('42'),
        );

        expect(summary).toBeInTheDocument();
        expect(summary).toHaveTextContent('Mostrando');
        expect(summary).toHaveTextContent('1–10');
        expect(summary).toHaveTextContent('42');
        expect(summary).toHaveTextContent('estratégias');
    });

    it('exibe página atual e total de páginas', () => {
        renderPagination({
            currentPage: 3,
            totalPages: 7,
            showingFrom: 15,
            showingTo: 21,
            totalStrategies: 50,
        });

        const pageInfo = screen.getByText((_, element) =>
            element?.tagName === 'SPAN' &&
            !!element.textContent &&
            element.textContent.includes('Página') &&
            element.textContent.includes('3') &&
            element.textContent.includes('7'),
        );

        expect(pageInfo).toBeInTheDocument();
        expect(pageInfo).toHaveTextContent('Página');
        expect(pageInfo).toHaveTextContent('3');
        expect(pageInfo).toHaveTextContent('7');
    });


    it('desabilita botão "Anterior" na primeira página e não chama onPageChange', () => {
        const { onPageChangeMock } = renderPagination({
            currentPage: 1,
            totalPages: 5,
            showingFrom: 1,
            showingTo: 10,
            totalStrategies: 42,
        });

        const prevButton = screen.getByRole('button', {
            name: /Anterior/i,
        });

        expect(prevButton).toBeDisabled();

        fireEvent.click(prevButton);

        expect(onPageChangeMock).not.toHaveBeenCalled();
    });

    it('desabilita botão "Próxima" na última página e não chama onPageChange', () => {
        const { onPageChangeMock } = renderPagination({
            currentPage: 5,
            totalPages: 5,
            showingFrom: 41,
            showingTo: 50,
            totalStrategies: 50,
        });

        const nextButton = screen.getByRole('button', {
            name: /Próxima/i,
        });

        expect(nextButton).toBeDisabled();

        fireEvent.click(nextButton);

        expect(onPageChangeMock).not.toHaveBeenCalled();
    });

    it('ao clicar em "Anterior" numa página intermediária chama onPageChange com página - 1', () => {
        const { onPageChangeMock } = renderPagination({
            currentPage: 3,
            totalPages: 5,
            showingFrom: 15,
            showingTo: 21,
            totalStrategies: 42,
        });

        const prevButton = screen.getByRole('button', {
            name: /Anterior/i,
        });

        expect(prevButton).not.toBeDisabled();

        fireEvent.click(prevButton);

        expect(onPageChangeMock).toHaveBeenCalledTimes(1);
        expect(onPageChangeMock).toHaveBeenCalledWith(2);
    });

    it('ao clicar em "Próxima" numa página intermediária chama onPageChange com página + 1', () => {
        const { onPageChangeMock } = renderPagination({
            currentPage: 2,
            totalPages: 5,
            showingFrom: 11,
            showingTo: 20,
            totalStrategies: 42,
        });

        const nextButton = screen.getByRole('button', {
            name: /Próxima/i,
        });

        expect(nextButton).not.toBeDisabled();

        fireEvent.click(nextButton);

        expect(onPageChangeMock).toHaveBeenCalledTimes(1);
        expect(onPageChangeMock).toHaveBeenCalledWith(3);
    });
});