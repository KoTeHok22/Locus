import React, { useState } from 'react';

function CreateProjectForm({ onSubmit, onCancel, apiError }) {
    const [name, setName] = useState('');
    const [address, setAddress] = useState('');
    const [polygon, setPolygon] = useState(null);
    const [geocodingError, setGeocodingError] = useState('');
    const [isGeocoding, setIsGeocoding] = useState(false);
    const [isGeocoded, setIsGeocoded] = useState(false);

    const handleAddressBlur = async () => {
        if (!address) return;

        setIsGeocoding(true);
        setIsGeocoded(false);
        setGeocodingError('');
        setPolygon(null);

        const apiKey = import.meta.env.VITE_YANDEX_MAPS_API_KEY;
        if (!apiKey) {
            setGeocodingError('API ключ для Яндекс.Карт не найден.');
            setIsGeocoding(false);
            return;
        }
        const url = `https://geocode-maps.yandex.ru/1.x/?apikey=${apiKey}&format=json&geocode=${address}&kind=house&results=1`;

        try {
            const response = await fetch(url);
            const data = await response.json();
            
            if (data.response.GeoObjectCollection.featureMember.length === 0) {
                setGeocodingError('Адрес не найден. Пожалуйста, проверьте адрес.');
                return;
            }

            setIsGeocoded(true);
            const geoObject = data.response.GeoObjectCollection.featureMember[0].GeoObject;

            if (geoObject.Polygon && geoObject.Polygon.coordinates) {
                console.log('Найден точный полигон в ответе геокодера.');
                setPolygon(geoObject.Polygon.coordinates);
            } else {
                console.log('Точный полигон не найден, будет сохранена только центральная точка.');
                setPolygon(null);
            }

        } catch (error) {
            console.error("Geocoding error:", error);
            setGeocodingError('Ошибка при геокодировании адреса.');
        } finally {
            setIsGeocoding(false);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!isGeocoded) {
            setGeocodingError('Координаты не были определены. Проверьте адрес и повторите попытку.');
            return;
        }
        onSubmit({
            name,
            address,
            polygon: polygon ? {
                type: 'Feature',
                geometry: {
                    type: 'Polygon',
                    coordinates: polygon
                }
            } : null
        });
    };

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
                <h2 className="text-2xl font-bold mb-6">Создать новый объект</h2>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">
                            Название объекта
                        </label>
                        <input
                            id="name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            required
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="address">
                            Адрес
                        </label>
                        <input
                            id="address"
                            type="text"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            onBlur={handleAddressBlur}
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            required
                        />
                        {geocodingError && <p className="text-red-500 text-xs italic">{geocodingError}</p>}
                        {isGeocoded && !geocodingError && (
                            <p className="text-green-500 text-xs italic">
                                {polygon ? 'Полигон объекта успешно определен.' : 'Координаты объекта определены (без полигона).'}
                            </p>
                        )}
                    </div>
                    
                    {apiError && (
                        <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 text-sm rounded">
                            {apiError}
                        </div>
                    )}

                    <div className="flex items-center justify-between mt-6">
                        <button
                            type="submit"
                            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:bg-blue-300"
                            disabled={!isGeocoded || isGeocoding}
                        >
                            {isGeocoding ? 'Определение координат...' : 'Создать'}
                        </button>
                        <button
                            type="button"
                            onClick={onCancel}
                            className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                        >
                            Назад
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default CreateProjectForm;