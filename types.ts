
export enum ViewType {
  DAILY_RECORD = 'DAILY_RECORD',
  CALENDAR = 'CALENDAR'
}

export enum CalendarViewType {
  YEAR = 'YEAR',
  MONTH = 'MONTH',
  WEEK = 'WEEK',
  DAY = 'DAY'
}

export interface Todo {
  id: string;
  text: string;
  completed: boolean;
}

export interface Expense {
  id: string;
  item: string;
  amount: number;
}

export interface MediaFile {
  id: string;
  type: 'image' | 'video' | 'audio';
  url: string;
  name: string;
}

export interface DayEntry {
  date: string; // YYYY-MM-DD
  todos: Todo[];
  expenses: Expense[];
  insight: string;
  media: MediaFile[];
  myDaySummary?: string;
  lastSavedAt?: string;
}

export interface AppState {
  currentView: ViewType;
  calendarView: CalendarViewType;
  selectedDate: string; // YYYY-MM-DD
  entries: Record<string, DayEntry>;
}
