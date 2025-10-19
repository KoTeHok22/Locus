import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import authService from '../../authService';
import logo from '../../logo/logo.png';
import '../../index.css';
import '../../App.css'

function RegistrationForm() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
        role: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showCheckPass, setShowCheckPass] = useState(false);

    useEffect(() => {
        if (authService.isAuthenticated()) {
          navigate('/');
        }
    }, [navigate]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!formData.role) {
            setError("Пожалуйста, выберите роль");
            return;
        }
        if (formData.password !== formData.confirmPassword) {
            setError("Пароли не совпадают");
            return;
        }

        setLoading(true);
        try {
            await authService.register(formData);
            navigate('/');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

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
                    <p className="mt-4 text-center text-sm text-blue-100">Присоединяйтесь к Locus</p>
                </div>

                <div className="rounded-b-3xl bg-white/95 backdrop-blur-sm p-6 shadow-2xl">
                    <div className="mb-6 text-center">
                        <h2 className="text-xl font-bold text-gray-900">Создать аккаунт</h2>
                        <p className="mt-1 text-sm text-gray-600">Заполните информацию</p>
                    </div>

                    {error && (
                        <div className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Имя*</label>
                            <input 
                                type="text" 
                                name="firstName" 
                                value={formData.firstName} 
                                onChange={handleChange} 
                                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-100" 
                                placeholder="Иван" 
                                required 
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Фамилия*</label>
                            <input 
                                type="text" 
                                name="lastName" 
                                value={formData.lastName} 
                                onChange={handleChange} 
                                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-100" 
                                placeholder="Иванов" 
                                required 
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Email*</label>
                            <input 
                                type="email" 
                                name="email" 
                                value={formData.email} 
                                onChange={handleChange} 
                                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-100" 
                                placeholder="email@example.com" 
                                required 
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Пароль*</label>
                            <div className='relative'>
                                <input 
                                    type={showPassword ? "text" : "password"} 
                                    name="password" 
                                    value={formData.password} 
                                    onChange={handleChange} 
                                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 pr-12 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-100" 
                                    placeholder="Не менее 8 символов" 
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

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Подтверждение пароля*</label>
                            <div className='relative'>
                                <input 
                                    type={showCheckPass ? "text" : "password"} 
                                    name="confirmPassword" 
                                    value={formData.confirmPassword} 
                                    onChange={handleChange} 
                                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 pr-12 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-100" 
                                    placeholder="Повторите пароль" 
                                    required 
                                />
                                <button 
                                    type='button' 
                                    onClick={() => setShowCheckPass(!showCheckPass)} 
                                    className='absolute inset-y-0 right-0 flex items-center justify-center w-12 text-gray-500 hover:text-gray-700'
                                    aria-label={showCheckPass ? "Скрыть пароль" : "Показать пароль"}
                                >
                                    {showCheckPass ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Ваша роль*</label>
                            <select 
                                name="role" 
                                value={formData.role} 
                                onChange={handleChange} 
                                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                required
                            >
                                <option value="" disabled>-- Выберите роль --</option>
                                <option value="client">Служба строительного контроля (заказчик)</option>
                                <option value="foreman">Прораб</option>
                                <option value="inspector">Инспектор</option>
                            </select>
                        </div>

                        <button 
                            type="submit" 
                            disabled={loading} 
                            className="w-full rounded-xl bg-blue-600 py-3 font-semibold text-white transition-colors hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {loading ? 'Регистрация...' : 'Создать аккаунт'}
                        </button>
                    </form>

                    <p className='mt-6 text-center text-sm text-gray-600'>
                        Уже есть аккаунт?{' '}
                        <Link to="/login" className='font-semibold text-blue-600 hover:text-blue-800'>
                            Войти
                        </Link>
                    </p>
                </div>
            </div>

            {}
            <div className="hidden w-full max-w-5xl overflow-hidden rounded-3xl bg-white/95 backdrop-blur-sm shadow-2xl md:flex relative z-10">
                <div className="w-2/5 bg-gradient-to-br from-blue-600 to-blue-800 p-10 text-white">
                    <div className="flex items-center gap-4">
                        <img src={logo} alt="Locus Logo" className='w-14 h-14 rounded-xl bg-white/10 p-2' />
                        <h1 className="text-3xl font-bold">Locus</h1>
                    </div>
                    <div className="mt-16">
                        <h2 className="text-2xl font-semibold mb-4">Присоединяйтесь к Locus</h2>
                        <p className="text-blue-100 leading-relaxed">
                            Платформа для эффективного управления и контроля в строительстве.
                        </p>
                    </div>
                </div>

                <div className="w-3/5 p-10">
                    <div className="mb-8 text-center">
                        <h2 className="text-3xl font-bold text-gray-900 mb-2">Создать аккаунт</h2>
                        <p className="text-gray-600">Заполните информацию для регистрации</p>
                    </div>

                    {error && (
                        <div className="mb-6 rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Имя*</label>
                                <input 
                                    type="text" 
                                    name="firstName" 
                                    value={formData.firstName} 
                                    onChange={handleChange} 
                                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-100" 
                                    placeholder="Иван" 
                                    required 
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Фамилия*</label>
                                <input 
                                    type="text" 
                                    name="lastName" 
                                    value={formData.lastName} 
                                    onChange={handleChange} 
                                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-100" 
                                    placeholder="Иванов" 
                                    required 
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Email*</label>
                            <input 
                                type="email" 
                                name="email" 
                                value={formData.email} 
                                onChange={handleChange} 
                                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-100" 
                                placeholder="email@example.com" 
                                required 
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Пароль*</label>
                            <div className='relative'>
                                <input 
                                    type={showPassword ? "text" : "password"} 
                                    name="password" 
                                    value={formData.password} 
                                    onChange={handleChange} 
                                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 pr-12 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-100" 
                                    placeholder="Не менее 8 символов" 
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

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Подтверждение пароля*</label>
                            <div className='relative'>
                                <input 
                                    type={showCheckPass ? "text" : "password"} 
                                    name="confirmPassword" 
                                    value={formData.confirmPassword} 
                                    onChange={handleChange} 
                                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 pr-12 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-100" 
                                    placeholder="Повторите пароль" 
                                    required 
                                />
                                <button 
                                    type='button' 
                                    onClick={() => setShowCheckPass(!showCheckPass)} 
                                    className='absolute inset-y-0 right-0 flex items-center justify-center w-12 text-gray-500 hover:text-gray-700'
                                    aria-label={showCheckPass ? "Скрыть пароль" : "Показать пароль"}
                                >
                                    {showCheckPass ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Ваша роль*</label>
                            <select 
                                name="role" 
                                value={formData.role} 
                                onChange={handleChange} 
                                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                required
                            >
                                <option value="" disabled>-- Выберите роль --</option>
                                <option value="client">Служба строительного контроля (заказчик)</option>
                                <option value="foreman">Прораб</option>
                                <option value="inspector">Инспектор</option>
                            </select>
                        </div>

                        <button 
                            type="submit" 
                            disabled={loading} 
                            className="w-full rounded-xl bg-blue-600 py-3 font-semibold text-white transition-colors hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {loading ? 'Регистрация...' : 'Создать аккаунт'}
                        </button>
                    </form>

                    <p className='mt-6 text-center text-sm text-gray-600'>
                        Уже есть аккаунт?{' '}
                        <Link to="/login" className='font-semibold text-blue-600 hover:text-blue-800'>
                            Войти
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

export { RegistrationForm };
