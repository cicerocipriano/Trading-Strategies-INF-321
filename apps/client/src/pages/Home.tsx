import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import axios from 'axios';
import { useAuth } from '@/hooks/useAuth';
import { AuthenticatedCard } from '@/components/home/AuthenticatedCard';

type AuthMode = 'login' | 'register';

export default function Home() {
    const [mode, setMode] = useState<AuthMode>('login');

    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [experienceLevel, setExperienceLevel] = useState('NOVICE');
    const [isLoading, setIsLoading] = useState(false);

    const { user, login, register, logout } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (mode === 'login') {
            if (!email || !password) {
                toast.error('Por favor, preencha todos os campos');
                return;
            }

            try {
                setIsLoading(true);
                await login(email, password);
                toast.success('Login realizado com sucesso!');
                navigate('/dashboard');
            } catch (error: unknown) {
                const errorMessage =
                    axios.isAxiosError(error)
                        ? (error.response?.data as { message?: string })?.message ||
                        'Erro ao fazer login'
                        : 'Erro ao fazer login';

                toast.error(errorMessage);
            } finally {
                setIsLoading(false);
            }
        } else {
            if (!username || !email || !password || !confirmPassword) {
                toast.error('Por favor, preencha todos os campos');
                return;
            }

            if (password !== confirmPassword) {
                toast.error('As senhas não conferem');
                return;
            }

            if (password.length < 6) {
                toast.error('A senha deve ter pelo menos 6 caracteres');
                return;
            }

            try {
                setIsLoading(true);
                await register(username, email, password, experienceLevel);
                toast.success('Conta criada com sucesso!');
                navigate('/dashboard');
            } catch (error: unknown) {
                const errorMessage =
                    axios.isAxiosError(error)
                        ? (error.response?.data as { message?: string })?.message ||
                        'Erro ao registrar'
                        : 'Erro ao registrar';

                toast.error(errorMessage);
            } finally {
                setIsLoading(false);
            }
        }
    };

    const handleLogout = async () => {
        try {
            await logout();
            toast.success('Você saiu da sua conta.');
            setMode('login');
        } catch {
            toast.error('Erro ao sair da conta.');
        }
    };

    const userDisplayName = user?.username ?? user?.email ?? 'trader';

    return (
        <div className="min-h-screen bg-linear-to-r from-[#050316] via-[#05020f] to-[#020008] text-slate-100">
            <header className="pt-12 pb-6 px-4">
                <div className="max-w-5xl mx-auto text-center">
                    <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">
                        Bem-vindo ao <span className="text-purple-400">Sistema de Estratégias</span>
                    </h1>
                    <p className="mt-4 text-sm md:text-base text-slate-300 max-w-2xl mx-auto">
                        Entre na sua conta ou crie uma nova para explorar estratégias de opções
                        inspiradas no livro do Guy Cohen, simular operações e acompanhar seu perfil de risco.
                    </p>
                </div>
            </header>

            <main className="px-4">
                <section className="max-w-5xl mx-auto flex flex-col items-center gap-10 pb-16">
                    {user ? (
                        <AuthenticatedCard
                            userDisplayName={userDisplayName}
                            onGoDashboard={() => navigate('/dashboard')}
                            onLogout={handleLogout}
                        />
                    ) : (
                        <div className="w-full max-w-md bg-black/40 border border-white/10 rounded-2xl shadow-xl px-6 py-8 md:px-8">
                            <h2 className="text-xl md:text-2xl font-semibold text-center">
                                Acesse sua conta
                            </h2>
                            <p className="mt-1 text-center text-sm text-slate-300">
                                Faça login ou cadastre-se para começar
                            </p>

                            <div className="mt-6 mb-6 grid grid-cols-2 bg-black/60 rounded-xl p-1 text-sm">
                                <button
                                    type="button"
                                    onClick={() => setMode('login')}
                                    className={`py-2 rounded-lg transition-colors ${mode === 'login'
                                        ? 'bg-zinc-900 text-slate-100 font-semibold'
                                        : 'text-slate-400 hover:text-slate-200'
                                        }`}
                                >
                                    Entrar
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setMode('register')}
                                    className={`py-2 rounded-lg transition-colors ${mode === 'register'
                                        ? 'bg-zinc-900 text-slate-100 font-semibold'
                                        : 'text-slate-400 hover:text-slate-200'
                                        }`}
                                >
                                    Cadastrar
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                {mode === 'register' && (
                                    <div>
                                        <label
                                            htmlFor="username"
                                            className="block text-sm font-medium mb-1"
                                        >
                                            Usuário
                                        </label>
                                        <input
                                            id="username"
                                            type="text"
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value)}
                                            placeholder="seu_usuario"
                                            className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                                            disabled={isLoading}
                                        />
                                    </div>
                                )}

                                <div>
                                    <label
                                        htmlFor="email"
                                        className="block text-sm font-medium mb-1"
                                    >
                                        Email
                                    </label>
                                    <input
                                        id="email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="seu@email.com"
                                        className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        disabled={isLoading}
                                    />
                                </div>

                                <div>
                                    <label
                                        htmlFor="password"
                                        className="block text-sm font-medium mb-1"
                                    >
                                        Senha
                                    </label>
                                    <input
                                        id="password"
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        disabled={isLoading}
                                    />
                                </div>

                                {mode === 'register' && (
                                    <>
                                        <div>
                                            <label
                                                htmlFor="confirmPassword"
                                                className="block text-sm font-medium mb-1"
                                            >
                                                Confirmar Senha
                                            </label>
                                            <input
                                                id="confirmPassword"
                                                type="password"
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                placeholder="••••••••"
                                                className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                                                disabled={isLoading}
                                            />
                                        </div>

                                        <div>
                                            <label
                                                htmlFor="experienceLevel"
                                                className="block text-sm font-medium mb-1"
                                            >
                                                Nível de Experiência
                                            </label>
                                            <select
                                                id="experienceLevel"
                                                value={experienceLevel}
                                                onChange={(e) => setExperienceLevel(e.target.value)}
                                                className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                                                disabled={isLoading}
                                            >
                                                <option value="NOVICE">Iniciante</option>
                                                <option value="INTERMEDIATE">Intermediário</option>
                                                <option value="ADVANCED">Avançado</option>
                                            </select>
                                        </div>
                                    </>
                                )}

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="mt-2 w-full rounded-lg bg-linear-to-r from-purple-500 to-blue-500 py-2.5 text-sm font-semibold text-white shadow-lg shadow-purple-500/30 hover:opacity-95 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isLoading
                                        ? mode === 'login'
                                            ? 'Entrando...'
                                            : 'Registrando...'
                                        : mode === 'login'
                                            ? 'Entrar'
                                            : 'Criar conta'}
                                </button>
                            </form>

                            <p className="mt-4 text-center text-xs text-slate-400">
                                Ao continuar, você concorda com os termos de uso da plataforma.
                            </p>
                        </div>
                    )}

                    <section className="max-w-3xl text-center space-y-6">
                        <h2 className="text-2xl md:text-3xl font-bold">
                            Lorem Ipsum
                        </h2>
                        <p className="text-sm md:text-base text-slate-300">
                            Neque porro quisquam est qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit...
                        </p>

                        <div className="mt-4 grid gap-4 md:grid-cols-3 text-left">
                            <div className="rounded-xl border border-white/10 bg-black/40 p-4">
                                <h3 className="text-sm font-semibold mb-1">
                                    Why do we use it?
                                </h3>
                                <p className="text-xs text-slate-300">
                                    It is a long established fact that a reader will be distracted by the readable
                                    content of a page when looking at its layout.
                                </p>
                            </div>
                            <div className="rounded-xl border border-white/10 bg-black/40 p-4">
                                <h3 className="text-sm font-semibold mb-1">
                                    What is Lorem Ipsum?
                                </h3>
                                <p className="text-xs text-slate-300">
                                    Lorem Ipsum is simply dummy text of the printing and typesetting industry.
                                    Lorem Ipsum has been the industry's standard dummy text ever since the 1500s.
                                </p>
                            </div>
                            <div className="rounded-xl border border-white/10 bg-black/40 p-4">
                                <h3 className="text-sm font-semibold mb-1">
                                    Where can I get some?
                                </h3>
                                <p className="text-xs text-slate-300">
                                    There are many variations of passages of Lorem Ipsum available, but the majority
                                    have suffered alteration in some form, by injected humour, or randomised words
                                </p>
                            </div>
                        </div>
                    </section>
                </section>
            </main>
        </div>
    );
}
