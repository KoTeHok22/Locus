import '../../index.css'
import '../RegistrationForm/RegistrationForm.jsx'
import authService from '../../authService.js'
import { useState } from 'react'

function LoginForm({onSwitchToRegistration, onSwitchToMagaz}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSumbit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      await authService.login(email, password);
      onSwitchToMagaz();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen absolute flex items-center justify-center p-4">
      
      <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-6 w-full max-w-md md:hidden relative z-10">
        <div className="text-center mb-6">
          <div className="flex items-center justify-center mb-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">L</span>
            </div>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-1">
            Locus
          </h1>
          <p className="text-gray-600 text-xs">
            Интерактивный журнал строительного контроля
          </p>
        </div>

        <h2 className="text-lg font-semibold text-gray-800 mb-4 text-center">
          Вход в систему
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSumbit} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Логин или e-mail
            </label>
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white/80"
              placeholder="Введите ваш логин"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Пароль
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white/80"
              placeholder="Введите ваш пароль"
              required
            />
          </div>

          <div className="text-right">
            <a href="#" className="text-xs text-blue-600 hover:text-blue-800">
              Забыли пароль?
            </a>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-blue-700 text-sm transition-colors disabled:opacity-50"
          >
            {loading ? 'Вход...' : 'Войти'}
          </button>
        </form>
        <p className='mt-4 text-xs text-gray-600 text-center'>Если у вас нет аккаунта: <button className='text-blue-600 hover:text-blue-800 font-medium' onClick={onSwitchToRegistration}>Регистрация</button></p>
        <div className="mt-6 pt-4 border-t border-gray-200/50">
          <p className="text-xs text-gray-600 text-center">
            © 2025 Locus. Все права защищены.
          </p>
        </div>
      </div>

      <div className="hidden md:flex bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden w-full max-w-4xl relative z-10">
        <div className="w-2/5 bg-gradient-to-br from-blue-600/90 to-blue-800/90 p-8 text-white relative">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="relative z-10">
            <div className="flex items-center mb-6">
              <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-2xl">L</span>
              </div>
              <h1 className="text-2xl font-bold ml-4">Locus</h1>
            </div>
            
            <div className="mt-12">
              <h2 className="text-xl font-semibold mb-4">
                Интерактивный журнал строительного контроля
              </h2>
              <p className="text-blue-100/90 text-sm leading-relaxed">
                Современная платформа для управления строительными проектами 
                и контроля качества работ в реальном времени
              </p>
            </div>

            <div className="mt-16">
              <div className="flex items-center space-x-2 text-blue-200 text-sm">
                <div className="w-2 h-2 bg-blue-300 rounded-full"></div>
                <span>Безопасный доступ 24/7</span>
              </div>
              <div className="flex items-center space-x-2 text-blue-200 text-sm mt-2">
                <div className="w-2 h-2 bg-blue-300 rounded-full"></div>
                <span>Мониторинг в реальном времени</span>
              </div>
            </div>
          </div>
        </div>

        <div className="w-3/5 p-10">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Вход в систему
            </h2>
            <p className="text-gray-600">
              Введите ваши учетные данные для доступа
            </p>
          </div>

          {error && (
            <div className="mb-6 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSumbit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Логин или e-mail
              </label>
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-white/80"
                placeholder="Введите ваш логин"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Пароль
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-white/80"
                placeholder="Введите ваш пароль"
                required
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-600">Запомнить меня</span>
              </label>
              
              <a href="#" className="text-sm text-blue-600 hover:text-blue-800 transition-colors">
                Забыли пароль?
              </a>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {loading ? 'Вход...' : 'Войти в систему'}
            </button>
          </form>

        <p className='mt-4 text-xs text-gray-600 text-center'>Если у вас нет аккаунта: <button className='text-blue-600 hover:text-blue-800 font-medium' onClick={onSwitchToRegistration}>Регистрация</button></p>

          <div className="mt-8 pt-6 border-t border-gray-200/50">
            <p className="text-xs text-gray-600 text-center">
              © 2025 Locus. Все права защищены.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export { LoginForm };