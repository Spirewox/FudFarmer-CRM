import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Menu } from 'lucide-react';

const Layout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-background overflow-hidden font-sans">
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />

      <div className="flex-1 flex flex-col overflow-hidden w-full">
        {/* Mobile Header */}
        <header className="lg:hidden flex items-center p-4 border-b bg-background z-10">
            <button onClick={() => setIsSidebarOpen(true)} className="text-foreground mr-4">
                <Menu size={24} />
            </button>
            <h1 className="text-lg font-semibold tracking-tight">FudFarmer CRM</h1>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-muted/20 p-4 md:p-8">
            <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;