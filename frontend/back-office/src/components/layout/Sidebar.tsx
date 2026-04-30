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
  LogOut
} from 'lucide-react';
import { useAuthStore } from '@shared/auth/useAuthStore';
import axiosInstance from '@shared/auth/axiosInstance';
import { isRoleAllowed } from '@shared/auth/roleAccess';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

type NavItem = {
  name: string;
  icon: ComponentType<{ className?: string }>;
  path: string;
  allowedRoles: readonly string[];
  external?: boolean;
};

export const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const { clearAuth, user } = useAuthStore();
  const navigate = useNavigate();

  const navItems: NavItem[] = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '#', allowedRoles: ['GERANT'] },
    { name: 'Catégories', icon: LayoutGrid, path: '/categories', allowedRoles: ['GERANT'] },
    { name: 'Plats', icon: ChefHat, path: '/plats', allowedRoles: ['GERANT'] },
    { name: 'Tables', icon: Table, path: '/tables', allowedRoles: ['GERANT'] },
    { name: 'Salle', icon: UtensilsCrossed, path: '/salle', allowedRoles: ['GERANT', 'SERVEUR'] },
    { name: 'KDS', icon: ChefHat, path: '/kds', allowedRoles: ['GERANT', 'CUISINIER'] },
    { name: 'Stock', icon: Package, path: '#', allowedRoles: ['GERANT'] },
    { name: 'RH', icon: Users, path: '#', allowedRoles: ['GERANT'] },
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
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <nav className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-surface shadow-lg text-white flex flex-col transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-6 flex justify-between items-center">
          <h1 className="text-xl font-bold text-teal">Tastify</h1>
          <button 
            onClick={onClose}
            className="lg:hidden text-foreground-muted hover:text-white"
            aria-label="Close sidebar"
          >
            <X size={24} />
          </button>
        </div>
        
        <div className="flex-1 px-4 space-y-2 py-4 overflow-y-auto min-h-0">
          {navItems.map((item) => {
            if (item.external) {
              return (
                <a
                  key={item.name}
                  href={item.path}
                  onClick={handleNavigate}
                  className="flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors text-foreground-muted hover:bg-surface-elevated hover:text-white"
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.name}</span>
                </a>
              );
            }

            return (
              <NavLink
                key={item.name}
                to={item.path}
                onClick={handleNavigate}
                className={({ isActive }) => 
                  `flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive && item.path !== '#'
                      ? 'bg-teal/10 text-teal' 
                      : 'text-foreground-muted hover:bg-surface-elevated hover:text-white'
                  }`
                }
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.name}</span>
              </NavLink>
            );
          })}
        </div>

        {/* Logout Button Section */}
        <div className="p-4 border-t border-white/5 mt-auto">
          <button
            onClick={handleLogout}
            className="flex items-center space-x-3 px-4 py-3 rounded-lg transition-all text-foreground-muted hover:bg-error/10 hover:text-error w-full group active:scale-[0.97]"
          >
            <LogOut className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
            <span className="font-medium">Se déconnecter</span>
          </button>
        </div>
      </nav>
    </>
  );
};
