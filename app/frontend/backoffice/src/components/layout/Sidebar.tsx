import { NavLink, useNavigate } from 'react-router-dom';
import { ComponentType } from 'react';
import { 
  LayoutGrid, 
  LayoutDashboard, 
  ChefHat, 
  Users, 
  Package, 
  Table,
  X,
  UtensilsCrossed,
  LogOut,
  Wifi,
  WifiOff,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useAuthStore } from '@shared/auth/useAuthStore';
import { useStaffWebSocket } from '@shared/websocket/WebSocketProvider';
import axiosInstance from '@shared/auth/axiosInstance';
import { isRoleAllowed } from '@shared/auth/roleAccess';
import logo from '@shared/assets/logo-staff.svg';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

type NavItem = {
  name: string;
  icon: ComponentType<{ className?: string }>;
  path: string;
  allowedRoles: readonly string[];
  external?: boolean;
};

export const Sidebar = ({ isOpen, onClose, isCollapsed, onToggleCollapse }: SidebarProps) => {
  const { clearAuth, user } = useAuthStore();
  const { connectionStatus } = useStaffWebSocket();
  const navigate = useNavigate();

  const isConnected = connectionStatus === 'open';

  const navItems: NavItem[] = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '#', allowedRoles: ['GERANT'] },
    { name: 'Catégories', icon: LayoutGrid, path: '/categories', allowedRoles: ['GERANT'] },
    { name: 'Plats', icon: ChefHat, path: '/plats', allowedRoles: ['GERANT'] },
    { name: 'Tables', icon: Table, path: '/tables', allowedRoles: ['GERANT'] },
    { name: 'Salle', icon: UtensilsCrossed, path: '/salle', allowedRoles: ['GERANT', 'SERVEUR'] },
    { name: 'KDS', icon: ChefHat, path: '/kds', allowedRoles: ['GERANT', 'CUISINIER'] },
    { name: 'Stock', icon: Package, path: '/stock', allowedRoles: ['GERANT', 'CUISINIER'] },
    { name: 'RH', icon: Users, path: '/hr', allowedRoles: ['GERANT'] },
  ].filter((item) => isRoleAllowed(user?.role, item.allowedRoles));

  const handleNavigate = () => {
    if (window.innerWidth < 1024) onClose();
  };

  const handleLogout = async () => {
    try {
      await axiosInstance.post('/users/logout/');
    } catch (err) {
      console.error("Logout failed", err);
    } finally {
      clearAuth();
      navigate('/login');
    }
  };

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      <nav className={`
        fixed inset-y-0 left-0 z-50 bg-surface shadow-lg text-white flex flex-col transform transition-[width,transform] duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        ${isCollapsed ? 'w-20' : 'w-64'}
      `}>
        {/* Header with Logo and Collapse Toggle */}
        <div className="h-20 flex items-center justify-center px-4 shrink-0 relative overflow-hidden">
          <div className={`transition-all duration-300 ${isCollapsed ? 'opacity-0 translate-x-[-20px]' : 'opacity-100 translate-x-0'}`}>
            <img src={logo} alt="Tastify" className="h-10 w-auto object-contain" />
          </div>
          
          <div className={`absolute right-4 top-1/2 -translate-y-1/2 flex items-center transition-all duration-300 ${isCollapsed ? 'left-1/2 -translate-x-1/2 right-auto' : ''}`}>
            <button 
              onClick={onToggleCollapse}
              className="hidden lg:flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 border border-white/5 text-foreground-muted hover:text-white transition-all hover:bg-white/10 hover:border-white/10 active:scale-95"
              title={isCollapsed ? "Développer" : "Réduire"}
            >
              {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            </button>
            <button 
              onClick={onClose}
              className="lg:hidden h-9 w-9 flex items-center justify-center rounded-xl text-foreground-muted hover:text-white active:scale-95"
              aria-label="Close sidebar"
            >
              <X size={24} />
            </button>
          </div>
        </div>
        
        {/* Navigation Items */}
        <div className="flex-1 px-3 space-y-1.5 py-4 overflow-y-auto overflow-x-hidden min-h-0 [scrollbar-width:none]">
          {navItems.map((item) => {
            const commonClasses = `flex items-center rounded-xl transition-all duration-300 group overflow-hidden ${
              isCollapsed ? 'justify-center h-12 w-12 mx-auto' : 'px-4 py-3 h-12'
            }`;

            const labelClasses = `font-medium whitespace-nowrap transition-all duration-300 origin-left ${
              isCollapsed ? 'opacity-0 w-0 ml-0 scale-90' : 'opacity-100 w-auto ml-3 scale-100'
            }`;

            const content = (
              <>
                <item.icon className={`w-5 h-5 flex-shrink-0 transition-colors ${isCollapsed ? '' : ''}`} />
                <span className={labelClasses}>{item.name}</span>
              </>
            );

            if (item.external) {
              return (
                <a
                  key={item.name}
                  href={item.path}
                  onClick={handleNavigate}
                  className={`${commonClasses} text-foreground-muted hover:bg-white/5 hover:text-white`}
                  title={isCollapsed ? item.name : undefined}
                >
                  {content}
                </a>
              );
            }

            return (
              <NavLink
                key={item.name}
                to={item.path}
                onClick={handleNavigate}
                className={({ isActive }) => 
                  `${commonClasses} ${
                    isActive && item.path !== '#'
                      ? 'bg-teal/10 text-teal' 
                      : 'text-foreground-muted hover:bg-white/5 hover:text-white'
                  }`
                }
                title={isCollapsed ? item.name : undefined}
              >
                {content}
              </NavLink>
            );
          })}
        </div>

        {/* Footer with Profile and Connection Status */}
        <div className="p-3 border-t border-white/5 mt-auto bg-black/5">
          
          <div className={`flex items-center transition-all duration-300 ${isCollapsed ? 'flex-col gap-4' : 'justify-between px-1'}`}>
            <div className={`flex items-center transition-all duration-300 ${isCollapsed ? 'flex-col' : 'gap-3 min-w-0'}`}>
              <div className="w-10 h-10 rounded-2xl bg-teal/10 flex items-center justify-center border border-teal/20 flex-shrink-0 transition-all duration-300 group-hover:scale-105" title={isCollapsed ? `${user?.username} (${user?.role})` : undefined}>
                <span className="text-xs font-black text-teal">{user?.username?.substring(0, 2).toUpperCase()}</span>
              </div>
              
              <div className={`flex flex-col min-w-0 transition-all duration-300 origin-left ${isCollapsed ? 'opacity-0 h-0 scale-90' : 'opacity-100 h-auto ml-0 scale-100'}`}>
                <span className="text-xs font-bold text-white leading-none truncate">{user?.username}</span>
                <span className="text-[10px] text-foreground-muted mt-1.5 uppercase tracking-wider truncate font-black">{user?.role}</span>
              </div>
            </div>
            
            <div 
              className={`flex h-8 w-8 items-center justify-center rounded-xl border transition-all duration-300 ${isConnected ? 'border-green-500/20 bg-green-500/10 text-green-500' : 'border-red-500/20 bg-red-500/10 text-red-500'}`} 
              title={isConnected ? 'Connecté' : 'Déconnecté'}
            >
              {isConnected ? <Wifi size={14} /> : <WifiOff size={14} className="animate-pulse" />}
            </div>
          </div>

          <div className="mt-4">
            <button
              onClick={handleLogout}
              className={`flex items-center rounded-xl transition-all duration-300 text-foreground-muted hover:bg-error/10 hover:text-error group active:scale-[0.97] ${
                isCollapsed ? 'justify-center h-12 w-12 mx-auto' : 'px-4 py-3 w-full space-x-3'
              }`}
              title={isCollapsed ? "Se déconnecter" : undefined}
            >
              <LogOut className="w-5 h-5 transition-transform group-hover:-translate-x-1 flex-shrink-0" />
              <span className={`font-medium transition-all duration-300 origin-left ${isCollapsed ? 'opacity-0 w-0 scale-90' : 'opacity-100 w-auto ml-0 scale-100'}`}>
                Déconnexion
              </span>
            </button>
          </div>
        </div>
      </nav>
    </>
  );
};
