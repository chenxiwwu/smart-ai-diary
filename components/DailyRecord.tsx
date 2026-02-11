
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { DayEntry, Todo, Expense, MediaFile } from '../types';
import { generateMyDaySummary } from '../services/geminiService';
import { api, SERVER_BASE } from '../services/api';
import MediaPreview from './MediaPreview';

const DAILY_QUOTES = [
  { text: '世界上只有一种英雄主义，就是看清生活的真相之后依然热爱生活。', source: '罗曼·罗兰《米开朗琪罗传》' },
  { text: '一个人知道自己为什么而活，就可以忍受任何一种生活。', source: '尼采《偶像的黄昏》' },
  { text: '我们必须接受失望，因为它是有限的；但千万不可失去希望，因为它是无穷的。', source: '马丁·路德·金' },
  { text: '你那么憎恨那些人，和他们斗了那么久，最终却变得和他们一样，人世间没有任何理想值得以这样的沉沦作为代价。', source: '马尔克斯《百年孤独》' },
  { text: '凡是过往，皆为序章。', source: '莎士比亚《暴风雨》' },
  { text: '生活不可能像你想象的那么好，但也不会像你想象的那么糟。', source: '莫泊桑《一生》' },
  { text: '黑夜无论怎样悠长，白昼总会到来。', source: '莎士比亚《麦克白》' },
  { text: '人真正变强大，不是因为守护着自尊心，而是抛开自尊心的时候。', source: '村上春树《一九七三年的弹子球》' },
  { text: '我曾经沧海难为水，归来仍是少年。', source: '改自元稹《离思》' },
  { text: '你不愿意种花，你说，我不愿看见它一点点凋落。是的，为了避免结束，你避免了一切开始。', source: '顾城' },
  { text: '纵有疾风起，人生不言弃。', source: '保尔·瓦雷里《海滨墓园》' },
  { text: '每一个不曾起舞的日子，都是对生命的辜负。', source: '尼采' },
  { text: '所谓无底深渊，下去也是前程万里。', source: '木心《素履之往》' },
  { text: '我用什么才能留住你？我给你贫穷的街道、绝望的日落、破败郊区的月亮。', source: '博尔赫斯《我用什么才能留住你》' },
  { text: '万物皆有裂痕，那是光照进来的地方。', source: 'Leonard Cohen《Anthem》' },
  { text: '吹灭读书灯，一身都是月。', source: '桂苓《吹灭读书灯》' },
  { text: '一个人只拥有此生此世是不够的，他还应该拥有诗意的世界。', source: '王小波《万寿寺》' },
  { text: '你要做一个不动声色的大人了。不准情绪化，不准偷偷想念，不准回头看。', source: '村上春树《舞!舞!舞!》' },
  { text: '我们飞得越高，在那些不能飞的人眼中的形象就越渺小。', source: '尼采《查拉图斯特拉如是说》' },
  { text: '一星陨落，黯淡不了星空灿烂；一花凋零，荒芜不了整个春天。', source: '巴尔扎克' },
  { text: '醉过才知酒浓，爱过才知情重。你不能做我的诗，正如我不能做你的梦。', source: '胡适' },
  { text: '在自己身上，克服这个时代。', source: '尼采' },
  { text: '活着不是靠泪水博得同情，而是靠汗水赢得掌声。', source: '余华《活着》' },
  { text: '把每一个黎明看作生命的开始，把每一个黄昏看作生命的小结。', source: '罗斯金' },
  { text: '只要你自己不倒，别人可以把你按倒在地上，却不能阻止你满面灰尘遍体伤痕地站起来。', source: '毕淑敏' },
  { text: '温柔要有，但不是妥协。我们要在安静中，不慌不忙地坚强。', source: '林语堂' },
  { text: '少年与爱永不老去，即便披荆斩棘，丢失怒马鲜衣。', source: '莎士比亚' },
  { text: '当华美的叶片落尽，生命的脉络才历历可见。', source: '聂鲁达' },
  { text: '人生如逆旅，我亦是行人。', source: '苏轼《临江仙》' },
  { text: '生命从来不曾离开过孤独而独立存在。我们的出生、成长最后的归宿，都是一个人完成的。', source: '贾平凹《自在独行》' },
  { text: '我什么也没忘，但是有些事只适合收藏。不能说，也不能想，却又不能忘。', source: '史铁生《我与地坛》' },
];

function getDailyQuote(dateStr: string) {
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = ((hash << 5) - hash) + dateStr.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % DAILY_QUOTES.length;
  return DAILY_QUOTES[index];
}

interface DailyRecordProps {
  entry: DayEntry;
  onUpdate: (update: Partial<DayEntry>) => void;
}

const DailyRecord: React.FC<DailyRecordProps> = ({ entry, onUpdate }) => {
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [showAIConfirm, setShowAIConfirm] = useState(false);
  const [todoInput, setTodoInput] = useState('');
  const [expenseName, setExpenseName] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);

  const formattedDate = new Date(entry.date).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  });

  const handleAddTodo = () => {
    if (!todoInput.trim()) return;
    const newTodo: Todo = { id: Date.now().toString(), text: todoInput.trim(), completed: false };
    onUpdate({ todos: [...entry.todos, newTodo] });
    setTodoInput('');
  };

  const handleToggleTodo = (id: string) => {
    onUpdate({
      todos: entry.todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t)
    });
  };

  const handleDeleteTodo = (id: string) => {
    onUpdate({ todos: entry.todos.filter(t => t.id !== id) });
  };

  const handleAddExpense = () => {
    if (!expenseName.trim() || !expenseAmount) return;
    const newExpense: Expense = { 
      id: Date.now().toString(), 
      item: expenseName.trim(), 
      amount: parseFloat(expenseAmount) 
    };
    onUpdate({ expenses: [...entry.expenses, newExpense] });
    setExpenseName('');
    setExpenseAmount('');
  };

  const handleDeleteExpense = (id: string) => {
    onUpdate({ expenses: entry.expenses.filter(e => e.id !== id) });
  };

  const handleInsightSave = () => {
    if (editorRef.current) {
      onUpdate({ insight: editorRef.current.innerHTML });
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video' | 'audio') => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const uploadedMedia: MediaFile[] = [];
      for (const file of Array.from(files)) {
        const result = await api.uploadFile(file, entry.date);
        // 后端返回的 url 是相对路径如 /uploads/xxx，需要拼接服务器地址
        const fullUrl = result.media.url.startsWith('http')
          ? result.media.url
          : `${SERVER_BASE}${result.media.url}`;
        uploadedMedia.push({
          id: result.media.id,
          type: result.media.type,
          url: fullUrl,
          name: result.media.name,
        });
      }
      onUpdate({ media: [...entry.media, ...uploadedMedia] });
    } catch (err) {
      console.error('Upload failed:', err);
      alert('文件上传失败，请确保后端服务正在运行');
    } finally {
      setUploading(false);
      // 重置 input，允许重复选择同一文件
      e.target.value = '';
    }
  };

  const runAISummary = async () => {
    setIsSummarizing(true);
    setShowAIConfirm(false);
    try {
      const summary = await generateMyDaySummary(entry);
      onUpdate({ myDaySummary: summary });
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleAIButtonClick = () => {
    if (entry.myDaySummary && entry.myDaySummary.trim().length > 0) {
      setShowAIConfirm(true);
    } else {
      runAISummary();
    }
  };

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== entry.insight) {
      editorRef.current.innerHTML = entry.insight || '';
    }
  }, [entry.date]);

  const applyFormat = (command: string, value: string = '') => {
    document.execCommand(command, false, value);
    handleInsightSave();
  };

  const colors = [
    { name: '默认', value: '#111827' },
    { name: '晨曦', value: '#f59e0b' },
    { name: '朝霞', value: '#ef4444' },
    { name: '落日', value: '#8b5cf6' },
    { name: '暮色', value: '#3b82f6' },
  ];

  const totalExpense = entry.expenses.reduce((sum, e) => sum + e.amount, 0);

  const dailyQuote = useMemo(() => getDailyQuote(entry.date), [entry.date]);

  return (
    <div className="w-full max-w-[1440px] mx-auto px-8 md:px-12 py-10 animate-in fade-in slide-in-from-bottom-2 duration-700">
      <header className="mb-12 border-b border-orange-100 pb-10">
        <div className="flex items-start justify-between gap-8 mb-8">
          <h2 className="text-6xl font-black text-gray-900 tracking-tight font-serif-display leading-tight">{formattedDate}</h2>
          <div className="max-w-xs flex-shrink-0 bg-orange-50/60 rounded-2xl px-5 py-4 mt-1">
            <p className="text-sm font-medium text-gray-700 leading-relaxed italic font-serif-display">"{dailyQuote.text}"</p>
            <p className="text-[10px] text-gray-400 font-semibold mt-2 text-right tracking-wide">—— {dailyQuote.source}</p>
          </div>
        </div>
        <div className="flex items-center justify-between gap-6">
          <div className="flex items-center gap-4 flex-1">
            <span className="text-[10px] font-black text-orange-600 bg-orange-50 px-4 py-1.5 rounded-full uppercase tracking-[0.2em] border border-orange-200 flex-shrink-0">MY DAY</span>
            <input 
              type="text"
              value={isSummarizing ? '✨ 正在生成关键词...' : (entry.myDaySummary || '')}
              onChange={(e) => onUpdate({ myDaySummary: e.target.value })}
              placeholder="点击编辑或点击右侧生成关键词"
              disabled={isSummarizing}
              className="text-gray-900 italic text-lg font-medium bg-transparent border-none outline-none focus:ring-2 focus:ring-orange-100 rounded px-2 py-1 w-full max-w-xl transition-all font-serif-display placeholder:text-gray-400"
            />
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <button 
              onClick={handleAIButtonClick}
              disabled={isSummarizing}
              className="group flex items-center gap-2 px-6 py-2.5 bg-white text-orange-600 rounded-xl font-bold hover:bg-orange-50 transition-all disabled:opacity-50 active:scale-95 border border-orange-200 shadow-sm"
            >
              <svg className="w-4 h-4 group-hover:rotate-12 transition-transform" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M11.3 1.047a1 1 0 01.897.103l7 5a1 1 0 010 1.7l-7 5a1 1 0 01-1.194-.034l-3-2a1 1 0 010-1.666l3-2a1 1 0 011.194-.034l.403.268.403-.268a1 1 0 011.194.034l3 2a1 1 0 010 1.666l-3 2a1 1 0 01-1.194-.034l-.403-.268-.403.268zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0-4a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
              <span className="text-xs">生成 AI 总结</span>
            </button>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-12">
        <div className="xl:col-span-4 space-y-10">
          {/* Todo List */}
          <section className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-orange-50">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-[11px] font-black text-orange-500 uppercase tracking-[0.2em]">Todo List</h3>
              <span className="text-xs font-bold text-orange-600 bg-orange-50 px-3 py-1 rounded-full border border-orange-200">
                {entry.todos.filter(t => t.completed).length}/{entry.todos.length}
              </span>
            </div>
            <div className="flex items-stretch gap-3 mb-8">
              <input 
                type="text" 
                value={todoInput}
                onChange={(e) => setTodoInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddTodo()}
                placeholder="想要完成的事..."
                className="flex-1 px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-base focus:ring-4 focus:ring-orange-50 outline-none transition-all placeholder:text-gray-400 font-medium text-gray-900 font-serif-display"
              />
              <button 
                onClick={handleAddTodo} 
                className="w-[52px] flex-shrink-0 flex items-center justify-center bg-gray-900 text-white rounded-2xl hover:bg-black transition-all active:scale-90"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
            <div className="space-y-2">
              {entry.todos.map(todo => (
                <div key={todo.id} className="group flex items-center gap-4 py-3 hover:bg-orange-50/40 rounded-2xl px-3 transition-all">
                  <input 
                    type="checkbox" 
                    checked={todo.completed} 
                    onChange={() => handleToggleTodo(todo.id)}
                    className="w-5 h-5 text-orange-600 rounded-lg border-gray-300 focus:ring-orange-500 cursor-pointer"
                  />
                  <span className={`flex-1 text-base font-medium transition-all font-serif-display ${todo.completed ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                    {todo.text}
                  </span>
                  <button onClick={() => handleDeleteTodo(todo.id)} className="opacity-0 group-hover:opacity-100 p-2 text-gray-500 hover:text-red-500 transition-all">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              ))}
              {entry.todos.length === 0 && <p className="text-center text-gray-400 text-sm py-14 font-medium tracking-wide font-serif-display">今天还没有计划呢</p>}
            </div>
          </section>

          {/* Expenditures */}
          <section className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-indigo-50">
            <h3 className="text-[11px] font-black text-indigo-500 uppercase tracking-[0.2em] mb-8">Expenditures</h3>
            <div className="flex items-stretch gap-3 mb-8">
              <input 
                type="text" 
                value={expenseName}
                onChange={(e) => setExpenseName(e.target.value)}
                placeholder="内容"
                className="min-w-0 flex-1 px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-base outline-none focus:ring-4 focus:ring-indigo-50 font-medium text-gray-900 placeholder:text-gray-400 font-serif-display"
              />
              <input 
                type="number" 
                value={expenseAmount}
                onChange={(e) => setExpenseAmount(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddExpense()}
                placeholder="¥"
                className="w-20 flex-shrink-0 px-3 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-base outline-none focus:ring-4 focus:ring-indigo-50 font-medium text-gray-900 placeholder:text-gray-400 font-serif-display"
              />
              <button 
                onClick={handleAddExpense} 
                className="w-[52px] flex-shrink-0 flex items-center justify-center bg-gray-900 text-white rounded-2xl hover:bg-black transition-all active:scale-90"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
            <div className="space-y-1">
              {entry.expenses.map(exp => (
                <div key={exp.id} className="group flex justify-between items-center text-base py-3 px-3 hover:bg-indigo-50/40 rounded-2xl transition-all font-serif-display">
                  <span className="text-gray-900 font-medium">{exp.item}</span>
                  <div className="flex items-center gap-4">
                    <span className="font-semibold text-gray-900">¥{exp.amount.toFixed(2)}</span>
                    <button onClick={() => handleDeleteExpense(exp.id)} className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-indigo-600 transition-all">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                </div>
              ))}
              <div className="pt-8 mt-6 border-t border-gray-100">
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-[9px] font-black text-gray-500 uppercase tracking-[0.3em] mb-2">Investment Total</p>
                    <p className="text-2xl font-black text-indigo-600 leading-none tracking-tight">¥{totalExpense.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="xl:col-span-8 space-y-10">
          <section className="bg-white rounded-[3rem] shadow-sm border border-orange-50 flex flex-col min-h-[700px] overflow-hidden">
            <div className="px-10 py-6 border-b border-gray-100 flex items-center justify-between bg-orange-50/10 backdrop-blur-md sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <button onClick={() => applyFormat('bold')} className="w-10 h-10 flex items-center justify-center hover:bg-white hover:shadow-sm rounded-xl text-gray-700 transition-all font-bold" title="加粗">B</button>
                <button onClick={() => applyFormat('italic')} className="w-10 h-10 flex items-center justify-center hover:bg-white hover:shadow-sm rounded-xl text-gray-700 transition-all italic" title="斜体">I</button>
                <div className="w-px h-6 bg-gray-200 mx-1"></div>
                <div className="flex items-center gap-1.5 px-2">
                  {colors.map(c => (
                    <button
                      key={c.value}
                      onClick={() => applyFormat('foreColor', c.value)}
                      className="w-5 h-5 rounded-full border border-white shadow-sm transition-all hover:scale-125"
                      style={{ backgroundColor: c.value }}
                      title={c.name}
                    />
                  ))}
                </div>
                <div className="w-px h-6 bg-gray-200 mx-1"></div>
                <label className={`w-10 h-10 flex items-center justify-center hover:bg-white hover:shadow-sm rounded-xl text-orange-600 cursor-pointer transition-all ${uploading ? 'opacity-50 pointer-events-none' : ''}`} title="上传图片">
                  <input type="file" multiple accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'image')} disabled={uploading} />
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                </label>
                <label className={`w-10 h-10 flex items-center justify-center hover:bg-white hover:shadow-sm rounded-xl text-indigo-600 cursor-pointer transition-all ${uploading ? 'opacity-50 pointer-events-none' : ''}`} title="上传视频">
                  <input type="file" multiple accept="video/*" className="hidden" onChange={(e) => handleFileUpload(e, 'video')} disabled={uploading} />
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                </label>
                {uploading && (
                  <div className="flex items-center gap-2 ml-2">
                    <div className="w-4 h-4 border-2 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-xs text-orange-600 font-bold">上传中...</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-6 pr-2">
                {entry.lastSavedAt && (
                  <span className="text-[11px] text-gray-700 font-bold uppercase tracking-widest bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100">
                    上次保存于 {entry.lastSavedAt}
                  </span>
                )}
                <button 
                  onClick={handleInsightSave}
                  className="px-8 py-3 bg-gray-900 text-white rounded-2xl text-sm font-bold hover:bg-black transition-all shadow-xl shadow-gray-200 active:scale-95"
                >
                  保存感悟
                </button>
              </div>
            </div>
            
            <div 
              ref={editorRef}
              contentEditable
              onBlur={handleInsightSave}
              className="flex-1 px-14 py-12 outline-none prose prose-slate max-w-none text-gray-900 text-base leading-[1.8] font-serif-display min-h-[400px] selection:bg-orange-100"
            ></div>

            {entry.media.length > 0 && (
              <div className="px-14 py-10 border-t border-orange-50 bg-orange-50/5">
                <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] mb-8">Creative Assets</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                  {entry.media.map((file, index) => (
                    <div key={file.id} className="relative aspect-[4/3] rounded-[2rem] overflow-hidden bg-white shadow-xl shadow-gray-100/30 border border-white group transition-all hover:scale-[1.02] cursor-pointer" onClick={() => setPreviewIndex(index)}>
                      {file.type === 'image' && <img src={file.url} alt="" className="w-full h-full object-cover" />}
                      {file.type === 'video' && (
                        <video src={file.url} className="w-full h-full object-cover" />
                      )}
                      <button 
                        onClick={(e) => { e.stopPropagation(); onUpdate({ media: entry.media.filter(m => m.id !== file.id) }); }}
                        className="absolute top-4 right-4 p-2 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100 transition-all shadow-xl hover:bg-red-600 z-20"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showAIConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] shadow-2xl p-10 max-w-sm w-full border border-orange-100 animate-in zoom-in duration-300">
            <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center text-orange-600 mb-6">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-black text-gray-900 mb-2">覆盖现有内容？</h3>
            <p className="text-gray-600 text-sm font-medium leading-relaxed mb-8">
              当前关键词已有内容，重新生成 AI 总结将会覆盖它。确定要继续吗？
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setShowAIConfirm(false)}
                className="flex-1 py-3.5 text-sm font-bold text-gray-500 bg-gray-100 rounded-2xl hover:bg-gray-200 transition-all"
              >
                取消
              </button>
              <button 
                onClick={runAISummary}
                className="flex-1 py-3.5 text-sm font-bold text-white bg-orange-600 rounded-2xl hover:bg-orange-700 transition-all shadow-lg shadow-orange-100"
              >
                确认覆盖
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Media Preview */}
      {previewIndex !== null && entry.media.length > 0 && (
        <MediaPreview
          media={entry.media}
          currentIndex={previewIndex}
          onClose={() => setPreviewIndex(null)}
          onNavigate={(i) => setPreviewIndex(i)}
        />
      )}
    </div>
  );
};

export default DailyRecord;
