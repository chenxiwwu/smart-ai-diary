import { useState, useEffect, useCallback } from 'react';
import { ViewType, AppState, DayEntry, CalendarViewType } from './types';
import { useAuth } from './contexts/AuthContext';
import { api } from './services/api';
import Sidebar from './components/Sidebar';
import DailyRecord from './components/DailyRecord';
import CalendarView from './components/CalendarView';
import ExportModal from './components/ExportModal';
import Login from './components/Login';

const App: React.FC = () => {
  const { user, isAuthenticated, login, register, logout, loading: authLoading } = useAuth();
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoadingState, setAuthLoading] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem('diary_app_state');
    const today = new Date().toISOString().split('T')[0];
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        ...parsed,
        currentView: ViewType.DAILY_RECORD,
        selectedDate: today
      };
    }
    return {
      currentView: ViewType.DAILY_RECORD,
      calendarView: CalendarViewType.MONTH,
      selectedDate: today,
      entries: {}
    };
  });

  // Sync with backend when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      api.getEntries()
        .then(({ entries }) => {
          if (Object.keys(entries).length > 0) {
            setState(prev => ({ ...prev, entries }));
          }
        })
        .catch(err => console.error('Failed to sync entries:', err));
    }
  }, [isAuthenticated]);

  // Save to localStorage and backend
  const saveState = useCallback(async (newState: AppState) => {
    // Always save to localStorage for offline support
    localStorage.setItem('diary_app_state', JSON.stringify(newState));

    // If authenticated, sync to backend
    if (isAuthenticated && newState.entries[newState.selectedDate]) {
      const entry = newState.entries[newState.selectedDate];
      try {
        await api.updateEntry(newState.selectedDate, {
          insight: entry.insight,
          todos: entry.todos,
          expenses: entry.expenses,
          media: entry.media
        });
      } catch (err) {
        console.error('Failed to sync to backend:', err);
      }
    }
  }, [isAuthenticated]);

  useEffect(() => {
    saveState(state);
  }, [state, saveState]);

  const updateEntry = useCallback((date: string, entry: Partial<DayEntry>) => {
    setState(prev => ({
      ...prev,
      entries: {
        ...prev.entries,
        [date]: {
          ...(prev.entries[date] || {
            date,
            todos: [],
            expenses: [],
            insight: '',
            media: []
          }),
          ...entry,
          lastSavedAt: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
        }
      }
    }));
  }, []);

  const navigateToDate = useCallback((date: string) => {
    setState(prev => ({
      ...prev,
      selectedDate: date,
      currentView: ViewType.DAILY_RECORD
    }));
  }, []);

  const changeView = (view: ViewType) => {
    setState(prev => ({ ...prev, currentView: view }));
  };

  const changeCalendarView = (view: CalendarViewType) => {
    setState(prev => ({ ...prev, calendarView: view }));
  };

  const handleLogin = async (email: string, password: string) => {
    setAuthError(null);
    setAuthLoading(true);
    try {
      await login(email, password);
    } catch (err: any) {
      setAuthError(err.message || '登录失败');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleRegister = async (email: string, password: string, name?: string) => {
    setAuthError(null);
    setAuthLoading(true);
    try {
      await register(email, password, name);
    } catch (err: any) {
      setAuthError(err.message || '注册失败');
    } finally {
      setAuthLoading(false);
    }
  };

  const currentEntry = state.entries[state.selectedDate] || {
    date: state.selectedDate,
    todos: [],
    expenses: [],
    insight: '',
    media: []
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-amber-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500 font-medium">加载中...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Login
        onLogin={handleLogin}
        onRegister={handleRegister}
        loading={authLoadingState}
        error={authError}
      />
    );
  }

  return (
    <div className="flex h-screen w-full bg-white overflow-hidden">
      <Sidebar
        currentView={state.currentView}
        onViewChange={changeView}
        onOpenExport={() => setIsExportModalOpen(true)}
        user={user || undefined}
        onLogout={logout}
      />

      <main className="flex-1 overflow-auto relative bg-gray-50/50">
        {state.currentView === ViewType.DAILY_RECORD && (
          <DailyRecord
            entry={currentEntry}
            onUpdate={(update) => updateEntry(state.selectedDate, update)}
          />
        )}

        {state.currentView === ViewType.CALENDAR && (
          <CalendarView
            viewType={state.calendarView}
            entries={state.entries}
            onDateSelect={navigateToDate}
            onViewChange={changeCalendarView}
          />
        )}
      </main>

      {isExportModalOpen && (
        <ExportModal
          entries={state.entries}
          onClose={() => setIsExportModalOpen(false)}
        />
      )}
    </div>
  );
};

export default App;
