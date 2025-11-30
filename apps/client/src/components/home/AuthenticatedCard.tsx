interface AuthenticatedCardProps {
  userDisplayName: string;
  onGoDashboard: () => void;
  onLogout: () => void;
}

export function AuthenticatedCard({
  userDisplayName,
  onGoDashboard,
  onLogout,
}: AuthenticatedCardProps) {
  return (
    <div className="w-full max-w-2xl bg-black/40 border border-white/10 rounded-2xl shadow-xl px-6 py-6 md:px-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div>
        <p className="text-xs uppercase tracking-wide text-slate-400">
          Sessão ativa
        </p>
        <p className="mt-1 text-lg font-semibold">
          Olá, {userDisplayName} 👋
        </p>
        <p className="mt-1 text-sm text-slate-300">
          Você já está autenticado. Continue de onde parou.
        </p>
      </div>

      <div className="flex flex-wrap gap-3 justify-end">
        <button
          type="button"
          onClick={onGoDashboard}
          className="rounded-full bg-linear-to-r from-purple-500 to-blue-500 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-purple-500/30 hover:opacity-95 transition-opacity"
        >
          Ir para o Dashboard
        </button>
        <button
          type="button"
          onClick={onLogout}
          className="rounded-full border border-white/20 px-4 py-2 text-xs md:text-sm font-medium text-slate-200 hover:bg-white/10 transition-colors"
        >
          Sair da conta
        </button>
      </div>
    </div>
  );
}
