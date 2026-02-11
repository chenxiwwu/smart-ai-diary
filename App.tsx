import { useState, useEffect, useCallback, useRef } from 'react';
import { ViewType, AppState, DayEntry, CalendarViewType, MediaFile } from './types';
import { useAuth } from './contexts/AuthContext';
import { api, SERVER_BASE } from './services/api';
import Sidebar from './components/Sidebar';
import DailyRecord from './components/DailyRecord';
import CalendarView from './components/CalendarView';
import ExportModal from './components/ExportModal';
import Login from './components/Login';

// Helper: convert media URLs to full URLs for display
function toDisplayMedia(media: MediaFile[]): MediaFile[] {
  return media.map(m => ({
    ...m,
    url: m.url.startsWith('http') ? m.url : `${SERVER_BASE}${m.url}`,
  }));
}

// Helper: strip server base from media URLs for backend storage
function toStorageMedia(media: MediaFile[]): MediaFile[] {
  return media.map(m => ({
    ...m,
    url: m.url.startsWith(SERVER_BASE) ? m.url.slice(SERVER_BASE.length) : m.url,
  }));
}

const App: React.FC = () => {
  const { user, isAuthenticated, login, register, logout, loading: authLoading } = useAuth();
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoadingState, setAuthLoading] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  // Guard to skip backend sync when loading data from server
  const isSyncingFromBackend = useRef(false);

  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem('diary_app_state');
    const today = new Date().toISOString().split('T')[0];
    if (saved) {
      const parsed = JSON.parse(saved);
      // 清理 localStorage 中残留的无效 blob:// URL
      if (parsed.entries) {
        for (const date of Object.keys(parsed.entries)) {
          const entry = parsed.entries[date];
          if (entry.media) {
            entry.media = entry.media.filter((m: any) => !m.url.startsWith('blob:'));
          }
        }
      }
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
      isSyncingFromBackend.current = true;
      api.getEntries()
        .then(({ entries }) => {
          if (Object.keys(entries).length > 0) {
            // 补全 media URL：后端返回的是相对路径 /uploads/xxx，需要拼接服务器地址
            const fixedEntries: Record<string, DayEntry> = {};
            for (const [date, entry] of Object.entries(entries)) {
              fixedEntries[date] = {
                ...entry,
                media: toDisplayMedia(entry.media || []),
              };
            }
            setState(prev => ({ ...prev, entries: fixedEntries }));
          }
        })
        .catch(err => console.error('Failed to sync entries:', err))
        .finally(() => {
          // Delay clearing the flag to skip the setState-triggered effect
          setTimeout(() => { isSyncingFromBackend.current = false; }, 100);
        });
    }
  }, [isAuthenticated]);

  // Save entry to localStorage and backend (only when entry content changes)
  const syncEntryToBackend = useCallback(async (date: string, entry: DayEntry) => {
    if (!isAuthenticated) return;
    try {
      await api.updateEntry(date, {
        insight: entry.insight,
        todos: entry.todos,
        expenses: entry.expenses,
        media: toStorageMedia(entry.media),
        myDaySummary: entry.myDaySummary
      });
    } catch (err) {
      console.error('Failed to sync to backend:', err);
    }
  }, [isAuthenticated]);

  // Save to localStorage whenever state changes
  useEffect(() => {
    localStorage.setItem('diary_app_state', JSON.stringify(state));
  }, [state]);

  const updateEntry = useCallback((date: string, entry: Partial<DayEntry>) => {
    setState(prev => {
      const newEntries = {
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
      };

      const newState = { ...prev, entries: newEntries };

      // Sync to backend only on actual user edits, not on backend-load
      if (!isSyncingFromBackend.current) {
        syncEntryToBackend(date, newEntries[date]);
      }

      return newState;
    });
  }, [syncEntryToBackend]);

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
          userName={user?.name || user?.email || ''}
        />
      )}
    </div>
  );
};

export default App;
