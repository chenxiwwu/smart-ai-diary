
import React, { useState } from 'react';
import { DayEntry } from '../types';

interface ExportModalProps {
  entries: Record<string, DayEntry>;
  onClose: () => void;
}

const ExportModal: React.FC<ExportModalProps> = ({ entries, onClose }) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const handleExport = () => {
    if (!startDate || !endDate) {
      alert('请选择完整的时间区间');
      return;
    }

    const filteredEntries = Object.values(entries)
      .filter(entry => entry.date >= startDate && entry.date <= endDate)
      .sort((a, b) => a.date.localeCompare(b.date));

    if (filteredEntries.length === 0) {
      alert('该时间区间内没有日记记录');
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const content = `
      <!DOCTYPE html>
      <html lang="zh-CN">
      <head>
        <meta charset="UTF-8">
        <title>我的日记导出 - ${startDate} 至 ${endDate}</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&display=swap" rel="stylesheet">
        <style>
          @media print {
            .page-break { page-break-after: always; }
            body { background: white; -webkit-print-color-adjust: exact; }
          }
          body { font-family: sans-serif; padding: 40px; }
          .font-serif-display { font-family: 'Playfair Display', serif; }
          .entry-card { margin-bottom: 80px; page-break-inside: avoid; border-bottom: 1px solid #f1f5f9; padding-bottom: 80px; }
          .entry-card:last-child { border-bottom: none; }
          img { max-width: 100%; height: auto; display: block; }
        </style>
      </head>
      <body class="bg-white">
        <div class="max-w-4xl mx-auto">
          <header class="text-center mb-24 border-b-4 border-gray-900 pb-12">
            <h1 class="text-7xl font-black mb-4 tracking-tighter text-gray-950 font-serif-display">ARCHIVE</h1>
            <p class="text-gray-500 uppercase tracking-[0.5em] text-[10px] font-black">
              TIME RANGE: ${startDate.replace(/-/g, '.')} — ${endDate.replace(/-/g, '.')}
            </p>
          </header>

          ${filteredEntries.map(entry => {
            const images = entry.media?.filter(m => m.type === 'image') || [];
            
            return `
            <div class="entry-card">
              <div class="flex justify-between items-baseline mb-12">
                <h2 class="text-5xl font-black text-gray-950 font-serif-display">${entry.date}</h2>
                ${entry.myDaySummary ? `<span class="text-orange-600 font-bold italic text-xl font-serif-display">“${entry.myDaySummary}”</span>` : ''}
              </div>

              ${entry.insight ? `
                <div class="text-gray-900 mb-12 text-xl leading-[1.8] font-serif-display border-l-4 border-orange-100 pl-8 py-2">
                  ${entry.insight}
                </div>
              ` : ''}

              ${images.length > 0 ? `
                <div class="mb-12">
                  <h3 class="text-[9px] font-black text-gray-400 uppercase tracking-[0.3em] mb-6">Visual Memory</h3>
                  <div class="grid grid-cols-2 gap-4">
                    ${images.map(img => `
                      <div class="rounded-2xl overflow-hidden border border-gray-100 aspect-video">
                        <img src="${img.url}" class="w-full h-full object-cover" />
                      </div>
                    `).join('')}
                  </div>
                </div>
              ` : ''}

              <div class="grid grid-cols-2 gap-16">
                <div>
                  <h3 class="text-[9px] font-black text-orange-500 uppercase tracking-[0.3em] mb-6">Todo Status</h3>
                  <ul class="space-y-3">
                    ${entry.todos.length > 0 
                      ? entry.todos.map(t => `
                          <li class="flex items-center gap-3 text-sm font-bold">
                            <span class="w-3 h-3 rounded-full border border-gray-200 ${t.completed ? 'bg-orange-500 border-orange-600' : 'bg-white'}"></span>
                            <span class="${t.completed ? 'text-gray-400 line-through' : 'text-gray-800'}">${t.text}</span>
                          </li>
                        `).join('')
                      : '<li class="text-gray-300 text-xs italic">No tasks recorded</li>'
                    }
                  </ul>
                </div>

                <div>
                  <h3 class="text-[9px] font-black text-indigo-500 uppercase tracking-[0.3em] mb-6">Financial Summary</h3>
                  <div class="space-y-3">
                    ${entry.expenses.length > 0 
                      ? entry.expenses.map(e => `
                          <div class="flex justify-between text-sm font-bold">
                            <span class="text-gray-600">${e.item}</span>
                            <span class="font-black text-gray-900">¥${e.amount.toFixed(2)}</span>
                          </div>
                        `).join('')
                      : '<div class="text-gray-300 text-xs italic">No financial data</div>'
                    }
                    ${entry.expenses.length > 0 ? `
                      <div class="pt-4 mt-4 border-t border-gray-100 flex justify-between font-black text-indigo-600">
                        <span class="uppercase tracking-widest text-[10px]">Total Investment</span>
                        <span>¥${entry.expenses.reduce((s, e) => s + e.amount, 0).toFixed(2)}</span>
                      </div>
                    ` : ''}
                  </div>
                </div>
              </div>
            </div>
          `}).join('')}

          <footer class="text-center mt-32 text-gray-300 text-[10px] uppercase tracking-[0.5em] font-black py-12 border-t border-gray-50">
            Smart AI Diary Digital Archive • Generated on ${new Date().toLocaleDateString()}
          </footer>
        </div>
        <script>
          window.onload = () => {
            // Give images some time to load before printing
            setTimeout(() => {
              window.print();
            }, 500);
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(content);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/60 backdrop-blur-md p-4">
      <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300 border border-white">
        <div className="px-10 py-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/20">
          <h3 className="text-xl font-black text-gray-900 tracking-tight">导出我的日记</h3>
          <button onClick={onClose} className="p-3 hover:bg-gray-100 rounded-2xl transition text-gray-400">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        
        <div className="p-12 space-y-8">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3">开始时间</label>
              <input 
                type="date" 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-orange-50 outline-none transition-all font-bold text-gray-700"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3">结束时间</label>
              <input 
                type="date" 
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-orange-50 outline-none transition-all font-bold text-gray-700"
              />
            </div>
          </div>

          <div className="bg-orange-50/50 p-6 rounded-[1.5rem] border border-orange-100">
            <div className="flex gap-4">
              <div className="text-orange-600 mt-0.5">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
              </div>
              <p className="text-sm text-orange-800 font-medium leading-relaxed">
                导出功能将为您生成一份精美的日记档案，包含您上传的所有珍贵照片。您可以直接保存为 PDF 永久收藏。
              </p>
            </div>
          </div>

          <button 
            onClick={handleExport}
            className="w-full py-5 bg-gray-900 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-gray-200 active:scale-[0.98]"
          >
            生成档案预览
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportModal;
