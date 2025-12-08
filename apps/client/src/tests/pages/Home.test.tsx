import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';

import Home from '@/pages/Home';
import { useAuth } from '@/hooks/useAuth';
import { renderWithProviders } from '../test-utils';
import { createAuthMock } from '../mocks/authMocks';

const mockNavigate = vi.hoisted(() =>
    vi.fn<(path: string) => void>(),
);

const toastErrorMock = vi.hoisted(() =>
    vi.fn<(message: string) => void>(),
);

const toastSuccessMock = vi.hoisted(() =>
    vi.fn<(message: string) => void>(),
);

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual<typeof import('react-router-dom')>(
        'react-router-dom',
    );

    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

vi.mock('sonner', () => ({
    toast: {
        error: toastErrorMock,
        success: toastSuccessMock,
    },
}));

vi.mock('@/hooks/useAuth', () => ({
    useAuth: vi.fn(),
}));

vi.mock('@/components/home/AuthenticatedCard', () => ({
    AuthenticatedCard: (props: {
        userDisplayName: string;
        onGoDashboard: () => void;
        onLogout: () => void;
        children?: ReactNode;
    }) => (
        <div data-testid="authenticated-card">
            <span>Olá, {props.userDisplayName}</span>
            <button type="button" onClick={props.onGoDashboard}>
                go-dashboard
            </button>
            <button type="button" onClick={props.onLogout}>
                logout
            </button>
            {props.children}
        </div>
    ),
}));

const useAuthMocked = vi.mocked(useAuth);

function renderHome() {
    return renderWithProviders(<Home />);
}

function getLoginSubmitButton(): HTMLButtonElement {
    const buttons = screen.getAllByRole('button', { name: 'Entrar' });

    const submitButton = buttons.find(
        (btn): btn is HTMLButtonElement =>
            btn instanceof HTMLButtonElement && btn.type === 'submit',
    );

    if (!submitButton) {
        throw new Error('Botão de submit "Entrar" não encontrado');
    }

    return submitButton;
}

interface BaseUser {
    id: string;
    username: string;
    email: string;
    experienceLevel: string;
    createdAt: string;
    updatedAt: string;
}

const baseUser: BaseUser = {
    id: 'user-1',
    username: 'TestUser',
    email: 'test@example.com',
    experienceLevel: 'NOVICE',
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
};

type LoginFn = (email: string, password: string) => Promise<void>;
type RegisterFn = (
    username: string,
    email: string,
    password: string,
    experienceLevel?: string,
) => Promise<void>;
type LogoutFn = () => Promise<void>;

type LoginMock = ReturnType<typeof vi.fn<LoginFn>>;
type RegisterMock = ReturnType<typeof vi.fn<RegisterFn>>;
type LogoutMock = ReturnType<typeof vi.fn<LogoutFn>>;

let loginMock: LoginMock;
let registerMock: RegisterMock;
let logoutMock: LogoutMock;

describe('Home', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        loginMock = vi.fn<LoginFn>().mockResolvedValue(undefined);
        registerMock = vi.fn<RegisterFn>().mockResolvedValue(undefined);
        logoutMock = vi.fn<LogoutFn>().mockResolvedValue(undefined);

        const baseAuth = createAuthMock();

        useAuthMocked.mockReturnValue({
            ...baseAuth,
            user: null,
            isAuthenticated: false,
            login: loginMock,
            register: registerMock,
            logout: logoutMock,
        });
    });

    it('exibe formulário de login por padrão', () => {
        renderHome();

        expect(
            screen.getByRole('heading', { name: /Acesse sua conta/i }),
        ).toBeInTheDocument();

        const entrarButtons = screen.getAllByRole('button', { name: 'Entrar' });
        expect(entrarButtons.length).toBeGreaterThan(0);

        expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/^Senha$/i)).toBeInTheDocument();
    });

    it('mostra erro ao tentar logar com campos vazios', () => {
        renderHome();

        const submitButton = getLoginSubmitButton();
        fireEvent.click(submitButton);

        expect(loginMock).not.toHaveBeenCalled();
        expect(toastErrorMock).toHaveBeenCalledWith(
            'Por favor, preencha todos os campos',
        );
    });

    it('realiza login com sucesso e navega para o dashboard', async () => {
        renderHome();

        fireEvent.change(screen.getByLabelText(/Email/i), {
            target: { value: 'user@example.com' },
        });

        fireEvent.change(screen.getByLabelText(/^Senha$/i), {
            target: { value: 'senha123' },
        });

        const submitButton = getLoginSubmitButton();
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(loginMock).toHaveBeenCalledWith(
                'user@example.com',
                'senha123',
            );
        });

        expect(toastSuccessMock).toHaveBeenCalledWith(
            'Login realizado com sucesso!',
        );
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });

    it('mostra mensagem específica da API ao falhar login com erro do tipo Axios', async () => {
        const error = {
            isAxiosError: true as const,
            response: {
                data: { message: 'Credenciais inválidas' },
            },
        };

        loginMock.mockRejectedValueOnce(error);

        renderHome();

        fireEvent.change(screen.getByLabelText(/Email/i), {
            target: { value: 'user@example.com' },
        });

        fireEvent.change(screen.getByLabelText(/^Senha$/i), {
            target: { value: 'senha123' },
        });

        const submitButton = getLoginSubmitButton();
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(loginMock).toHaveBeenCalled();
        });

        expect(toastErrorMock).toHaveBeenCalledWith('Credenciais inválidas');
    });

    it('mostra mensagem genérica ao falhar login com erro não Axios', async () => {
        loginMock.mockRejectedValueOnce(new Error('Falha inesperada'));

        renderHome();

        fireEvent.change(screen.getByLabelText(/Email/i), {
            target: { value: 'user@example.com' },
        });

        fireEvent.change(screen.getByLabelText(/^Senha$/i), {
            target: { value: 'senha123' },
        });

        const submitButton = getLoginSubmitButton();
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(loginMock).toHaveBeenCalled();
        });

        expect(toastErrorMock).toHaveBeenCalledWith('Erro ao fazer login');
    });

    it('permite alternar para modo de cadastro e exibe campos adicionais', () => {
        renderHome();

        const registerTab = screen.getByRole('button', { name: 'Cadastrar' });
        fireEvent.click(registerTab);

        expect(screen.getByLabelText(/Usuário/i)).toBeInTheDocument();
        expect(
            screen.getByLabelText(/Confirmar Senha/i),
        ).toBeInTheDocument();
        expect(
            screen.getByLabelText(/Nível de Experiência/i),
        ).toBeInTheDocument();
    });

    it('mostra erro se campos obrigatórios de cadastro não forem preenchidos', () => {
        renderHome();

        fireEvent.click(screen.getByRole('button', { name: 'Cadastrar' }));

        const submitButton = screen.getByRole('button', {
            name: 'Criar conta',
        });
        fireEvent.click(submitButton);

        expect(registerMock).not.toHaveBeenCalled();
        expect(toastErrorMock).toHaveBeenCalledWith(
            'Por favor, preencha todos os campos',
        );
    });

    it('mostra erro quando as senhas não conferem no cadastro', () => {
        renderHome();

        fireEvent.click(screen.getByRole('button', { name: 'Cadastrar' }));

        fireEvent.change(screen.getByLabelText(/Usuário/i), {
            target: { value: 'user123' },
        });

        fireEvent.change(screen.getByLabelText(/Email/i), {
            target: { value: 'user@example.com' },
        });

        fireEvent.change(screen.getByLabelText(/^Senha$/i), {
            target: { value: 'senha123' },
        });

        fireEvent.change(screen.getByLabelText(/Confirmar Senha/i), {
            target: { value: 'senha456' },
        });

        fireEvent.click(
            screen.getByRole('button', { name: 'Criar conta' }),
        );

        expect(registerMock).not.toHaveBeenCalled();
        expect(toastErrorMock).toHaveBeenCalledWith(
            'As senhas não conferem',
        );
    });

    it('mostra erro quando a senha é muito curta no cadastro', () => {
        renderHome();

        fireEvent.click(screen.getByRole('button', { name: 'Cadastrar' }));

        fireEvent.change(screen.getByLabelText(/Usuário/i), {
            target: { value: 'user123' },
        });

        fireEvent.change(screen.getByLabelText(/Email/i), {
            target: { value: 'user@example.com' },
        });

        fireEvent.change(screen.getByLabelText(/^Senha$/i), {
            target: { value: '12345' },
        });

        fireEvent.change(screen.getByLabelText(/Confirmar Senha/i), {
            target: { value: '12345' },
        });

        fireEvent.click(
            screen.getByRole('button', { name: 'Criar conta' }),
        );

        expect(registerMock).not.toHaveBeenCalled();
        expect(toastErrorMock).toHaveBeenCalledWith(
            'A senha deve ter pelo menos 6 caracteres',
        );
    });

    it('realiza cadastro com sucesso e navega para o dashboard', async () => {
        renderHome();

        fireEvent.click(screen.getByRole('button', { name: 'Cadastrar' }));

        fireEvent.change(screen.getByLabelText(/Usuário/i), {
            target: { value: 'user123' },
        });

        fireEvent.change(screen.getByLabelText(/Email/i), {
            target: { value: 'user@example.com' },
        });

        fireEvent.change(screen.getByLabelText(/^Senha$/i), {
            target: { value: 'senha123' },
        });

        fireEvent.change(screen.getByLabelText(/Confirmar Senha/i), {
            target: { value: 'senha123' },
        });

        const experienceSelect = screen.getByLabelText(
            /Nível de Experiência/i,
        );
        fireEvent.change(experienceSelect, {
            target: { value: 'INTERMEDIATE' },
        });

        fireEvent.click(
            screen.getByRole('button', { name: 'Criar conta' }),
        );

        await waitFor(() => {
            expect(registerMock).toHaveBeenCalledWith(
                'user123',
                'user@example.com',
                'senha123',
                'INTERMEDIATE',
            );
        });

        expect(toastSuccessMock).toHaveBeenCalledWith(
            'Conta criada com sucesso!',
        );
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });

    it('mostra mensagem específica da API ao falhar cadastro com erro do tipo Axios', async () => {
        const error = {
            isAxiosError: true as const,
            response: {
                data: { message: 'Email já cadastrado' },
            },
        };

        registerMock.mockRejectedValueOnce(error);

        renderHome();

        fireEvent.click(screen.getByRole('button', { name: 'Cadastrar' }));

        fireEvent.change(screen.getByLabelText(/Usuário/i), {
            target: { value: 'user123' },
        });

        fireEvent.change(screen.getByLabelText(/Email/i), {
            target: { value: 'user@example.com' },
        });

        fireEvent.change(screen.getByLabelText(/^Senha$/i), {
            target: { value: 'senha123' },
        });

        fireEvent.change(screen.getByLabelText(/Confirmar Senha/i), {
            target: { value: 'senha123' },
        });

        fireEvent.click(screen.getByRole('button', { name: 'Criar conta' }));

        await waitFor(() => {
            expect(registerMock).toHaveBeenCalled();
        });

        expect(toastErrorMock).toHaveBeenCalledWith('Email já cadastrado');
    });

    it('mostra mensagem genérica ao falhar cadastro com erro não Axios', async () => {
        registerMock.mockRejectedValueOnce(new Error('Falha inesperada'));

        renderHome();

        fireEvent.click(screen.getByRole('button', { name: 'Cadastrar' }));

        fireEvent.change(screen.getByLabelText(/Usuário/i), {
            target: { value: 'user123' },
        });

        fireEvent.change(screen.getByLabelText(/Email/i), {
            target: { value: 'user@example.com' },
        });

        fireEvent.change(screen.getByLabelText(/^Senha$/i), {
            target: { value: 'senha123' },
        });

        fireEvent.change(screen.getByLabelText(/Confirmar Senha/i), {
            target: { value: 'senha123' },
        });

        fireEvent.click(
            screen.getByRole('button', { name: 'Criar conta' }),
        );

        await waitFor(() => {
            expect(registerMock).toHaveBeenCalled();
        });

        expect(toastErrorMock).toHaveBeenCalledWith('Erro ao registrar');
    });

    it('quando usuário está logado, exibe AuthenticatedCard e permite ir para o dashboard', () => {
        const baseAuth = createAuthMock();

        useAuthMocked.mockReturnValue({
            ...baseAuth,
            user: baseUser,
            isAuthenticated: true,
            login: loginMock,
            register: registerMock,
            logout: logoutMock,
        });

        renderHome();

        const card = screen.getByTestId('authenticated-card');
        expect(card).toBeInTheDocument();
        expect(card.textContent ?? '').toContain('Olá, TestUser');

        fireEvent.click(screen.getByText('go-dashboard'));
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });

    it('ao deslogar com sucesso mostra toast de sucesso', async () => {
        const baseAuth = createAuthMock();

        useAuthMocked.mockReturnValue({
            ...baseAuth,
            user: baseUser,
            isAuthenticated: true,
            login: loginMock,
            register: registerMock,
            logout: logoutMock,
        });

        renderHome();

        fireEvent.click(screen.getByText('logout'));

        await waitFor(() => {
            expect(logoutMock).toHaveBeenCalled();
        });

        expect(toastErrorMock).not.toHaveBeenCalledWith(
            'Erro ao sair da conta.',
        );
        expect(toastSuccessMock).toHaveBeenCalledWith(
            'Você saiu da sua conta.',
        );
    });

    it('ao falhar o logout mostra erro e ainda assim mostra mensagem de saída', async () => {
        logoutMock.mockRejectedValueOnce(new Error('Falha no logout'));

        const baseAuth = createAuthMock();

        useAuthMocked.mockReturnValue({
            ...baseAuth,
            user: baseUser,
            isAuthenticated: true,
            login: loginMock,
            register: registerMock,
            logout: logoutMock,
        });

        renderHome();

        fireEvent.click(screen.getByText('logout'));

        await waitFor(() => {
            expect(logoutMock).toHaveBeenCalled();
        });

        expect(toastErrorMock).toHaveBeenCalledWith('Erro ao sair da conta.');
        expect(toastSuccessMock).toHaveBeenCalledWith(
            'Você saiu da sua conta.',
        );
    });

    it('ao clicar em "Role para ver mais" faz scroll na página', () => {
        const scrollSpy = vi
            .spyOn(window, 'scrollTo')
            .mockImplementation((_arg: number | ScrollToOptions) => {
                return;
            });

        renderHome();

        const scrollButton = screen.getByRole('button', {
            name: /Role para ver mais/i,
        });

        fireEvent.click(scrollButton);

        expect(scrollSpy).toHaveBeenCalledTimes(1);

        const firstCallArg = scrollSpy.mock.calls[0]?.[0];

        if (typeof firstCallArg !== 'number') {
            expect(firstCallArg).toMatchObject({
                top: window.innerHeight,
                behavior: 'smooth',
            });
        }

        scrollSpy.mockRestore();
    });
});