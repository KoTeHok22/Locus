import '../../index.css'
import authService from '../../authService.js'
import { useState } from 'react'
import logo from '../../logo/logo.png'


function RegistrationForm({onSwitchToLogin}){

    const [showPassword, setShowPassword] = useState(false);
    const [showConfPass, setShowConfPass] = useState(false);

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: ''
    });

    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSumbit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        
        try {
            if (!validatePassword(formData.password)) {
                throw new Error("Пароль должен содержать минимум 8 символов, включая заглавную букву и цифру");
            }
            
            if (formData.password !== formData.confirmPassword) {
                throw new Error("Пароли не совпадают");
            }
            
            await authService.register(formData.email, formData.password);
            alert("Вы успешно зарегистрировались");
            onSwitchToLogin();
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    }

    function validatePassword(password) {

        if (password.length < 8) return false;
        if (!/[A-Z]/.test(password)) return false;
        if (!/[a-z]/.test(password)) return false;
        if (!/[0-9]/.test(password)) return false;

        return true;
    }

    return(

    <div className="min-h-screen absolute flex items-center justify-center p-4">

      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md md:hidden">

        <div className="text-center mb-6">
          <div className="flex items-center justify-center mb-3">
            <img src={ logo } alt="RIP" className='w-15 h-15 bg-blue-600 rounded-lg flex items-center justify-center' />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-1">
            Locus
          </h1>
          <p className="text-gray-600 text-xs">
            Регистрация в системе
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSumbit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Имя*
              </label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                placeholder="Имя"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Фамилия*
              </label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                placeholder="Фамилия"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email*
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              placeholder="email@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Телефон
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              placeholder="+7 (999) 999-99-99"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Пароль*
            </label>
            <div>
              <input
              name="password"
              type={!showPassword ? "text" : "password" }
              value={formData.password}
              onChange={handleChange}
              className="w-[90%] px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              placeholder="Не менее 8 символов"
              required
            />

            <button type='button' onClick={() => {setShowPassword(!showPassword); e.preventDefault()}} name='eye' className='w-[10%]'>
                {showPassword ? (
                <svg className="w-[50%] h-5px self-center" fill="none" stroke="currentColor" viewBox="0 -5 24 24">
                  <path d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a9.97 9.97 0 011.875-3.825m10.792 0a10.05 10.05 0 011.875 3.825M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                  <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                  <path d="M2 2l20 20"/>
                </svg>
              ) : (
                <svg className="w-[50%] h-5px" fill="none" stroke="currentColor" viewBox="0 -5 24 24">
                  <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                  <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                </svg>
              )}
            </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Подтверждение пароля*
            </label>
            <input
              name="confirmPassword"
              type={!showConfPass ? "text" : "password"}
              value={formData.confirmPassword}
              onChange={handleChange}
              className="w-[90%] px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              placeholder="Повторите пароль"
              required
            />

            <button type='button' onClick={() => {setShowConfPass(!showConfPass); e.preventDefault()}}  name='eye' className='w-[10%]'>
                {showConfPass ? (
                <svg className="w-[50%] h-5px self-center" fill="none" stroke="currentColor" viewBox="0 -5 24 24">
                  <path d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a9.97 9.97 0 011.875-3.825m10.792 0a10.05 10.05 0 011.875 3.825M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                  <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                  <path d="M2 2l20 20"/>
                </svg>
              ) : (
                <svg className="w-[50%] h-5px" fill="none" stroke="currentColor" viewBox="0 -5 24 24">
                  <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                  <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                </svg>
              )}
            </button>
          </div>

          <label className="flex flex-col items-start space-x-2 text-xs text-gray-600">
            
            <select name="role" className='w-[100%] text-[15px] text-center self-center focus:ring-blue-700 mb-2 mt-1 mx-0 p-2 border-2 border-blue-600 appearance-none bg-none rounded-[10px]'>
              
              <option value="" selected disabled>-- Выберите роль --</option>
              <option value="Manager">Заказчик</option>
              <option value="Foreman">Прораб</option>
              <option value="Inspector">Инспектор</option>
            
            </select>
            
            <div className='flex flex-row justify-center align-middle'>
              <input
                className=" w-6 h-6 m-2 text-blue-600 rounded focus:ring-blue-500"
                required type="checkbox"
              />
              
              <span className=''>
                Я соглашаюсь с условиями использования и политикой конфиденциальности
              </span>
            </div>

            
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors text-sm disabled:opacity-50"
          >
            {loading ? 'Регистрация...' : 'Зарегистрироваться'}
          </button>

        </form>

        <p className='mt-4 text-xs text-gray-600 text-center'>Если у вас есть аккаунт: <button className='text-blue-600 hover:text-blue-800 font-medium' onClick={onSwitchToLogin}>Войти</button></p>

        <div className="mt-6 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            © 2025 Locus. Все права защищены.
          </p>
        </div>
      </div>

      <div className="hidden md:flex bg-white rounded-2xl shadow-xl overflow-hidden w-full max-w-4xl">

        <div className="w-2/5 bg-gradient-to-br from-blue-600 to-blue-800 p-8 text-white">
          <div className="flex items-center mb-6">
            <img src={ logo } alt="RIP" className='w-15 h-15 bg-blue-600 rounded-lg flex items-center justify-center' />
            <h1 className="text-2xl font-bold ml-4">Locus</h1>
          </div>
          
          <div className="mt-12">
            <h2 className="text-xl font-semibold mb-4">
              Добро пожаловать в Locus
            </h2>
            <p className="text-blue-100 text-sm leading-relaxed">
              Присоединяйтесь к нашей платформе для управления проектами,
              мониторингом объектов, контролем исправлений,
              нарушений, замечаний и сотрудничества с командой
            </p>
          </div>

          <div className="mt-16 space-y-2">
            <div className="flex items-center space-x-2 text-blue-200 text-sm">
              <div className="w-2 h-2 bg-blue-300 rounded-full"></div>
              <span>Управление проектами</span>
            </div>
            <div className="flex items-center space-x-2 text-blue-200 text-sm">
              <div className="w-2 h-2 bg-blue-300 rounded-full"></div>
              <span>Командное сотрудничество</span>
            </div>
            <div className="flex items-center space-x-2 text-blue-200 text-sm">
              <div className="w-2 h-2 bg-blue-300 rounded-full"></div>
              <span>Безопасное хранение данных</span>
            </div>
          </div>
        </div>

        <div className="w-3/5 p-10">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Создать аккаунт
            </h2>
            <p className="text-gray-600">
              Заполните информацию для регистрации
            </p>
          </div>

          {error && (
            <div className="mb-6 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSumbit} className="space-y-6">

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Имя*
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  placeholder="Введите имя"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Фамилия*
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  placeholder="Введите фамилию"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email*
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                placeholder="email@example.com"
                required
              />
            </div>

            <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Пароль*
            </label>
            <div>
              <input
              name="password"
              type={!showPassword ? "text" : "password" }
              value={formData.password}
              onChange={handleChange}
              className="w-[90%] px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              placeholder="Не менее 8 символов"
              required
            />

            <button type='button' onClick={() => {setShowPassword(!showPassword); e.preventDefault()}} name='eye' className='w-[10%]'>
                {showPassword ? (
                <svg className="w-[50%] h-5px self-center" fill="none" stroke="currentColor" viewBox="0 -5 24 24">
                  <path d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a9.97 9.97 0 011.875-3.825m10.792 0a10.05 10.05 0 011.875 3.825M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                  <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                  <path d="M2 2l20 20"/>
                </svg>
              ) : (
                <svg className="w-[50%] h-5px" fill="none" stroke="currentColor" viewBox="0 -5 24 24">
                  <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                  <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                </svg>
              )}
            </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Подтверждение пароля*
            </label>
            <input
              name="confirmPassword"
              type={!showConfPass ? "text" : "password"}
              value={formData.confirmPassword}
              onChange={handleChange}
              className="w-[90%] px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              placeholder="Повторите пароль"
              required
            />

            <button type='button' onClick={() => {setShowConfPass(!showConfPass); e.preventDefault()}} name='eye' className='w-[10%]'>
                {showConfPass ? (
                <svg className="w-[50%] h-5px self-center" fill="none" stroke="currentColor" viewBox="0 -5 24 24">
                  <path d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a9.97 9.97 0 011.875-3.825m10.792 0a10.05 10.05 0 011.875 3.825M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                  <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                  <path d="M2 2l20 20"/>
                </svg>
              ) : (
                <svg className="w-[50%] h-5px" fill="none" stroke="currentColor" viewBox="0 -5 24 24">
                  <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                  <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                </svg>
              )}
            </button>
          </div>

              <label className="flex flex-col items-start space-x-3 text-xs text-gray-600">
            
            <select name="role" className='w-[100%] text-[15px] text-center self-center focus:ring-blue-700 mb-3 mx-0 p-2 border-2 border-blue-600 appearance-none bg-none rounded-[10px]'>
              
              <option value="" selected disabled>-- Выберите роль --</option>
              <option value="Manager">Заказчик</option>
              <option value="Foreman">Прораб</option>
              <option value="Inspector">Инспектор</option>
            
            </select>
            
            <div className='flex flex-row justify-center align-middle'>
              <input
                className=" w-5 h-5 m-2 text-blue-600 rounded focus:ring-blue-500"
                required type="checkbox"
              />
              
              <span className='text-sm'>
                Я соглашаюсь с условиями использования и политикой конфиденциальности
              </span>
            </div>

            
          </label>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {loading ? 'Регистрация...' : 'Создать аккаунт'}
            </button>


          </form>

          <p className='mt-4 text-xs text-gray-600 text-center'>Если у вас есть аккаунт: <button className='text-blue-600 hover:text-blue-800 font-medium' onClick={onSwitchToLogin}>Войти</button></p>
            
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              © 2025 Locus. Все права защищены.
            </p>
          </div>
        </div>
      </div>
    </div>

    )
}

export { RegistrationForm };