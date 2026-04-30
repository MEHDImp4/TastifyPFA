import { NavLink } from 'react-router-dom';
import { ComponentType } from 'react';
import { 
  LayoutGrid, 
  LayoutDashboard, 
  ChefHat, 
  Users, 
  Package, 
  Table,
  X,
  UtensilsCrossed
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

type NavItem = {
  name: string;
  icon: ComponentType<{ className?: string }>;
  path: string;
  external?: boolean;
};

export const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const navItems: NavItem[] = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '#' },
    { name: 'Catégories', icon: LayoutGrid, path: '/categories' },
    { name: 'Plats', icon: ChefHat, path: '/plats' },
    { name: 'Tables', icon: Table, path: '/tables' },
    { name: 'Salle', icon: UtensilsCrossed, path: '/salle' },
    { name: 'KDS', icon: ChefHat, path: '/kds' },
    { name: 'Stock', icon: Package, path: '#' },
    { name: 'RH', icon: Users, path: '#' },
  ];

  const handleNavigate = () => {
    if (window.innerWidth < 1024) onClose();
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
        
        <div className="flex-1 px-4 space-y-2 py-4">
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
      </nav>
    </>
  );
};
