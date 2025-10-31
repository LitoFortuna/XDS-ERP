import React from 'react';
import { Page } from '../types';
import { DashboardIcon, CalendarIcon, UsersIcon, BriefcaseIcon, CurrencyEuroIcon, ChevronDoubleLeftIcon, ChevronDoubleRightIcon, BookOpenIcon, SparklesIcon } from './Icons';

interface SidebarProps {
  currentPage: Page;
  setPage: (page: Page) => void;
  isCollapsed: boolean;
  setIsCollapsed: (isCollapsed: boolean) => void;
}

// FIX: Changed icon prop to be a component type to avoid issues with React.cloneElement and typing.
const NavItem: React.FC<{
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  isActive: boolean;
  onClick: () => void;
  isCollapsed: boolean;
}> = ({ icon: Icon, label, isActive, isCollapsed, onClick }) => (
  <li
    onClick={onClick}
    className={`flex items-center p-3 my-1 rounded-lg cursor-pointer transition-all duration-200 ${isCollapsed ? 'justify-center' : ''} ${
      isActive
        ? 'bg-brand-purple text-white shadow-lg'
        : 'text-gray-600 hover:bg-brand-light hover:text-brand-purple'
    }`}
  >
    <Icon className="w-6 h-6 flex-shrink-0" />
    {!isCollapsed && <span className="ml-4 font-semibold whitespace-nowrap">{label}</span>}
  </li>
);

export const Sidebar: React.FC<SidebarProps> = ({ currentPage, setPage, isCollapsed, setIsCollapsed }) => {
  const navItems: { page: Page; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { page: 'dashboard', label: 'Dashboard', icon: DashboardIcon },
    { page: 'schedule', label: 'Horarios', icon: CalendarIcon },
    { page: 'classes', label: 'Clases', icon: BookOpenIcon },
    { page: 'students', label: 'Alumnado', icon: UsersIcon },
    { page: 'teachers', label: 'Profesorado', icon: BriefcaseIcon },
    { page: 'finances', label: 'Finanzas', icon: CurrencyEuroIcon },
    { page: 'imageAnalyzer', label: 'Analizar Recibo', icon: SparklesIcon },
  ];

  return (
    <div className={`flex flex-col h-full bg-white shadow-xl fixed transition-all duration-300 ease-in-out ${isCollapsed ? 'w-20' : 'w-64'}`}>
      <div className={`flex items-center justify-center p-6 border-b transition-opacity duration-300`}>
        <h1 className={`text-xl font-bold text-brand-purple whitespace-nowrap overflow-hidden ${isCollapsed ? 'opacity-0 w-0' : 'opacity-100'}`}>Xen Dance Space</h1>
        {isCollapsed && <h1 className="text-3xl font-bold text-brand-purple">XDS</h1>}
      </div>
      <nav className="flex-1 p-4">
        <ul>
          {navItems.map((item) => (
            <NavItem
              key={item.page}
              icon={item.icon}
              label={item.label}
              isActive={currentPage === item.page}
              onClick={() => setPage(item.page)}
              isCollapsed={isCollapsed}
            />
          ))}
        </ul>
      </nav>
      <div className="p-4 border-t">
        <div 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`flex items-center p-3 rounded-lg cursor-pointer text-gray-600 hover:bg-brand-light hover:text-brand-purple ${isCollapsed ? 'justify-center' : ''}`}
        >
          {isCollapsed ? <ChevronDoubleRightIcon className="w-6 h-6 flex-shrink-0"/> : <ChevronDoubleLeftIcon className="w-6 h-6 flex-shrink-0"/>}
          {!isCollapsed && <span className="ml-4 font-semibold whitespace-nowrap">Encoger</span>}
        </div>
      </div>
    </div>
  );
};