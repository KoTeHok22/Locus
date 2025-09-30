import React, { useState } from 'react';

function CreateProjectForm({ onSubmit, onCancel }) {
    const [name, setName] = useState('');
    const [address, setAddress] = useState('');
    const [polygon, setPolygon] = useState(null);
    const [geocodingError, setGeocodingError] = useState('');

    const handleAddressBlur = async () => {
        if (!address) return;

        setGeocodingError('');
        const apiKey = import.meta.env.VITE_YANDEX_MAPS_API_KEY;
        if (!apiKey) {
            setGeocodingError('API ключ для Яндекс.Карт не найден.');
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

            const geoObject = data.response.GeoObjectCollection.featureMember[0].GeoObject;
            let polygonCoordinates;

            if (geoObject.Polygon && geoObject.Polygon.coordinates) {
                console.log('Найден точный полигон в ответе геокодера.');
                polygonCoordinates = geoObject.Polygon.coordinates;
            } else {
                console.log('Точный полигон не найден, создается квадрат-заглушка.');
                const point = geoObject.Point.pos.split(' ').map(Number);
                const [lon, lat] = point;

                const offset = 0.0005;
                polygonCoordinates = [
                    [
                        [lon - offset, lat - offset],
                        [lon + offset, lat - offset],
                        [lon + offset, lat + offset],
                        [lon - offset, lat + offset],
                        [lon - offset, lat - offset]
                    ]
                ];
            }
            setPolygon(polygonCoordinates);

        } catch (error) {
            console.error("Geocoding error:", error);
            setGeocodingError('Ошибка при геокодировании адреса.');
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!polygon) {
            setGeocodingError('Координаты не были определены. Проверьте адрес.');
            return;
        }
        onSubmit({
            name,
            address,
            polygon: {
                type: 'Feature',
                geometry: {
                    type: 'Polygon',
                    coordinates: polygon
                }
            }
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
                        {polygon && !geocodingError && <p className="text-green-500 text-xs italic">Координаты успешно определены.</p>}
                    </div>
                    
                    <div className="flex items-center justify-between mt-6">
                        <button
                            type="submit"
                            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                            disabled={!polygon}
                        >
                            Создать
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