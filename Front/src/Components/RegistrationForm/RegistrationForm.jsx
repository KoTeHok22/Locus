import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
        <div className="min-h-screen absolute flex items-center justify-center p-4 w-full">
            <div className='back'></div>
            <div className="hidden md:flex bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden w-full max-w-4xl relative z-10">
                <div className="w-2/5 bg-gradient-to-br from-blue-600 to-blue-800 p-8 text-white">
                    <div className="flex items-center mb-6">
                        <img src={logo} alt="Locus Logo" className='w-12 h-12 bg-blue-600 rounded-lg p-1' />
                        <h1 className="text-2xl font-bold ml-4">Locus</h1>
                    </div>
                    <div className="mt-12">
                        <h2 className="text-xl font-semibold mb-4">Присоединяйтесь к Locus</h2>
                        <p className="text-blue-100 text-sm leading-relaxed">Платформа для эффективного управления и контроля в строительстве.</p>
                    </div>
                </div>

                <div className="w-3/5 p-10">
                    <div className="text-center mb-8">
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Создать аккаунт</h2>
                        <p className="text-gray-600">Заполните информацию для регистрации</p>
                    </div>

                    {error && (
                        <div className="mb-6 p-3 bg-red-100 text-red-700 rounded-lg text-sm">{error}</div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Имя*</label>
                                <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="Иван" required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Фамилия*</label>
                                <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="Иванов" required />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Email*</label>
                            <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="email@example.com" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Пароль*</label>
                            <div className='relative'>
                                <input type={showPassword ? "text" : "password"} name="password" value={formData.password} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="Не менее 8 символов" required />
                                <button type='button' onClick={() => setShowPassword(!showPassword)} className='absolute inset-y-0 right-0 px-4 flex items-center text-gray-500'>
                                <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Подтверждение пароля*</label>
                            <div className='relative'>
                            <input type={showCheckPass ? "text" : "password"} name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="Повторите пароль" required />
                            <button type='button' onClick={() => setShowCheckPass(!showCheckPass)} className='absolute inset-y-0 right-0 px-4 flex items-center text-gray-500'>
                            <i className={`fas ${showCheckPass ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                            </button>
                            </div>
                            
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Ваша роль*</label>
                            <select name="role" value={formData.role} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white">
                                <option value="" disabled>-- Выберите роль --</option>
                                <option value="client">Заказчик</option>
                                <option value="foreman">Прораб</option>
                                <option value="inspector">Инспектор</option>
                            </select>
                        </div>
                        <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50">
                            {loading ? 'Регистрация...' : 'Создать аккаунт'}
                        </button>
                    </form>
                    <p className='mt-4 text-sm text-gray-600 text-center'>Уже есть аккаунт? <Link to="/login" className='text-blue-600 hover:text-blue-800 font-medium'>Войти</Link></p>
                </div>
            </div>
        </div>
    );
}

export { RegistrationForm };