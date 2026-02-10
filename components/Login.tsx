import React, { useState } from 'react';

interface LoginProps {
  onLogin: (email: string, password: string) => Promise<void>;
  onRegister: (email: string, password: string, name?: string) => Promise<void>;
  loading: boolean;
  error: string | null;
}

export default function Login({ onLogin, onRegister, loading, error }: LoginProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isLogin) {
        await onLogin(email, password);
      } else {
        await onRegister(email, password, name);
      }
    } catch (err) {
      // Error handled by parent
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-amber-50 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-orange-600 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-xl shadow-orange-100 mx-auto mb-6">
            D
          </div>
          <h1 className="text-3xl font-black text-gray-900 mb-2">Smart D</h1>
          <p className="text-gray-500 font-medium">AI 智能日记</p>
        </div>

        <div className="bg-white rounded-[2.5rem] shadow-xl shadow-gray-200/50 border border-orange-50 p-10">
          <h2 className="text-xl font-bold text-gray-900 mb-8 text-center">
            {isLogin ? '欢迎回来' : '创建账号'}
          </h2>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 text-sm font-medium rounded-2xl">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">
                  昵称
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="你的名字"
                  className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:ring-4 focus:ring-orange-50 outline-none transition-all placeholder:text-gray-400 font-medium text-gray-900"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">
                邮箱
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:ring-4 focus:ring-orange-50 outline-none transition-all placeholder:text-gray-400 font-medium text-gray-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">
                密码
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:ring-4 focus:ring-orange-50 outline-none transition-all placeholder:text-gray-400 font-medium text-gray-900"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-orange-600 text-white rounded-2xl font-bold text-sm hover:bg-orange-700 transition-all disabled:opacity-50 active:scale-[0.98] shadow-lg shadow-orange-100 mt-8"
            >
              {loading ? '请稍候...' : isLogin ? '登录' : '注册'}
            </button>
          </form>

          <div className="mt-8 text-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm font-medium text-gray-500 hover:text-orange-600 transition-colors"
            >
              {isLogin ? '还没有账号？' : '已有账号？'} 点击登录
            </button>
          </div>
        </div>

        <p className="text-center text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] mt-8">
          Crafted with Life
        </p>
      </div>
    </div>
  );
}
