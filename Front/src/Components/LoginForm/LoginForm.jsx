import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import authService from '../../authService';
import logo from '../../logo/logo.png';
import '../../index.css';

function LoginForm() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (authService.isAuthenticated()) {
      navigate('/');
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      await authService.login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-[calc(1rem+env(safe-area-inset-top))]">
      <div className='back'></div>
      
      {}
      <div className="flex w-full max-w-md flex-col md:hidden relative z-10">
        <div className="rounded-t-3xl bg-gradient-to-br from-blue-600 to-blue-800 p-6 text-white">
          <div className="flex items-center justify-center gap-3">
            <img src={logo} alt="Locus Logo" className='w-12 h-12 rounded-xl bg-white/10 p-2' />
            <h1 className="text-2xl font-bold">Locus</h1>
          </div>
          <p className="mt-4 text-center text-sm text-blue-100">Интерактивный журнал строительного контроля</p>
        </div>

        <div className="rounded-b-3xl bg-white/95 backdrop-blur-sm p-6 shadow-2xl">
          <div className="mb-6 text-center">
            <h2 className="text-xl font-bold text-gray-900">Вход в систему</h2>
            <p className="mt-1 text-sm text-gray-600">Введите учетные данные</p>
          </div>

          {error && (
            <div className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Логин или e-mail</label>
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                placeholder="Введите логин"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Пароль</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 pr-12 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  placeholder="Введите пароль"
                  required
                />
                <button 
                  type='button' 
                  onClick={() => setShowPassword(!showPassword)} 
                  className='absolute inset-y-0 right-0 flex items-center justify-center w-12 text-gray-500 hover:text-gray-700'
                  aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-blue-600 py-3 font-semibold text-white transition-colors hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? 'Вход...' : 'Войти в систему'}
            </button>
          </form>

          <p className='mt-6 text-center text-sm text-gray-600'>
            Нет аккаунта?{' '}
            <Link to="/register" className='font-semibold text-blue-600 hover:text-blue-800'>
              Регистрация
            </Link>
          </p>
        </div>
      </div>

      {}
      <div className="hidden w-full max-w-5xl overflow-hidden rounded-3xl bg-white/95 backdrop-blur-sm shadow-2xl md:flex relative z-10">
        <div className="relative w-2/5 bg-gradient-to-br from-blue-600 to-blue-800 p-10 text-white">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-4">
              <img src={logo} alt="Locus Logo" className='w-14 h-14 rounded-xl bg-white/10 p-2' />
              <h1 className="text-3xl font-bold">Locus</h1>
            </div>
            <div className="mt-16">
              <h2 className="text-2xl font-semibold mb-4">Интерактивный журнал строительного контроля</h2>
              <p className="text-blue-100 leading-relaxed">
                Современная платформа для управления строительными проектами и контроля качества работ в реальном времени.
              </p>
            </div>
          </div>
        </div>

        <div className="w-3/5 p-10">
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Вход в систему</h2>
            <p className="text-gray-600">Введите ваши учетные данные для доступа</p>
          </div>

          {error && (
            <div className="mb-6 rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Логин или e-mail</label>
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-gray-300 bg-white/80 px-4 py-3 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                placeholder="Введите ваш логин"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Пароль</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 bg-white/80 px-4 py-3 pr-12 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  placeholder="Введите ваш пароль"
                  required
                />
                <button 
                  type='button' 
                  onClick={() => setShowPassword(!showPassword)} 
                  className='absolute inset-y-0 right-0 flex items-center justify-center w-12 text-gray-500 hover:text-gray-700'
                  aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-blue-600 py-3 font-semibold text-white transition-colors hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? 'Вход...' : 'Войти в систему'}
            </button>
          </form>

          <p className='mt-6 text-center text-sm text-gray-600'>
            Если у вас нет аккаунта:{' '}
            <Link to="/register" className='font-semibold text-blue-600 hover:text-blue-800'>
              Регистрация
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export { LoginForm };
