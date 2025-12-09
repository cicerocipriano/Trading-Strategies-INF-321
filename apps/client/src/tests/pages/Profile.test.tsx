import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';

import Profile from '@/pages/Profile';
import { renderWithProviders } from '../test-utils';

vi.mock('sonner', () => {
    return {
        toast: {
            error: vi.fn<(message: string) => void>(),
            success: vi.fn<(message: string) => void>(),
        },
    };
});

vi.mock('@/hooks/useAuth', () => {
    return {
        useAuth: vi.fn(),
    };
});

import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

interface MockUser {
    id: string;
    username: string;
    email: string;
    experienceLevel?: string;
    createdAt?: string;
}

type LoginFn = (email: string, password: string) => Promise<void>;
type RegisterFn = (
    username: string,
    email: string,
    password: string,
    experienceLevel?: string,
) => Promise<void>;
type LogoutFn = () => Promise<void>;

interface UseAuthReturn {
    user: MockUser | null;
    loading: boolean;
    error: string | null;
    isAuthenticated: boolean;
    login: LoginFn;
    register: RegisterFn;
    logout: LogoutFn;
}

type UseAuthFn = () => UseAuthReturn;
type UseAuthMock = ReturnType<typeof vi.fn<UseAuthFn>>;

const useAuthMocked = useAuth as unknown as UseAuthMock;

const toastMock = toast as unknown as {
    error: (message: string) => void;
    success: (message: string) => void;
};

type LoginMock = ReturnType<typeof vi.fn<LoginFn>>;
type RegisterMock = ReturnType<typeof vi.fn<RegisterFn>>;
type LogoutMock = ReturnType<typeof vi.fn<LogoutFn>>;

let loginMock: LoginMock;
let registerMock: RegisterMock;
let logoutMock: LogoutMock;

const baseUser: MockUser = {
    id: 'user-1',
    username: 'TestUser',
    email: 'test@example.com',
    experienceLevel: 'INTERMEDIATE',
    createdAt: '2025-01-01T12:00:00.000Z',
};

function renderProfile() {
    return renderWithProviders(<Profile />);
}

describe('Profile page', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        loginMock = vi.fn<LoginFn>().mockResolvedValue(undefined);
        registerMock = vi.fn<RegisterFn>().mockResolvedValue(undefined);
        logoutMock = vi.fn<LogoutFn>().mockResolvedValue(undefined);

        const authValue: UseAuthReturn = {
            user: baseUser,
            loading: false,
            error: null,
            isAuthenticated: true,
            login: loginMock,
            register: registerMock,
            logout: logoutMock,
        };

        useAuthMocked.mockReturnValue(authValue);
    });

    it('exibe dados básicos do usuário', () => {
        renderProfile();

        expect(
            screen.getByRole('heading', { name: /Meu Perfil/i }),
        ).toBeInTheDocument();

        // pode haver mais de um "TestUser" na tela
        const nameElements = screen.getAllByText('TestUser');
        expect(nameElements[0]).toBeInTheDocument();

        const emailElements = screen.getAllByText('test@example.com');
        expect(emailElements[0]).toBeInTheDocument();

        const levelChip = screen.getAllByText((content) =>
            content.startsWith('Nível:'),
        )[0];
        expect(levelChip).toHaveTextContent('Nível: INTERMEDIATE');

        const expectedMemberSince = new Date(
            baseUser.createdAt as string,
        ).toLocaleDateString('pt-BR');

        const memberSinceEls = screen.getAllByText(expectedMemberSince);
        expect(memberSinceEls[0]).toBeInTheDocument();
    });

    it('quando não há usuário, mostra placeholders', () => {
        useAuthMocked.mockReturnValue({
            user: null,
            loading: false,
            error: null,
            isAuthenticated: false,
            login: loginMock,
            register: registerMock,
            logout: logoutMock,
        });

        renderProfile();

        const userTexts = screen.getAllByText('Usuário');
        expect(userTexts.length).toBeGreaterThan(0);

        const emailNaoInformadoEls = screen.getAllByText('email não informado');
        expect(emailNaoInformadoEls[0]).toBeInTheDocument();

        expect(screen.getAllByText('-').length).toBeGreaterThan(0);
    });

    it('ao clicar em "Alterar Senha" exibe formulário de alteração', () => {
        renderProfile();

        const changePasswordButton = screen.getByRole('button', {
            name: /Alterar Senha/i,
        });
        fireEvent.click(changePasswordButton);

        const [currentPassInput] = screen.getAllByLabelText(/Senha Atual/i);
        const [newPassInput] = screen.getAllByLabelText(/Nova Senha/i);
        const [confirmPassInput] = screen.getAllByLabelText(
            /Confirmar Nova Senha/i,
        );

        expect(currentPassInput).toBeInTheDocument();
        expect(newPassInput).toBeInTheDocument();
        expect(confirmPassInput).toBeInTheDocument();

        expect(
            screen.getByRole('button', { name: /Salvar/i }),
        ).toBeInTheDocument();
        expect(
            screen.getByRole('button', { name: /Cancelar/i }),
        ).toBeInTheDocument();
    });

    it('valida campos obrigatórios ao salvar senha', () => {
        renderProfile();

        const changePasswordButton = screen.getByRole('button', {
            name: /Alterar Senha/i,
        });
        fireEvent.click(changePasswordButton);

        const saveButton = screen.getByRole('button', { name: /Salvar/i });
        fireEvent.click(saveButton);

        expect(toastMock.error).toHaveBeenCalledWith(
            'Por favor, preencha todos os campos',
        );
    });

    it('valida quando novas senhas não conferem', () => {
        renderProfile();

        const changePasswordButton = screen.getByRole('button', {
            name: /Alterar Senha/i,
        });
        fireEvent.click(changePasswordButton);

        const [currentPassInput] = screen.getAllByLabelText(/Senha Atual/i);
        const [newPassInput] = screen.getAllByLabelText(/Nova Senha/i);
        const [confirmPassInput] = screen.getAllByLabelText(
            /Confirmar Nova Senha/i,
        );

        fireEvent.change(currentPassInput, {
            target: { value: 'senha-atual' },
        });
        fireEvent.change(newPassInput, {
            target: { value: 'nova-senha' },
        });
        fireEvent.change(confirmPassInput, {
            target: { value: 'outra-senha' },
        });

        const saveButton = screen.getByRole('button', { name: /Salvar/i });
        fireEvent.click(saveButton);

        expect(toastMock.error).toHaveBeenCalledWith(
            'As senhas não conferem',
        );
    });

    it('altera senha com sucesso, limpa campos e fecha formulário', async () => {
        renderProfile();

        const changePasswordButton = screen.getByRole('button', {
            name: /Alterar Senha/i,
        });
        fireEvent.click(changePasswordButton);

        const [currentPassInput] = screen.getAllByLabelText(/Senha Atual/i);
        const [newPassInput] = screen.getAllByLabelText(/Nova Senha/i);
        const [confirmPassInput] = screen.getAllByLabelText(
            /Confirmar Nova Senha/i,
        );

        fireEvent.change(currentPassInput, {
            target: { value: 'senha-atual' },
        });
        fireEvent.change(newPassInput, {
            target: { value: 'nova-senha' },
        });
        fireEvent.change(confirmPassInput, {
            target: { value: 'nova-senha' },
        });

        const saveButton = screen.getByRole('button', { name: /Salvar/i });
        fireEvent.click(saveButton);

        await waitFor(
            () => {
                expect(toastMock.success).toHaveBeenCalledWith(
                    'Senha alterada com sucesso!',
                );
            },
            { timeout: 2000 },
        );

        expect(
            screen.queryByLabelText(/Senha Atual/i),
        ).not.toBeInTheDocument();
        expect(
            screen.getByRole('button', { name: /Alterar Senha/i }),
        ).toBeInTheDocument();
    });

    it('ao cancelar edição de senha fecha formulário e limpa campos', () => {
        renderProfile();

        const changePasswordButton = screen.getByRole('button', {
            name: /Alterar Senha/i,
        });
        fireEvent.click(changePasswordButton);

        const [currentPassInput] = screen.getAllByLabelText(/Senha Atual/i);
        fireEvent.change(currentPassInput, {
            target: { value: 'alguma-coisa' },
        });

        const cancelButton = screen.getByRole('button', {
            name: /Cancelar/i,
        });
        fireEvent.click(cancelButton);

        expect(
            screen.queryByLabelText(/Senha Atual/i),
        ).not.toBeInTheDocument();
        expect(
            screen.getByRole('button', { name: /Alterar Senha/i }),
        ).toBeInTheDocument();
    });

    it('se usuário cancelar o confirm ao deletar conta, não chama logout nem mostra toasts', () => {
        const confirmSpy = vi
            .spyOn(window, 'confirm')
            .mockReturnValue(false);

        renderProfile();

        const deleteButton = screen.getByRole('button', {
            name: /Deletar Minha Conta/i,
        });
        fireEvent.click(deleteButton);

        expect(confirmSpy).toHaveBeenCalledTimes(1);
        expect(logoutMock).not.toHaveBeenCalled();
        expect(toastMock.success).not.toHaveBeenCalled();
        expect(toastMock.error).not.toHaveBeenCalled();

        confirmSpy.mockRestore();
    });

    it('ao confirmar exclusão de conta chama logout e mostra toast de sucesso', async () => {
        const confirmSpy = vi
            .spyOn(window, 'confirm')
            .mockReturnValue(true);

        renderProfile();

        const deleteButton = screen.getByRole('button', {
            name: /Deletar Minha Conta/i,
        });
        fireEvent.click(deleteButton);

        await waitFor(
            () => {
                expect(logoutMock).toHaveBeenCalledTimes(1);
            },
            { timeout: 2000 },
        );

        expect(toastMock.success).toHaveBeenCalledWith(
            'Conta deletada com sucesso',
        );
        expect(toastMock.error).not.toHaveBeenCalledWith(
            'Erro ao deletar conta',
        );

        confirmSpy.mockRestore();
    });

    it('se ocorrer erro ao deletar conta, mostra toast de erro (além do de sucesso)', async () => {
        const confirmSpy = vi
            .spyOn(window, 'confirm')
            .mockReturnValue(true);

        logoutMock.mockRejectedValueOnce(
            new Error('Falha no logout'),
        );

        renderProfile();

        const deleteButton = screen.getByRole('button', {
            name: /Deletar Minha Conta/i,
        });
        fireEvent.click(deleteButton);

        await waitFor(
            () => {
                expect(logoutMock).toHaveBeenCalledTimes(1);
            },
            { timeout: 2000 },
        );

        expect(toastMock.success).toHaveBeenCalledWith(
            'Conta deletada com sucesso',
        );
        expect(toastMock.error).toHaveBeenCalledWith(
            'Erro ao deletar conta',
        );

        confirmSpy.mockRestore();
    });
});