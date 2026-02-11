
import React, { useState } from 'react';
import { DayEntry } from '../types';

interface ExportModalProps {
  entries: Record<string, DayEntry>;
  onClose: () => void;
  userName?: string;
}

const ExportModal: React.FC<ExportModalProps> = ({ entries, onClose, userName }) => {
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

    const displayName = userName || 'My';

    const content = `
      <!DOCTYPE html>
      <html lang="zh-CN">
      <head>
        <meta charset="UTF-8">
        <title>我的日记导出 - ${startDate} 至 ${endDate}</title>
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400;1,700&family=Noto+Serif+SC:wght@400;600;700&display=swap" rel="stylesheet">
        <style>
          @page {
            size: A4;
            margin: 18mm 16mm 18mm 16mm;
          }
          @media print {
            body { background: white; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .cover-page { page-break-after: always; }
          }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: 'Noto Serif SC', 'STSong', 'SimSun', serif;
            font-size: 10pt;
            line-height: 1.75;
            color: #2a2a2a;
            background: white;
          }
          .book-container { max-width: 680px; margin: 0 auto; padding: 0; }

          /* 封面页 */
          .cover-page {
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            min-height: 90vh;
            text-align: center;
            padding: 60px 40px;
          }
          .cover-line {
            width: 50px;
            height: 3px;
            background: #c05621;
            margin: 0 auto 32px;
          }
          .cover-title {
            font-family: 'Playfair Display', serif;
            font-size: 14pt;
            font-weight: 400;
            letter-spacing: 8px;
            text-transform: uppercase;
            color: #999;
            margin-bottom: 16px;
          }
          .cover-name {
            font-family: 'Playfair Display', serif;
            font-size: 32pt;
            font-weight: 900;
            color: #111;
            margin-bottom: 4px;
            letter-spacing: -0.5px;
          }
          .cover-subtitle {
            font-family: 'Noto Serif SC', serif;
            font-size: 11pt;
            color: #888;
            font-weight: 400;
            margin-bottom: 40px;
          }
          .cover-date-range {
            font-family: 'Playfair Display', serif;
            font-size: 9pt;
            color: #bbb;
            letter-spacing: 3px;
          }
          .cover-line-bottom {
            width: 50px;
            height: 3px;
            background: #c05621;
            margin: 32px auto 0;
          }

          /* 每日条目 */
          .entry {
            margin-bottom: 8px;
            padding-bottom: 14px;
            border-bottom: 1px solid #eaeaea;
            page-break-inside: avoid;
          }
          .entry:last-child { border-bottom: none; }

          .entry-header {
            display: flex;
            align-items: baseline;
            justify-content: space-between;
            margin-bottom: 4px;
            padding-top: 10px;
          }
          .entry-date {
            font-family: 'Playfair Display', serif;
            font-size: 15pt;
            font-weight: 900;
            color: #111;
          }
          .entry-myday {
            font-size: 9pt;
            color: #c05621;
            font-style: italic;
            font-weight: 600;
          }
          .entry-summary {
            font-size: 8.5pt;
            color: #888;
            font-style: italic;
            margin-top: 2px;
          }

          /* 感悟正文 */
          .entry-insight {
            font-size: 10pt;
            line-height: 1.85;
            color: #333;
            margin-bottom: 8px;
            text-align: left;
          }

          /* 图片网格 */
          .entry-images {
            display: flex;
            gap: 6px;
            margin-bottom: 8px;
            flex-wrap: wrap;
          }
          .entry-images img {
            height: 80px;
            width: auto;
            border-radius: 4px;
            object-fit: cover;
            border: 1px solid #eee;
          }

          /* Todo 和支出并排 */
          .entry-meta {
            display: flex;
            gap: 24px;
            font-size: 8.5pt;
            color: #666;
            margin-top: 6px;
          }
          .meta-section { flex: 1; }
          .meta-label {
            font-size: 7pt;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 2px;
            color: #aaa;
            margin-bottom: 3px;
          }
          .todo-item {
            display: flex;
            align-items: center;
            gap: 5px;
            line-height: 1.6;
          }
          .todo-dot {
            display: inline-block;
            width: 6px;
            height: 6px;
            border-radius: 50%;
            flex-shrink: 0;
          }
          .todo-dot.done { background: #c05621; }
          .todo-dot.undone { background: #ddd; }
          .todo-text.done { text-decoration: line-through; color: #bbb; }

          .expense-row {
            display: flex;
            justify-content: space-between;
            line-height: 1.6;
          }
          .expense-total {
            display: flex;
            justify-content: space-between;
            border-top: 1px solid #eee;
            margin-top: 2px;
            padding-top: 2px;
            font-weight: 700;
            color: #4338ca;
            font-size: 8.5pt;
          }

          /* 页脚 */
          .book-footer {
            text-align: center;
            margin-top: 24px;
            padding-top: 12px;
            border-top: 1px solid #e8e8e8;
            font-size: 7pt;
            color: #ccc;
            letter-spacing: 2px;
          }
        </style>
      </head>
      <body>
        <div class="book-container">
          <!-- 封面 -->
          <div class="cover-page">
            <div class="cover-line"></div>
            <div class="cover-title">Diary</div>
            <div class="cover-name">${displayName}'s Journal</div>
            <div class="cover-subtitle">生活的点滴，值得被记住</div>
            <div class="cover-date-range">
              ${startDate.replace(/-/g, '.')} — ${endDate.replace(/-/g, '.')}
            </div>
            <div class="cover-line-bottom"></div>
          </div>

          <!-- 日记内容 -->
          ${filteredEntries.map(entry => {
            const images = entry.media?.filter(m => m.type === 'image') || [];
            const hasContent = entry.insight || images.length > 0 || entry.todos.length > 0 || entry.expenses.length > 0;
            if (!hasContent && !entry.myDaySummary) return '';
            
            return `
            <div class="entry">
              <div class="entry-header">
                <div class="entry-date">${entry.date}</div>
                ${entry.myDaySummary ? `<span class="entry-myday">${entry.myDaySummary}</span>` : ''}
              </div>

              ${entry.insight ? `<div class="entry-insight">${entry.insight}</div>` : ''}

              ${images.length > 0 ? `
                <div class="entry-images">
                  ${images.map(img => `<img src="${img.url}" />`).join('')}
                </div>
              ` : ''}

              ${(entry.todos.length > 0 || entry.expenses.length > 0) ? `
                <div class="entry-meta">
                  ${entry.todos.length > 0 ? `
                    <div class="meta-section">
                      <div class="meta-label">Todo</div>
                      ${entry.todos.map(t => `
                        <div class="todo-item">
                          <span class="todo-dot ${t.completed ? 'done' : 'undone'}"></span>
                          <span class="todo-text ${t.completed ? 'done' : ''}">${t.text}</span>
                        </div>
                      `).join('')}
                    </div>
                  ` : ''}
                  ${entry.expenses.length > 0 ? `
                    <div class="meta-section">
                      <div class="meta-label">Expenses</div>
                      ${entry.expenses.map(e => `
                        <div class="expense-row">
                          <span>${e.item}</span>
                          <span>¥${e.amount.toFixed(2)}</span>
                        </div>
                      `).join('')}
                      <div class="expense-total">
                        <span>Total</span>
                        <span>¥${entry.expenses.reduce((s, e) => s + e.amount, 0).toFixed(2)}</span>
                      </div>
                    </div>
                  ` : ''}
                </div>
              ` : ''}
            </div>
          `}).join('')}

          <div class="book-footer">
            ${displayName}'s Smart Diary · Generated on ${new Date().toLocaleDateString()}
          </div>
        </div>
        <script>
          window.onload = () => {
            setTimeout(() => { window.print(); }, 500);
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
