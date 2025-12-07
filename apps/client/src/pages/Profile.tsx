import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { User, Lock, Trash2, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

export default function Profile() {
    const { user, logout } = useAuth();
    const [isEditingPassword, setIsEditingPassword] = useState(false);
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });
    const [isLoading, setIsLoading] = useState(false);

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setPasswordData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (
            !passwordData.currentPassword ||
            !passwordData.newPassword ||
            !passwordData.confirmPassword
        ) {
            toast.error('Por favor, preencha todos os campos');
            return;
        }

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            toast.error('As senhas não conferem');
            return;
        }

        try {
            setIsLoading(true);
            // Simulação de envio
            await new Promise((resolve) => setTimeout(resolve, 1000));
            toast.success('Senha alterada com sucesso!');
            setPasswordData({
                currentPassword: '',
                newPassword: '',
                confirmPassword: '',
            });
            setIsEditingPassword(false);
        } catch {
            toast.error('Erro ao alterar senha');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (
            window.confirm(
                'Tem certeza que deseja deletar sua conta? Esta ação não pode ser desfeita.',
            )
        ) {
            try {
                setIsLoading(true);
                // Simulação de envio
                await new Promise((resolve) => setTimeout(resolve, 1000));
                toast.success('Conta deletada com sucesso');
                await logout();
            } catch {
                toast.error('Erro ao deletar conta');
            } finally {
                setIsLoading(false);
            }
        }
    };

    const memberSince = user?.createdAt
        ? new Date(user.createdAt).toLocaleDateString('pt-BR')
        : '-';

    const experienceLabel = user?.experienceLevel ?? 'Não informado';

    return (
        <div className="space-y-8 max-w-4xl mx-auto">
            {/* Header */}
            <header className="space-y-2">
                <p className="text-xs font-semibold tracking-[0.2em] uppercase text-muted-foreground">
                    Conta
                </p>
                <h1 className="text-3xl md:text-4xl font-bold">Meu Perfil</h1>
                <p className="text-sm md:text-base text-muted-foreground max-w-xl">
                    Gerencie suas informações, segurança e configurações da sua
                    conta.
                </p>
            </header>

            {/* Card principal de perfil */}
            <section className="ts-glass-surface ts-glass-hover-soft rounded-2xl p-6 md:p-8">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-full bg-primary/15 flex items-center justify-center shadow-inner">
                            <User className="w-7 h-7 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-xl md:text-2xl font-semibold">
                                {user?.username ?? 'Usuário'}
                            </h2>
                            <p className="text-sm text-muted-foreground">
                                {user?.email ?? 'email não informado'}
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <span className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium bg-primary/10 text-primary border border-primary/40">
                            <ShieldCheck className="w-3 h-3" />
                            Nível: {experienceLabel}
                        </span>
                        <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium bg-muted/50 text-muted-foreground">
                            Membro desde&nbsp;
                            <span className="text-foreground font-semibold">
                                {memberSince}
                            </span>
                        </span>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <ProfileField
                        label="Usuário"
                        value={user?.username ?? '-'}
                    />
                    <ProfileField
                        label="Email"
                        value={user?.email ?? '-'}
                    />
                    <ProfileField
                        label="Nível de Experiência"
                        value={experienceLabel}
                    />
                    <ProfileField
                        label="Membro desde"
                        value={memberSince}
                    />
                </div>
            </section>

            {/* Segurança da conta + Zona de perigo */}
            <section className="grid gap-6 md:grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)] items-start">
                {/* Alterar senha */}
                <div className="ts-glass-surface ts-glass-hover-soft rounded-2xl p-6 md:p-7">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                            <Lock className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-base md:text-lg font-semibold">
                                Segurança da conta
                            </h2>
                            <p className="text-xs md:text-sm text-muted-foreground">
                                Atualize sua senha regularmente para manter sua
                                conta protegida.
                            </p>
                        </div>
                    </div>

                    {!isEditingPassword ? (
                        <button
                            onClick={() => setIsEditingPassword(true)}
                            className="ts-btn-primary text-sm"
                        >
                            Alterar Senha
                        </button>
                    ) : (
                        <form
                            onSubmit={handlePasswordSubmit}
                            className="space-y-4 mt-2"
                        >
                            <div>
                                <label
                                    htmlFor="currentPassword"
                                    className="block text-sm font-medium mb-2 text-card-foreground/90"
                                >
                                    Senha Atual
                                </label>
                                <input
                                    id="currentPassword"
                                    type="password"
                                    name="currentPassword"
                                    value={passwordData.currentPassword}
                                    onChange={handlePasswordChange}
                                    className="w-full px-4 py-2.5 rounded-lg border border-border/60 bg-background/60 focus:outline-none focus:ring-2 focus:ring-primary/70 focus:border-primary/60 text-sm"
                                    disabled={isLoading}
                                />
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                    <label
                                        htmlFor="newPassword"
                                        className="block text-sm font-medium mb-2 text-card-foreground/90"
                                    >
                                        Nova Senha
                                    </label>
                                    <input
                                        id="newPassword"
                                        type="password"
                                        name="newPassword"
                                        value={passwordData.newPassword}
                                        onChange={handlePasswordChange}
                                        className="w-full px-4 py-2.5 rounded-lg border border-border/60 bg-background/60 focus:outline-none focus:ring-2 focus:ring-primary/70 focus:border-primary/60 text-sm"
                                        disabled={isLoading}
                                    />
                                </div>

                                <div>
                                    <label
                                        htmlFor="confirmPassword"
                                        className="block text-sm font-medium mb-2 text-card-foreground/90"
                                    >
                                        Confirmar Nova Senha
                                    </label>
                                    <input
                                        id="confirmPassword"
                                        type="password"
                                        name="confirmPassword"
                                        value={passwordData.confirmPassword}
                                        onChange={handlePasswordChange}
                                        className="w-full px-4 py-2.5 rounded-lg border border-border/60 bg-background/60 focus:outline-none focus:ring-2 focus:ring-primary/70 focus:border-primary/60 text-sm"
                                        disabled={isLoading}
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3 pt-2">
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="ts-btn-primary w-full sm:w-auto disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                    {isLoading ? 'Salvando...' : 'Salvar'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsEditingPassword(false);
                                        setPasswordData({
                                            currentPassword: '',
                                            newPassword: '',
                                            confirmPassword: '',
                                        });
                                    }}
                                    className="ts-btn-secondary w-full sm:w-auto"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </form>
                    )}
                </div>

                {/* Deletar conta */}
                <div className="rounded-2xl border border-destructive/50 bg-destructive/10 p-6 md:p-7">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-destructive/20">
                            <Trash2 className="w-4 h-4 text-destructive" />
                        </div>
                        <div>
                            <h2 className="text-base md:text-lg font-semibold text-destructive">
                                Zona de perigo
                            </h2>
                            <p className="text-xs md:text-sm text-destructive/80">
                                A exclusão é permanente e não pode ser desfeita.
                            </p>
                        </div>
                    </div>

                    <p className="text-xs md:text-sm text-muted-foreground mb-4">
                        Todos os seus dados, simulações e preferências serão
                        removidos de forma definitiva. Tenha certeza antes de
                        continuar.
                    </p>

                    <button
                        onClick={handleDeleteAccount}
                        disabled={isLoading}
                        className="w-full px-4 py-2.5 rounded-lg bg-destructive text-destructive-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Deletar Minha Conta
                    </button>
                </div>
            </section>
        </div>
    );
}

interface ProfileFieldProps {
    label: string;
    value: string;
}

function ProfileField({ label, value }: ProfileFieldProps) {
    return (
        <div className="rounded-xl border border-border/60 bg-card/40 px-4 py-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {label}
            </p>
            <p className="mt-1 text-sm md:text-base text-foreground">
                {value}
            </p>
        </div>
    );
}