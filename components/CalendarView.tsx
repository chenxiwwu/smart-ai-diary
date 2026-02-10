import React, { useState } from 'react';
import { CalendarViewType, DayEntry } from '../types';
import { getAlmanacInfo } from '../services/chineseAlmanac';
import MediaPreview from './MediaPreview';

interface CalendarViewProps {
  viewType: CalendarViewType;
  entries: Record<string, DayEntry>;
  onDateSelect: (date: string) => void;
  onViewChange: (view: CalendarViewType) => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({ viewType, entries, onDateSelect, onViewChange }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const [previewMedia, setPreviewMedia] = useState<DayEntry['media']>([]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const getDaysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
  const getFirstDayOfMonth = (y: number, m: number) => new Date(y, m, 1).getDay();

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const prevPeriod = () => {
    if (viewType === CalendarViewType.MONTH) setCurrentDate(new Date(year, month - 1, 1));
    if (viewType === CalendarViewType.YEAR) setCurrentDate(new Date(year - 1, month, 1));
    if (viewType === CalendarViewType.WEEK || viewType === CalendarViewType.DAY) {
      const newDate = new Date(currentDate);
      newDate.setDate(currentDate.getDate() - (viewType === CalendarViewType.WEEK ? 7 : 1));
      setCurrentDate(newDate);
    }
  };

  const nextPeriod = () => {
    if (viewType === CalendarViewType.MONTH) setCurrentDate(new Date(year, month + 1, 1));
    if (viewType === CalendarViewType.YEAR) setCurrentDate(new Date(year + 1, month, 1));
    if (viewType === CalendarViewType.WEEK || viewType === CalendarViewType.DAY) {
      const newDate = new Date(currentDate);
      newDate.setDate(currentDate.getDate() + (viewType === CalendarViewType.WEEK ? 7 : 1));
      setCurrentDate(newDate);
    }
  };

  const getWeekOfMonth = (date: Date) => {
    const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    const dayOfMonth = date.getDate();
    const firstDayOfWeek = startOfMonth.getDay();
    return Math.ceil((dayOfMonth + firstDayOfWeek) / 7);
  };

  const formatDate = (date: Date) => date.toISOString().split('T')[0];

  const renderMonth = () => {
    const days = [];
    const prevMonthDays = getDaysInMonth(year, month - 1);
    for (let i = firstDay - 1; i >= 0; i--) {
      days.push({ day: prevMonthDays - i, current: false, dateStr: '' });
    }
    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      days.push({ day: i, current: true, dateStr });
    }

    const rows = [];
    for (let i = 0; i < days.length; i += 7) {
      const weekDate = new Date(year, month, days[i].day);
      const weekNum = getWeekOfMonth(weekDate);
      rows.push(
        <tr key={i} className="group h-36 border-b border-orange-50 last:border-0">
          <td 
            onClick={() => onViewChange(CalendarViewType.WEEK)}
            className="w-16 text-center text-[10px] text-orange-400 font-black uppercase tracking-widest hover:text-orange-600 cursor-pointer bg-orange-50/20 transition-colors"
          >
            第{weekNum}周
          </td>
          {days.slice(i, i + 7).map((d, idx) => (
            <td 
              key={idx} 
              onClick={() => d.current && onDateSelect(d.dateStr)}
              className={`p-3 border-r border-orange-50 last:border-0 align-top transition-all cursor-pointer ${d.current ? 'hover:bg-orange-50/20' : 'bg-gray-50/10 opacity-20 cursor-default'}`}
            >
              <div className="flex flex-col h-full">
                <span className={`text-sm font-black ${d.current ? 'text-gray-900' : 'text-gray-400'}`}>{d.day}</span>
                {d.current && entries[d.dateStr]?.myDaySummary && (
                  <div className="mt-2 text-[11px] leading-relaxed text-gray-700 italic font-medium font-serif-display line-clamp-3">
                    {entries[d.dateStr].myDaySummary}
                  </div>
                )}
              </div>
            </td>
          ))}
        </tr>
      );
    }
    return rows;
  };

  const renderWeek = () => {
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
    
    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      weekDays.push(day);
    }

    const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
      <div className="grid grid-cols-7 gap-6 px-12 pb-12">
        {weekDays.map((date, i) => {
          const dateStr = formatDate(date);
          const entry = entries[dateStr];
          const isToday = dateStr === formatDate(new Date());
          
          return (
            <div 
              key={i} 
              onClick={() => onDateSelect(dateStr)}
              className={`p-8 rounded-[2.5rem] border transition-all cursor-pointer group flex flex-col min-h-[400px] ${
                isToday ? 'bg-orange-50 border-orange-200 shadow-lg shadow-orange-100' : 'bg-white border-gray-100 hover:shadow-xl hover:border-orange-100'
              }`}
            >
              <div className="mb-6 flex flex-col">
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">{dayLabels[i]}</span>
                <span className={`text-3xl font-black ${isToday ? 'text-orange-700' : 'text-gray-900'}`}>{date.getDate()}</span>
              </div>
              
              <div className="flex-1 space-y-4">
                {entry?.myDaySummary && (
                  <p className="text-sm font-bold text-orange-900 leading-relaxed italic border-l-2 border-orange-300 pl-3 font-serif-display">
                    "{entry.myDaySummary}"
                  </p>
                )}

                {entry && entry.todos.length > 0 && (
                  <div className="pt-4 border-t border-orange-50">
                    <div className="flex justify-between items-end mb-2">
                      <p className="text-[9px] font-black text-orange-500 uppercase tracking-widest">Todo Status</p>
                      <span className="text-[10px] font-black text-gray-900">
                        {entry.todos.filter(t => t.completed).length}/{entry.todos.length}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                       <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-orange-400 transition-all duration-500" 
                            style={{ width: `${(entry.todos.filter(t => t.completed).length / entry.todos.length) * 100}%` }}
                          />
                       </div>
                    </div>
                  </div>
                )}
              </div>

              {entry && entry.expenses.length > 0 && (
                <div className="mt-auto pt-6">
                  <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block mb-1">Spent</span>
                  <span className="text-sm font-black text-gray-900">¥{entry.expenses.reduce((s, e) => s + e.amount, 0).toFixed(0)}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const renderDay = () => {
    const dateStr = formatDate(currentDate);
    const entry = entries[dateStr];
    const isToday = dateStr === formatDate(new Date());
    const almanac = getAlmanacInfo(currentDate);

    return (
      <div className="px-12 pb-12 max-w-4xl mx-auto">
        <div className={`p-16 rounded-[4rem] border transition-all cursor-pointer group flex flex-col min-h-[500px] ${
          isToday ? 'bg-orange-50 border-orange-200 shadow-2xl shadow-orange-100' : 'bg-white border-gray-100 shadow-xl'
        }`}>
          <div className="flex justify-between items-start mb-12">
            <div>
              <span className="text-sm font-black text-orange-600 uppercase tracking-widest mb-2 block tracking-[0.2em]">Viewing Day</span>
              <h2 className="text-7xl font-black text-gray-900 tracking-tight font-serif-display">{currentDate.getDate()}</h2>
              <p className="text-gray-500 font-bold uppercase tracking-widest mt-2">{currentDate.toLocaleDateString('zh-CN', { month: 'long', weekday: 'long' })}</p>
              <p className="text-sm text-stone-500 font-bold mt-2 tracking-wider flex items-center flex-wrap gap-x-3" style={{ fontFamily: 'STKaiti, KaiTi, serif' }}>
                <span>{almanac.ganZhi}日 · {almanac.shengXiao}年</span>
                <span className="w-px h-3.5 bg-stone-300/50 inline-block" />
                <span className="inline-flex items-center gap-1">
                  <span className="text-orange-600 font-bold">宜</span>
                  {almanac.yi.map((item, i) => (
                    <span key={i} className="text-orange-900/60">{item}</span>
                  ))}
                </span>
                <span className="w-px h-3.5 bg-stone-300/40 inline-block" />
                <span className="inline-flex items-center gap-1">
                  <span className="text-gray-400 font-bold">忌</span>
                  {almanac.ji.map((item, i) => (
                    <span key={i} className="text-gray-400">{item}</span>
                  ))}
                </span>
              </p>
            </div>
            <button 
              onClick={() => onDateSelect(dateStr)}
              className="px-8 py-4 bg-gray-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all"
            >
              Open Record
            </button>
          </div>

          <div className="grid grid-cols-2 gap-12 flex-1 min-w-0">
             <div className="space-y-8 min-w-0 overflow-hidden">
                <div className="min-w-0">
                   <h3 className="text-[11px] font-black text-gray-500 uppercase tracking-widest mb-4">Daily Narrative</h3>
                   <p className="text-2xl font-bold text-gray-800 italic leading-relaxed font-serif-display break-words line-clamp-5">
                     {entry?.myDaySummary ? `"${entry.myDaySummary}"` : "记录一下今天的精彩瞬间吧。"}
                   </p>
                </div>

                {(() => {
                  const images = entry?.media?.filter(m => m.type === 'image') || [];
                  if (images.length === 0) return null;
                  const displayImages = images.slice(0, 5);
                  return (
                    <div>
                      <h3 className="text-[11px] font-black text-gray-500 uppercase tracking-widest mb-4">Moments</h3>
                      <div className="relative h-48 cursor-pointer" onClick={() => { setPreviewMedia(images); setPreviewIndex(0); }}>
                        {displayImages.map((img, i) => (
                          <div
                            key={img.id}
                            className="absolute rounded-2xl overflow-hidden shadow-lg border-2 border-white"
                            style={{
                              width: '65%',
                              height: '85%',
                              left: `${i * 24}px`,
                              top: `${i * 6}px`,
                              zIndex: displayImages.length - i,
                              transform: `rotate(${[-3, 1, 4, -2, 3][i % 5]}deg)`,
                            }}
                          >
                            <img src={img.url} alt={img.name} className="w-full h-full object-cover" />
                          </div>
                        ))}
                        {images.length > 5 && (
                          <div className="absolute bottom-1 right-1 bg-black/50 text-white text-xs font-bold px-2.5 py-1 rounded-full z-10">
                            +{images.length - 5}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}
             </div>
             
             <div className="space-y-12">
                <div className="bg-orange-100/30 p-8 rounded-3xl border border-orange-100">
                  <h3 className="text-[11px] font-black text-orange-500 uppercase tracking-widest mb-4">Todo Progress</h3>
                  <div className="flex items-end justify-between mb-2">
                    <span className="text-3xl font-black text-gray-900">
                      {entry?.todos.filter(t => t.completed).length || 0} / {entry?.todos.length || 0}
                    </span>
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Done</span>
                  </div>
                  <div className="h-2 bg-white rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-orange-400" 
                      style={{ width: entry?.todos.length ? `${(entry.todos.filter(t => t.completed).length / entry.todos.length) * 100}%` : '0%' }}
                    />
                  </div>
                </div>

                <div className="bg-indigo-100/30 p-8 rounded-3xl border border-indigo-100">
                  <h3 className="text-[11px] font-black text-indigo-500 uppercase tracking-widest mb-4">Financial Snap</h3>
                  <div className="flex items-end justify-between">
                    <span className="text-3xl font-black text-gray-900">
                      ¥{entry?.expenses.reduce((s, e) => s + e.amount, 0).toFixed(2) || '0.00'}
                    </span>
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Out</span>
                  </div>
                </div>
             </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-gray-50/20">
      <header className="px-12 py-8 border-b border-orange-50 bg-white/80 backdrop-blur-md flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-10">
          <div className="flex items-center gap-4">
            <button onClick={() => onViewChange(CalendarViewType.YEAR)} className="text-3xl font-black text-gray-900 hover:text-orange-600 transition-colors tracking-tight font-serif-display uppercase">
              {year}
            </button>
            {viewType !== CalendarViewType.YEAR && (
              <button onClick={() => onViewChange(CalendarViewType.MONTH)} className="text-3xl font-black text-gray-900 hover:text-orange-600 transition-colors tracking-tight font-serif-display uppercase">
                {month + 1}月
              </button>
            )}
          </div>
          <div className="flex items-center bg-orange-100/40 p-1.5 rounded-2xl">
            {(['YEAR', 'MONTH', 'WEEK', 'DAY'] as const).map(v => (
              <button
                key={v}
                onClick={() => onViewChange(CalendarViewType[v])}
                className={`px-5 py-2 text-[10px] font-black rounded-xl transition-all uppercase tracking-widest ${viewType === v ? 'bg-white shadow-md text-orange-600' : 'text-gray-500 hover:text-gray-600'}`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={prevPeriod} className="p-3 hover:bg-orange-50 rounded-2xl transition text-gray-500 active:scale-90">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <button 
            onClick={() => setCurrentDate(new Date())}
            className="px-6 py-2.5 text-[10px] font-black bg-white border border-orange-100 rounded-2xl hover:shadow-md transition active:scale-95 uppercase tracking-widest"
          >
            TODAY
          </button>
          <button onClick={nextPeriod} className="p-3 hover:bg-orange-50 rounded-2xl transition text-gray-500 active:scale-90">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-auto py-12">
        {viewType === CalendarViewType.MONTH && (
          <div className="max-w-[1440px] mx-auto px-12 pb-12">
            <div className="bg-white rounded-[3rem] shadow-sm border border-orange-100 overflow-hidden shadow-2xl shadow-gray-100/20">
              <table className="w-full table-fixed border-collapse">
                <thead>
                  <tr className="bg-orange-50/30 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] text-center border-b border-orange-50">
                    <th className="w-16 py-6 font-black text-orange-500">WEEK</th>
                    <th className="py-6">Sun</th>
                    <th className="py-6">Mon</th>
                    <th className="py-6">Tue</th>
                    <th className="py-6">Wed</th>
                    <th className="py-6">Thu</th>
                    <th className="py-6">Fri</th>
                    <th className="py-6">Sat</th>
                  </tr>
                </thead>
                <tbody>{renderMonth()}</tbody>
              </table>
            </div>
          </div>
        )}

        {viewType === CalendarViewType.YEAR && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-12 px-12">
            {['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'].map((m, idx) => {
              const daysCount = getDaysInMonth(year, idx);
              return (
                <div 
                  key={m} 
                  onClick={() => {
                    setCurrentDate(new Date(year, idx, 1));
                    onViewChange(CalendarViewType.MONTH);
                  }}
                  className="p-8 bg-white rounded-[2rem] border border-orange-100 hover:shadow-xl hover:shadow-orange-50/50 transition-all cursor-pointer group"
                >
                  <h4 className="text-xl font-black text-gray-900 mb-6 group-hover:text-orange-600 transition-colors font-serif-display">{m}</h4>
                  <div className="grid grid-cols-7 gap-1.5">
                    {[...Array(daysCount)].map((_, i) => {
                      const dateStr = `${year}-${String(idx + 1).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`;
                      const hasEntry = !!entries[dateStr];
                      return (
                        <div 
                          key={i} 
                          className={`aspect-square flex items-center justify-center text-[11px] font-black transition-all ${
                            hasEntry 
                              ? 'bg-orange-500 text-white rounded-full shadow-sm' 
                              : 'text-gray-900'
                          }`}
                        >
                          {i + 1}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {viewType === CalendarViewType.WEEK && renderWeek()}
        {viewType === CalendarViewType.DAY && renderDay()}
      </div>

      {previewIndex !== null && previewMedia.length > 0 && (
        <MediaPreview
          media={previewMedia}
          currentIndex={previewIndex}
          onClose={() => { setPreviewIndex(null); setPreviewMedia([]); }}
          onNavigate={(i) => setPreviewIndex(i)}
        />
      )}
    </div>
  );
};

export default CalendarView;