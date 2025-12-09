import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Mock } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';

import type { Strategy } from '@/hooks/useStrategies';
import type { MarketAsset } from '@/hooks/useMarketAssets';

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual<typeof import('react-router-dom')>(
        'react-router-dom',
    );

    const mockNavigate = vi.fn();
    const mockUseLocation = vi.fn(() => ({
        state: null,
        pathname: '/simulator',
        search: '',
        hash: '',
        key: 'test',
    }));

    return {
        ...actual,
        useNavigate: () => mockNavigate,
        useLocation: mockUseLocation,
        __mockedNavigate: mockNavigate,
        __mockedUseLocation: mockUseLocation,
    };
});

vi.mock('sonner', () => ({
    toast: {
        error: vi.fn(),
        success: vi.fn(),
    },
}));

vi.mock('@/hooks/useAuth', () => ({
    useAuth: vi.fn(),
}));

vi.mock('@/hooks/useStrategies', () => ({
    useStrategies: vi.fn(),
}));

vi.mock('@/hooks/useMarketAssets', () => ({
    useMarketAssets: vi.fn(),
}));

vi.mock('@/services/api', () => ({
    apiService: {
        createSimulation: vi.fn(),
    },
}));


import Simulator from '@/pages/Simulator';

import { useAuth } from '@/hooks/useAuth';
import { useStrategies } from '@/hooks/useStrategies';
import { useMarketAssets } from '@/hooks/useMarketAssets';
import { apiService } from '@/services/api';
import { toast } from 'sonner';
import * as ReactRouterDom from 'react-router-dom';

import { renderWithProviders } from '../test-utils';
import { createAuthMock } from '../mocks/authMocks';


type UseMarketAssetsReturn = ReturnType<typeof useMarketAssets>;
type CreateSimulationResponse = Awaited<
    ReturnType<typeof apiService.createSimulation>
>;

interface SimulationPayload {
    userId: string;
    strategyId: string;
    assetSymbol: string;
    simulationName: string;
    startDate: string;
    endDate: string;
    initialCapital: string;
}

const useAuthMocked = vi.mocked(useAuth);
const useStrategiesMocked = vi.mocked(useStrategies);
const useMarketAssetsMocked = vi.mocked(useMarketAssets);

const apiServiceMock = vi.mocked(apiService);

const toastErrorMock = toast.error as unknown as Mock;
const toastSuccessMock = toast.success as unknown as Mock;

type RouterDomWithMocks = {
    __mockedNavigate: Mock<(path: string) => void>;
    __mockedUseLocation: Mock<() => ReactRouterDom.Location>;
};

const routerDomMocks = ReactRouterDom as unknown as RouterDomWithMocks;

const navigateMock = routerDomMocks.__mockedNavigate;
const useLocationMock = routerDomMocks.__mockedUseLocation;

function renderSimulator() {
    return renderWithProviders(<Simulator />);
}

const baseUser = {
    id: 'user-1',
    username: 'TestUser',
    email: 'test@example.com',
    experienceLevel: 'NOVICE',
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
};

const defaultStrategies: Strategy[] = [
    {
        id: 'strat-1',
        name: 'Long Call',
        summary: 'Resumo Long Call',
        description: 'Desc',
        proficiencyLevel: 'NOVICE',
        marketOutlook: 'BULLISH',
        volatilityView: 'HIGH',
        riskProfile: 'CAPPED',
        rewardProfile: 'UNCAPPED',
        strategyType: 'INCOME',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
    },
    {
        id: 'strat-2',
        name: 'Long Put',
        summary: 'Resumo Long Put',
        description: 'Desc',
        proficiencyLevel: 'NOVICE',
        marketOutlook: 'BEARISH',
        volatilityView: 'LOW',
        riskProfile: 'CAPPED',
        rewardProfile: 'UNCAPPED',
        strategyType: 'PROTECTION',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
    },
];

const defaultAssets: MarketAsset[] = [
    {
        symbol: 'PETR4.SA',
        shortName: 'Petrobras',
        exchange: 'B3',
        currency: 'BRL',
    },
    {
        symbol: 'VALE3.SA',
        shortName: 'Vale',
        exchange: 'B3',
        currency: 'BRL',
    },
];


describe('Simulator page', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        const baseAuth = createAuthMock();

        useAuthMocked.mockReturnValue({
            ...baseAuth,
            user: baseUser,
            isAuthenticated: true,
        });

        useStrategiesMocked.mockReturnValue({
            strategies: defaultStrategies,
            loading: false,
            error: null,
            refetch: vi.fn(),
        });

        useMarketAssetsMocked.mockReturnValue({
            data: defaultAssets,
            error: null,
            isLoading: false,
            isPending: false,
            isFetching: false,
            isRefetching: false,
            isError: false,
            isSuccess: true,
            isInitialLoading: false,
            isPlaceholderData: false,
            isRefetchError: false,
            isLoadingError: false,
            isPaused: false,
            isStale: false,
            status: 'success',
            fetchStatus: 'idle',
            failureCount: 0,
            promise: Promise.resolve(),
            dataUpdatedAt: Date.now(),
            errorUpdatedAt: 0,
            isFetched: true,
            isFetchedAfterMount: true,
            isPreviousData: false,
            refetch: vi.fn(),
            remove: vi.fn(),
        } as unknown as UseMarketAssetsReturn);


        apiServiceMock.createSimulation.mockResolvedValue(
            {} as CreateSimulationResponse,
        );

        useLocationMock.mockReturnValue({
            state: null,
            pathname: '/simulator',
            search: '',
            hash: '',
            key: 'test',
        });
    });

    it('renderiza o formulário com estratégias e ativos carregados', () => {
        renderSimulator();

        expect(
            screen.getByRole('heading', {
                name: /Simulador de Estratégias/i,
            }),
        ).toBeInTheDocument();

        const strategySelect = screen.getByLabelText(/Estratégia/i);
        expect(strategySelect).toBeInTheDocument();
        expect(screen.getByText('Long Call')).toBeInTheDocument();
        expect(screen.getByText('Long Put')).toBeInTheDocument();


        const assetSelect = screen.getByLabelText(/Ativo/i);
        expect(assetSelect).toBeInTheDocument();
        expect(
            screen.getByText(/PETR4.SA - Petrobras/i),
        ).toBeInTheDocument();
        expect(screen.getByText(/VALE3.SA - Vale/i)).toBeInTheDocument();
    });

    it('mostra erro se tentar submeter sem preencher campos obrigatórios', async () => {
        renderSimulator();

        const submitButton = screen.getByRole('button', {
            name: /Executar Simulação/i,
        });

        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(toastErrorMock).toHaveBeenCalledWith(
                'Por favor, preencha todos os campos obrigatórios',
            );
        });

        expect(apiServiceMock.createSimulation).not.toHaveBeenCalled();
    });

    it('mostra erro quando usuário não está autenticado', async () => {
        const baseAuth = createAuthMock();

        useAuthMocked.mockReturnValue({
            ...baseAuth,
            user: null,
            isAuthenticated: false,
        });

        renderSimulator();

        const submitButton = screen.getByRole('button', {
            name: /Executar Simulação/i,
        });

        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(toastErrorMock).toHaveBeenCalledWith(
                'Não foi possível identificar o usuário autenticado.',
            );
        });

        expect(apiServiceMock.createSimulation).not.toHaveBeenCalled();
    });

    it('mostra erro quando o capital inicial é inválido (<= 0)', async () => {
        renderSimulator();


        fireEvent.change(screen.getByLabelText(/Estratégia/i), {
            target: { value: 'strat-1' },
        });

        fireEvent.change(screen.getByLabelText(/Ativo/i), {
            target: { value: 'PETR4.SA' },
        });

        fireEvent.change(screen.getByLabelText(/Data de Início/i), {
            target: { value: '2024-01-01' },
        });

        fireEvent.change(screen.getByLabelText(/Data de Término/i), {
            target: { value: '2024-02-01' },
        });

        fireEvent.change(screen.getByLabelText(/Capital inicial/i), {
            target: { value: '0' },
        });

        const submitButton = screen.getByRole('button', {
            name: /Executar Simulação/i,
        });

        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(toastErrorMock).toHaveBeenCalledWith(
                'Informe um capital inicial válido (maior que zero)',
            );
        });

        expect(apiServiceMock.createSimulation).not.toHaveBeenCalled();
    });

    it('envia os dados corretos e redireciona ao criar simulação com sucesso', async () => {
        renderSimulator();


        fireEvent.change(
            screen.getByLabelText(/Nome da Simulação \(Opcional\)/i),
            {
                target: { value: 'Simulação de teste' },
            },
        );

        fireEvent.change(screen.getByLabelText(/Estratégia/i), {
            target: { value: 'strat-1' },
        });


        fireEvent.change(screen.getByLabelText(/Ativo/i), {
            target: { value: 'PETR4.SA' },
        });


        fireEvent.change(screen.getByLabelText(/Capital inicial/i), {
            target: { value: '10000' },
        });


        fireEvent.change(screen.getByLabelText(/Data de Início/i), {
            target: { value: '2024-01-01' },
        });

        fireEvent.change(screen.getByLabelText(/Data de Término/i), {
            target: { value: '2024-02-01' },
        });

        const submitButton = screen.getByRole('button', {
            name: /Executar Simulação/i,
        });

        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(apiServiceMock.createSimulation).toHaveBeenCalledTimes(1);
        });

        const payload =
            apiServiceMock.createSimulation.mock.calls[0]?.[0] as SimulationPayload;

        expect(payload).toMatchObject({
            userId: baseUser.id,
            strategyId: 'strat-1',
            assetSymbol: 'PETR4.SA',
            simulationName: 'Simulação de teste',
            startDate: '2024-01-01',
            endDate: '2024-02-01',
        });

        expect(payload.initialCapital).toBe('10000.00');

        expect(toastSuccessMock).toHaveBeenCalledWith(
            'Simulação criada com sucesso!',
        );
        expect(navigateMock).toHaveBeenCalledWith('/simulations');
    });

    it('mostra erro de toast quando API falha ao criar simulação', async () => {
        apiServiceMock.createSimulation.mockRejectedValueOnce(
            new Error('Falha na API'),
        );

        renderSimulator();


        fireEvent.change(
            screen.getByLabelText(/Nome da Simulação \(Opcional\)/i),
            {
                target: { value: 'Simulação falha' },
            },
        );

        fireEvent.change(screen.getByLabelText(/Estratégia/i), {
            target: { value: 'strat-1' },
        });

        fireEvent.change(screen.getByLabelText(/Ativo/i), {
            target: { value: 'PETR4.SA' },
        });

        fireEvent.change(screen.getByLabelText(/Capital inicial/i), {
            target: { value: '5000' },
        });

        fireEvent.change(screen.getByLabelText(/Data de Início/i), {
            target: { value: '2024-01-01' },
        });

        fireEvent.change(screen.getByLabelText(/Data de Término/i), {
            target: { value: '2024-01-31' },
        });

        fireEvent.click(
            screen.getByRole('button', {
                name: /Executar Simulação/i,
            }),
        );

        await waitFor(() => {
            expect(apiServiceMock.createSimulation).toHaveBeenCalled();
        });

        expect(toastErrorMock).toHaveBeenCalledWith(
            'Erro ao criar simulação',
        );
        expect(navigateMock).not.toHaveBeenCalled();
    });

    it('pré-preenche a estratégia e o nome da simulação a partir do location.state', () => {

        useLocationMock.mockReturnValue({
            state: {
                strategyId: 'strat-2',
                strategyName: 'Long Put',
            },
            pathname: '/simulator',
            search: '',
            hash: '',
            key: 'test-state',
        });

        renderSimulator();

        const strategySelect = screen.getByLabelText(/Estratégia/i) as HTMLSelectElement;
        const simNameInput = screen.getByLabelText(
            /Nome da Simulação \(Opcional\)/i,
        ) as HTMLInputElement;

        expect(strategySelect.value).toBe('strat-2');
        expect(simNameInput.value).toBe('Simulação Long Put');
    });
});
