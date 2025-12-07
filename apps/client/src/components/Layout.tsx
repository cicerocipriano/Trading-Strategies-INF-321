import { useState } from 'react';
import { Link, useNavigate, NavLink } from 'react-router-dom';
import { Menu, X, LogOut, User } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface LayoutProps {
    children: React.ReactNode;
}

function navLinkClasses({ isActive }: { isActive: boolean }): string {
    return [
        'text-sm font-medium px-1 pb-1 border-b-2 transition-colors',
        isActive
            ? 'text-foreground border-primary'
            : 'text-muted-foreground border-transparent hover:text-primary hover:border-primary/60',
    ].join(' ');
}

export default function Layout({ children }: LayoutProps) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate('/');
    };

    return (
        <div className="min-h-screen ts-gradient-page text-foreground">
            {/* Navigation */}
            <nav className="border-b border-border bg-card/80 backdrop-blur supports-backdrop-filter:bg-card/60">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        {/* Logo */}
                        <Link to="/" className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-lg shadow-primary/40">
                                <span className="text-primary-foreground font-bold">
                                    TS
                                </span>
                            </div>
                            <span className="font-bold text-lg hidden sm:inline">
                                Trading Strategies
                            </span>
                        </Link>

                        {/* Desktop Menu */}
                        <div className="hidden md:flex items-center space-x-8">
                            <NavLink
                                to="/strategies"
                                className={navLinkClasses}
                            >
                                Estratégias
                            </NavLink>

                            <NavLink
                                to="/simulations"
                                className={navLinkClasses}
                            >
                                Simulações
                            </NavLink>

                            <NavLink
                                to="/dashboard"
                                className={navLinkClasses}
                            >
                                Dashboard
                            </NavLink>
                        </div>

                        {/* User Menu */}
                        <div className="hidden md:flex items-center space-x-4">
                            {user && (
                                <>
                                    {/* Perfil */}
                                    <Link
                                        to="/profile"
                                        className="
                                            flex items-center space-x-2 px-3 py-2 rounded-full
                                            bg-white/5
                                            text-sm
                                            border border-transparent
                                            hover:bg-white/15
                                            hover:text-white
                                            hover:border-primary/60
                                            hover:shadow-lg hover:shadow-primary/40
                                            hover:-translate-y-0.5
                                            transition-all duration-150
                                        " >
                                        <User className="w-4 h-4" />
                                        <span>{user.username}</span>
                                    </Link>

                                    {/* Sair */}
                                    <button
                                        onClick={handleLogout}
                                        className="
                                            flex items-center space-x-2 px-3 py-2 rounded-full
                                            bg-destructive/20 text-destructive
                                            border border-destructive/50
                                            text-sm
                                            hover:bg-destructive
                                            hover:text-destructive-foreground
                                            hover:shadow-lg hover:shadow-destructive/40
                                            hover:-translate-y-0.5
                                            transition-all duration-150
                                        " >
                                        <LogOut className="w-4 h-4" />
                                        <span>Sair</span>
                                    </button>
                                </>
                            )}
                        </div>

                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="md:hidden p-2 rounded-lg hover:bg-muted transition-colors"
                        >
                            {isMenuOpen ? (
                                <X className="w-6 h-6" />
                            ) : (
                                <Menu className="w-6 h-6" />
                            )}
                        </button>
                    </div>

                    {/* Mobile Menu */}
                    {isMenuOpen && (
                        <div className="md:hidden pb-4 space-y-2">
                            <Link
                                to="/strategies"
                                className="block px-4 py-2 rounded-lg hover:bg-muted transition-colors"
                                onClick={() => setIsMenuOpen(false)}
                            >
                                Estratégias
                            </Link>
                            <Link
                                to="/simulator"
                                className="block px-4 py-2 rounded-lg hover:bg-muted transition-colors"
                                onClick={() => setIsMenuOpen(false)}
                            >
                                Simulador
                            </Link>
                            <Link
                                to="/dashboard"
                                className="block px-4 py-2 rounded-lg hover:bg-muted transition-colors"
                                onClick={() => setIsMenuOpen(false)}
                            >
                                Dashboard
                            </Link>
                            {user && (
                                <>
                                    <Link
                                        to="/profile"
                                        className="block px-4 py-2 rounded-lg hover:bg-muted transition-colors"
                                        onClick={() => setIsMenuOpen(false)}
                                    >
                                        Perfil
                                    </Link>
                                    <button
                                        onClick={() => {
                                            handleLogout();
                                            setIsMenuOpen(false);
                                        }}
                                        className="w-full text-left px-4 py-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors"
                                    >
                                        Sair
                                    </button>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </nav>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {children}
            </main>
        </div>
    );
}