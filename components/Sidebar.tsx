
import React from 'react';
import { ViewType } from '../types';

interface SidebarProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  onOpenExport: () => void;
  user?: { id: string; email: string; name: string };
  onLogout?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onViewChange, onOpenExport, user, onLogout }) => {
  const tabs = [
    { id: ViewType.DAILY_RECORD, label: '每日记录', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    )},
    { id: ViewType.CALENDAR, label: '日历视图', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    )},
  ];

  return (
    <div className="w-48 h-full bg-white border-r border-orange-50 flex flex-col pt-8">
      <div className="px-5 mb-8 flex items-center gap-2">
        <div className="w-7 h-7 bg-orange-600 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-md shadow-orange-100">D</div>
        <h1 className="text-lg font-bold tracking-tight text-gray-800">Smart D</h1>
      </div>
      
      <nav className="flex-1 space-y-1 px-3">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => onViewChange(tab.id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-xl transition-all ${
              currentView === tab.id 
                ? 'bg-orange-50 text-orange-700 shadow-sm' 
                : 'text-gray-500 hover:bg-orange-50/30 hover:text-gray-900'
            }`}
          >
            {tab.icon}
            <span className="truncate">{tab.label}</span>
          </button>
        ))}

        <div className="pt-4 mt-4 border-t border-orange-50">
          <button
            onClick={onOpenExport}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-gray-400 rounded-xl hover:bg-red-50 hover:text-red-700 transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="truncate">导出日记</span>
          </button>
        </div>
      </nav>
      
      <div className="p-4 mt-auto space-y-3">
        {user && (
          <div className="px-3 py-2 bg-orange-50/50 rounded-xl">
            <p className="text-xs font-semibold text-gray-700 truncate">{user.name}</p>
            <p className="text-[10px] text-gray-400 truncate">{user.email}</p>
            {onLogout && (
              <button
                onClick={onLogout}
                className="mt-2 w-full text-[11px] font-medium text-red-500 hover:text-red-700 transition-colors text-left"
              >
                退出登录
              </button>
            )}
          </div>
        )}
        <div className="text-[9px] text-gray-300 font-black uppercase tracking-[0.2em] text-center">
          Crafted with Life
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
