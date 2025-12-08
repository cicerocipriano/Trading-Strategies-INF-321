import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import Simulations from '@/pages/Simulations';
import { renderWithProviders } from '../test-utils';
import type { SimulationListItem } from '@/hooks/useSimulations';

const toastSuccessMock = vi.hoisted(() =>
    vi.fn<(message: string) => void>(),
);

const toastErrorMock = vi.hoisted(() =>
    vi.fn<(message: string) => void>(),
);

interface UseSimulationsMockResult {
    data: SimulationListItem[];
    isLoading: boolean;
    isError: boolean;
}

interface UseDeleteSimulationMockResult {
    mutateAsync: (id: string) => Promise<void>;
    isPending: boolean;
}

const mockUseSimulations = vi.hoisted(() =>
    vi.fn<() => UseSimulationsMockResult>(),
);

const mockUseDeleteSimulation = vi.hoisted(() =>
    vi.fn<() => UseDeleteSimulationMockResult>(),
);

vi.mock('sonner', () => ({
    toast: {
        success: toastSuccessMock,
        error: toastErrorMock,
    },
}));

vi.mock('@/hooks/useSimulations', () => ({
    useSimulations: mockUseSimulations,
    useDeleteSimulation: mockUseDeleteSimulation,
}));

function renderSimulations() {
    return renderWithProviders(
        <MemoryRouter initialEntries={['/simulations']}>
            <Simulations />
        </MemoryRouter>,
    );
}

type DeleteMutateFn = (id: string) => Promise<void>;
type DeleteMutateMock = ReturnType<typeof vi.fn<DeleteMutateFn>>;

let deleteMutateMock: DeleteMutateMock;

const baseSimulations: SimulationListItem[] = [
    {
        id: 'sim-1',
        simulationName: 'Simulação 1',
        strategyName: 'Estratégia A',
        assetSymbol: 'PETR4',
        status: 'CONCLUDED',
        startDate: '2023-01-01T00:00:00.000Z',
        endDate: '2023-01-10T00:00:00.000Z',
        createdAt: '2023-01-01T10:00:00.000Z',
        initialCapital: 1000,
        totalReturn: 100,
        returnPercentage: 10,
        maxDrawdown: null,
    },
    {
        id: 'sim-2',
        simulationName: 'Simulação 2',
        strategyName: 'Estratégia B',
        assetSymbol: 'VALE3',
        status: 'IN_PROGRESS',
        startDate: '2023-02-01T00:00:00.000Z',
        endDate: '2023-02-10T00:00:00.000Z',
        createdAt: '2023-02-01T10:00:00.000Z',
        initialCapital: 2000,
        totalReturn: -50,
        returnPercentage: -2.5,
        maxDrawdown: null,
    },
];

describe('Página Simulations', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        deleteMutateMock = vi.fn<DeleteMutateFn>().mockResolvedValue(
            undefined,
        );

        mockUseSimulations.mockReturnValue({
            data: baseSimulations,
            isLoading: false,
            isError: false,
        });

        mockUseDeleteSimulation.mockReturnValue({
            mutateAsync: deleteMutateMock,
            isPending: false,
        });
    });

    it('renderiza o cabeçalho e o link de nova simulação', () => {
        renderSimulations();

        expect(
            screen.getByRole('heading', { name: /Simulações/i, level: 1 }),
        ).toBeInTheDocument();

        const newSimLink = screen.getByRole('link', {
            name: /Nova simulação/i,
        });
        expect(newSimLink).toBeInTheDocument();
        expect(newSimLink).toHaveAttribute('href', '/simulator');
    });

    it('exibe mensagem de carregamento quando isLoading é true', () => {
        mockUseSimulations.mockReturnValue({
            data: [],
            isLoading: true,
            isError: false,
        });

        renderSimulations();

        expect(
            screen.getByText(/Carregando simulações/i),
        ).toBeInTheDocument();
    });

    it('exibe mensagem de erro quando isError é true', () => {
        mockUseSimulations.mockReturnValue({
            data: [],
            isLoading: false,
            isError: true,
        });

        renderSimulations();

        expect(
            screen.getByText(/Não foi possível carregar as simulações/i),
        ).toBeInTheDocument();
    });

    it('exibe estado vazio quando não há simulações', () => {
        mockUseSimulations.mockReturnValue({
            data: [],
            isLoading: false,
            isError: false,
        });

        renderSimulations();

        expect(
            screen.getByText(
                /Você ainda não possui simulações registradas/i,
            ),
        ).toBeInTheDocument();
    });

    it('calcula e exibe corretamente as métricas principais', () => {
        renderSimulations();

        const totalCardElement = screen
            .getByText('Total')
            .closest('.ts-glass-surface');
        expect(totalCardElement).not.toBeNull();
        const totalCard = totalCardElement as HTMLElement;
        expect(totalCard).toHaveTextContent('2');

        const investidoCardElement = screen
            .getByText('Investido')
            .closest('.ts-glass-surface');
        expect(investidoCardElement).not.toBeNull();
        const investidoCard = investidoCardElement as HTMLElement;
        expect(investidoCard.textContent ?? '').toContain('3.000,00');

        const lucroCardElement = screen
            .getByText('Lucro Total')
            .closest('.ts-glass-surface');
        expect(lucroCardElement).not.toBeNull();
        const lucroCard = lucroCardElement as HTMLElement;
        expect(lucroCard.textContent ?? '').toContain('50,00');

        const roiCardElement = screen
            .getByText('ROI Médio')
            .closest('.ts-glass-surface');
        expect(roiCardElement).not.toBeNull();
        const roiCard = roiCardElement as HTMLElement;
        expect(roiCard.textContent ?? '').toContain('3.8%');

        const taxaCardElement = screen
            .getByText('Taxa de acerto')
            .closest('.ts-glass-surface');
        expect(taxaCardElement).not.toBeNull();
        const taxaCard = taxaCardElement as HTMLElement;
        expect(taxaCard.textContent ?? '').toContain('50%');
    });

    it('ao confirmar exclusão chama mutateAsync e mostra toast de sucesso', async () => {
        const confirmSpy = vi
            .spyOn(window, 'confirm')
            .mockReturnValue(true);

        renderSimulations();

        const rows = screen.getAllByRole('article');
        const firstRow = rows[0];
        const deleteButton = within(firstRow).getByTitle('Excluir simulação');
        fireEvent.click(deleteButton);

        await waitFor(() => {
            expect(deleteMutateMock).toHaveBeenCalledWith('sim-1');
        });

        expect(toastSuccessMock).toHaveBeenCalledWith(
            'Simulação excluída com sucesso.',
        );
        expect(toastErrorMock).not.toHaveBeenCalled();

        confirmSpy.mockRestore();
    });

    it('se usuário cancelar o confirm, não chama mutateAsync', () => {
        const confirmSpy = vi
            .spyOn(window, 'confirm')
            .mockReturnValue(false);

        renderSimulations();

        const rows = screen.getAllByRole('article');
        const firstRow = rows[0];
        const deleteButton = within(firstRow).getByTitle('Excluir simulação');
        fireEvent.click(deleteButton);

        expect(deleteMutateMock).not.toHaveBeenCalled();
        expect(toastSuccessMock).not.toHaveBeenCalled();
        expect(toastErrorMock).not.toHaveBeenCalled();

        confirmSpy.mockRestore();

    });

    it('se ocorrer erro ao excluir, mostra toast de erro', async () => {
        const confirmSpy = vi
            .spyOn(window, 'confirm')
            .mockReturnValue(true);

        deleteMutateMock.mockRejectedValueOnce(
            new Error('Falha ao excluir'),
        );

        renderSimulations();

        const rows = screen.getAllByRole('article');
        const firstRow = rows[0];
        const deleteButton = within(firstRow).getByTitle('Excluir simulação');
        fireEvent.click(deleteButton);

        await waitFor(() => {
            expect(deleteMutateMock).toHaveBeenCalled();
        });

        expect(toastErrorMock).toHaveBeenCalledWith(
            'Não foi possível excluir a simulação.',
        );

        confirmSpy.mockRestore();
    });

    it('controla a paginação e habilita/desabilita botões corretamente', () => {
        const manySimulations: SimulationListItem[] = Array.from(
            { length: 9 },
            (_, index) => ({
                ...baseSimulations[0],
                id: `sim-${index + 1}`,
                simulationName: `Simulação ${index + 1}`,
            }),
        );

        mockUseSimulations.mockReturnValue({
            data: manySimulations,
            isLoading: false,
            isError: false,
        });

        renderSimulations();

        const prevButton = screen.getByRole('button', { name: 'Anterior' });
        const nextButton = screen.getByRole('button', { name: 'Próxima' });

        expect(prevButton).toBeDisabled();
        expect(nextButton).not.toBeDisabled();

        const firstPageRows = screen.getAllByRole('article');
        expect(firstPageRows).toHaveLength(7);

        fireEvent.click(nextButton);

        expect(prevButton).not.toBeDisabled();
        expect(nextButton).toBeDisabled();

        const secondPageRows = screen.getAllByRole('article');
        expect(secondPageRows).toHaveLength(2);
    });
});