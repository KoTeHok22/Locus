import '../../index.css'


function RegistrationForm({onSwitchToLogin}){

    const handleSumbit = (e) => {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData);

        try{

            passwordValidation(data);
            onSwitchToLogin();
            e.target.reset();
        
        }catch(error){

            console.error(`Ошибка валидации: ${error}`);
            alert(error.message);
        
        }

        return data;

    }

    function passwordValidation(data){
            
        const pass = data?.pass;
        const passValid = data?.passValid;
        const passwordLength = 6;
        
        if (pass.length < passwordLength) {

            throw new Error(`Пароль должен содержать минимум ${passwordLength} символов`);
            
        }else if (!/[A-Z]/.test(pass)) {

            throw new Error("Пароль должен содержать хотя бы одну заглавную букву");

        }else if (!/[0-9]/.test(pass)) {

            throw new Error("Пароль должен содержать хотя бы одну цифру");

        }else if(pass.toString() !== passValid.toString()){

            throw new Error("Пароли не совпадают");

        }else{
            alert("Вы успешно зарегестрировались");
        }
        
    }

    return(

    <div className="min-h-screen absolute flex items-center justify-center p-4">

      {/* Мобильная версия */}
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md md:hidden">

        {/* Шапка */}
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
            Регистрация в системе
          </p>
        </div>

        {/* Форма регистрации */}
        <form onSubmit={handleSumbit} className="space-y-3">
          {/* Имя и Фамилия */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Имя*
              </label>
              <input
                type="text"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                placeholder="Фамилия"
                required
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email*
            </label>
            <input
              type="email"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              placeholder="email@example.com"
              required
            />
          </div>

          {/* Телефон */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Телефон
            </label>
            <input
              type="tel"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              placeholder="+7 (999) 999-99-99"
            />
          </div>

          {/* Пароль и подтверждение */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Пароль*
            </label>
            <input
                name='pass'
              type="password"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              placeholder="Не менее 8 символов"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Подтверждение пароля*
            </label>
            <input
                name='passValid'
              type="password"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              placeholder="Повторите пароль"
              required
            />
          </div>

          {/* Чекбокс соглашения */}
          <label className="flex items-start space-x-2 text-xs text-gray-600">
            <input
              type="checkbox"
              className="mt-0.5 text-blue-600 rounded focus:ring-blue-500"
              required
            />
            <span>
              Я соглашаюсь с условиями использования и политикой конфиденциальности
            </span>
          </label>

          {/* Кнопка регистрации */}
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors text-sm"
          >
            Зарегестрироваться
          </button>

        </form>

        <p className='mt-4 text-xs text-gray-600 text-center'>Если у вас есть аккаунт: <button className='text-blue-600 hover:text-blue-800 font-medium' onClick={onSwitchToLogin}>Войти</button></p>

        {/* Футер */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            © 2025 Locus. Все права защищены.
          </p>
        </div>
      </div>

      {/* Десктопная версия */}
      <div className="hidden md:flex bg-white rounded-2xl shadow-xl overflow-hidden w-full max-w-4xl">

        {/* Левая часть - информация */}
        <div className="w-2/5 bg-gradient-to-br from-blue-600 to-blue-800 p-8 text-white">
          <div className="flex items-center mb-6">
            <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-2xl">L</span>
            </div>
            <h1 className="text-2xl font-bold ml-4">Locus</h1>
          </div>
          
          <div className="mt-12">
            <h2 className="text-xl font-semibold mb-4">
              Добро пожаловать в Locus
            </h2>
            <p className="text-blue-100 text-sm leading-relaxed">
              Присоединяйтесь к нашей платформе для управления проектами 
              и сотрудничества с командой
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

        {/* Правая часть - форма */}
        <div className="w-3/5 p-10">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Создать аккаунт
            </h2>
            <p className="text-gray-600">
              Заполните информацию для регистрации
            </p>
          </div>

          <form onSubmit={handleSumbit} className="space-y-6">

            {/* Имя и Фамилия */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Имя*
                </label>
                <input
                  type="text"
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  placeholder="Введите фамилию"
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email*
              </label>
              <input
                type="email"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                placeholder="email@example.com"
                required
              />
            </div>

            {/* Телефон */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Телефон
              </label>
              <input
                type="tel"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                placeholder="+7 (999) 999-99-99"
              />
            </div>

            {/* Пароль и подтверждение */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Пароль*
                </label>
                <input
                    name='pass'
                  type="password"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  placeholder="Минимум 8 символов"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Подтверждение*
                </label>
                <input
                    name='passValid'
                  type="password"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  placeholder="Повторите пароль"
                  required
                />
              </div>
            </div>

            {/* Чекбокс соглашения */}
            <label className="flex items-start space-x-3 text-sm text-gray-600">
              <input
                type="checkbox"
                className="mt-0.5 text-blue-600 rounded focus:ring-blue-500"
                required
              />
              <span>
                Я принимаю условия использования и соглашаюсь с политикой конфиденциальности
              </span>
            </label>

            {/* Кнопка регистрации */}
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Создать аккаунт
            </button>


          </form>

          <p className='mt-4 text-xs text-gray-600 text-center'>Если у вас есть аккаунт: <button className='text-blue-600 hover:text-blue-800 font-medium' onClick={onSwitchToLogin}>Войти</button></p>
            
          {/* Футер */}
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