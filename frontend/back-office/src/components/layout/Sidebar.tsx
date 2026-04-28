import { NavLink } from 'react-router-dom';
import { 
  LayoutGrid, 
  LayoutDashboard, 
  ChefHat, 
  Users, 
  Package, 
  Table 
} from 'lucide-react';

export const Sidebar = () => {
  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '#' },
    { name: 'Catégories', icon: LayoutGrid, path: '/categories' },
    { name: 'Plats', icon: ChefHat, path: '#' },
    { name: 'Tables', icon: Table, path: '#' },
    { name: 'Stock', icon: Package, path: '#' },
    { name: 'RH', icon: Users, path: '#' },
  ];

  return (
    <nav className="w-56 h-screen fixed inset-y-0 left-0 bg-surface shadow-lg text-white flex flex-col">
      <div className="p-6">
        <h1 className="text-xl font-bold text-teal">Tastify</h1>
      </div>
      
      <div className="flex-1 px-4 space-y-2 py-4">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
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
        ))}
      </div>
    </nav>
  );
};
