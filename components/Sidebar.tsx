
import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, Briefcase, MessageSquare, RefreshCw, X, Mail, LogOut, Settings } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, toggleSidebar }) => {
  const { user, logout } = useAuth();

  const navItems = [
    { name: 'Dashboard', path: '/', icon: <LayoutDashboard size={20} /> },
    { name: 'Customers', path: '/customers', icon: <Users size={20} /> },
    { name: 'Leads', path: '/leads', icon: <Briefcase size={20} /> },
    { name: 'Feedback', path: '/feedback', icon: <MessageSquare size={20} /> },
    { name: 'Enquiries', path: '/enquiries', icon: <Mail size={20} /> },
    { name: 'Compensations', path: '/compensations', icon: <RefreshCw size={20} /> },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      <div 
        className={`fixed inset-0 z-40 bg-background/80 backdrop-blur-sm transition-opacity lg:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={toggleSidebar}
      />

      {/* Sidebar Container */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-card border-r shadow-sm transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between h-16 px-6 border-b">
          <span className="text-xl font-bold tracking-tight text-primary">FudFarmer</span>
          <button onClick={toggleSidebar} className="lg:hidden text-muted-foreground hover:text-foreground">
            <X size={24} />
          </button>
        </div>

        <div className="flex flex-col h-[calc(100%-4rem)] justify-between">
          <nav className="mt-6 px-3 space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => window.innerWidth < 1024 && toggleSidebar()}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive 
                      ? 'bg-secondary text-secondary-foreground shadow-sm' 
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`
                }
              >
                {item.icon}
                <span>{item.name}</span>
              </NavLink>
            ))}
             
             {/* Settings Link */}
             <div className="pt-4 mt-4 border-t">
                 <NavLink
                    to="/settings"
                    onClick={() => window.innerWidth < 1024 && toggleSidebar()}
                    className={({ isActive }) =>
                    `flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        isActive 
                        ? 'bg-secondary text-secondary-foreground shadow-sm' 
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`
                    }
                >
                    <Settings size={20} />
                    <span>Settings</span>
                </NavLink>
             </div>
          </nav>

          <div className="p-4 border-t">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                        {user?.full_name?.charAt(0) || 'U'}
                    </div>
                    <div className="flex flex-col">
                        <p className="text-sm font-medium leading-none truncate max-w-[100px]">{user?.full_name || 'User'}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{user?.role} • {user?.location}</p>
                    </div>
                </div>
                <button 
                    onClick={logout}
                    className="text-muted-foreground hover:text-destructive transition-colors p-1" 
                    title="Sign Out"
                >
                    <LogOut size={16} />
                </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
