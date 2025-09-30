import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AuthService from '../../AuthService.js';
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
    if (AuthService.isAuthenticated()) {
      navigate('/');
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      await AuthService.login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen absolute flex items-center justify-center p-4 w-full">
      <div className='back'></div>
      <div className="hidden md:flex bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden w-full max-w-4xl relative z-10">
        <div className="w-2/5 bg-gradient-to-br from-blue-600/90 to-blue-800/90 p-8 text-white relative">
            <div className="absolute inset-0 bg-black/20"></div>
            <div className="relative z-10">
                <div className="flex items-center mb-6">
                    <img src={logo} alt="Locus Logo" className='w-12 h-12 bg-blue-600 rounded-lg p-1' />
                    <h1 className="text-2xl font-bold ml-4">Locus</h1>
                </div>
                <div className="mt-12">
                    <h2 className="text-xl font-semibold mb-4">Интерактивный журнал строительного контроля</h2>
                    <p className="text-blue-100/90 text-sm leading-relaxed">Современная платформа для управления строительными проектами и контроля качества работ в реальном времени.</p>
                </div>
            </div>
        </div>

        <div className="w-3/5 p-10">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Вход в систему</h2>
                <p className="text-gray-600">Введите ваши учетные данные для доступа</p>
            </div>

            {error && (
                <div className="mb-6 p-3 bg-red-100 text-red-700 rounded-lg text-sm">{error}</div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Логин или e-mail</label>
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">Пароль</label>
                    <div className="relative">
                        <input
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-white/80"
                            placeholder="Введите ваш пароль"
                            required
                        />
                        <button type='button' onClick={() => setShowPassword(!showPassword)} className='absolute inset-y-0 right-0 px-4 flex items-center text-gray-500'>
                           <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                        </button>
                    </div>
                </div>
                <div className="flex items-center justify-between">
                    <a href="#" className="text-sm text-blue-600 hover:text-blue-800 transition-colors">Забыли пароль?</a>
                </div>
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                >
                    {loading ? 'Вход...' : 'Войти в систему'}
                </button>
            </form>
            <p className='mt-4 text-sm text-gray-600 text-center'>Если у вас нет аккаунта: <Link to="/register" className='text-blue-600 hover:text-blue-800 font-medium'>Регистрация</Link></p>
        </div>
      </div>
    </div>
  );
}

export { LoginForm };