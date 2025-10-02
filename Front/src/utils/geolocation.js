/**
 * Утилиты для работы с геолокацией пользователя
 */

/**
 * Получить текущую геолокацию пользователя
 * @returns {Promise<{latitude: number, longitude: number, accuracy: number}>}
 */
export const getCurrentGeolocation = () => {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('Геолокация не поддерживается вашим браузером'));
            return;
        }

        const options = {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        };

        navigator.geolocation.getCurrentPosition(
            (position) => {
                resolve({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    accuracy: position.coords.accuracy
                });
            },
            (error) => {
                let errorMessage = 'Не удалось получить геолокацию';
                
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        errorMessage = 'Доступ к геолокации запрещен. Разрешите доступ в настройках браузера.';
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMessage = 'Информация о местоположении недоступна.';
                        break;
                    case error.TIMEOUT:
                        errorMessage = 'Время ожидания геолокации истекло.';
                        break;
                }
                
                reject(new Error(errorMessage));
            },
            options
        );
    });
};

/**
 * Получить геолокацию в формате строки "latitude,longitude"
 * @returns {Promise<string>}
 */
export const getGeolocationString = async () => {
    const { latitude, longitude } = await getCurrentGeolocation();
    return `${latitude},${longitude}`;
};

/**
 * Проверить, доступна ли геолокация
 * @returns {boolean}
 */
export const isGeolocationAvailable = () => {
    return 'geolocation' in navigator;
};

/**
 * Запросить разрешение на доступ к геолокации
 * @returns {Promise<boolean>} true если разрешение получено
 */
export const requestGeolocationPermission = async () => {
    try {
        await getCurrentGeolocation();
        return true;
    } catch (error) {
        return false;
    }
};

/**
 * Рассчитать расстояние между двумя точками (в метрах)
 * @param {number} lat1 
 * @param {number} lon1 
 * @param {number} lat2 
 * @param {number} lon2 
 * @returns {number} расстояние в метрах
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // радиус Земли в метрах
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
};
