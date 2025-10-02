import React, { useState } from 'react';
import { YMaps, Map, Placemark } from '@pbe/react-yandex-maps';

function CreateProjectForm({ onSubmit, onCancel, apiError }) {
    const [name, setName] = useState('');
    const [address, setAddress] = useState('');
    const [placemarkCoords, setPlacemarkCoords] = useState(null);
    const [mapCenter, setMapCenter] = useState([55.751574, 37.573856]);

    const [polygon, setPolygon] = useState(null);
    const [geocodingError, setGeocodingError] = useState('');
    const [isGeocoding, setIsGeocoding] = useState(false);
    const [isGeocoded, setIsGeocoded] = useState(false);

    const apiKey = import.meta.env.VITE_YANDEX_MAPS_API_KEY;

    const handleAddressBlur = async () => {
        if (!address) return;
        setIsGeocoding(true);
        setGeocodingError('');

        const url = `https://geocode-maps.yandex.ru/1.x/?apikey=${apiKey}&format=json&geocode=${address}&kind=house&results=1`;
        try {
            const response = await fetch(url);
            const data = await response.json();
            if (data.response.GeoObjectCollection.featureMember.length > 0) {
                const geoObject = data.response.GeoObjectCollection.featureMember[0].GeoObject;
                const point = geoObject.Point.pos.split(' ').map(Number).reverse();
                setMapCenter(point);
                setPlacemarkCoords(point);
                setIsGeocoded(true);
                if (geoObject.Polygon && geoObject.Polygon.coordinates) {
                    setPolygon(geoObject.Polygon.coordinates);
                }
            } else {
                setGeocodingError('Адрес не найден.');
                setIsGeocoded(false);
            }
        } catch (error) {
            setGeocodingError('Ошибка геокодирования.');
        } finally {
            setIsGeocoding(false);
        }
    };

    const handleMapClick = async (e) => {
        const coords = e.get('coords');
        setPlacemarkCoords(coords);
        setIsGeocoding(true);
        setGeocodingError('');

        const url = `https://geocode-maps.yandex.ru/1.x/?apikey=${apiKey}&format=json&geocode=${coords[1]},${coords[0]}&kind=house&results=1`;
        try {
            const response = await fetch(url);
            const data = await response.json();
            if (data.response.GeoObjectCollection.featureMember.length > 0) {
                const geoObject = data.response.GeoObjectCollection.featureMember[0].GeoObject;
                const foundAddress = geoObject.metaDataProperty.GeocoderMetaData.text;
                setAddress(foundAddress);
                setIsGeocoded(true);
                if (geoObject.Polygon && geoObject.Polygon.coordinates) {
                    setPolygon(geoObject.Polygon.coordinates);
                }
            } else {
                setAddress('Адрес не найден');
                setIsGeocoded(false);
            }
        } catch (error) {
            setGeocodingError('Ошибка обратного геокодирования.');
        } finally {
            setIsGeocoding(false);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!isGeocoded) {
            setGeocodingError('Координаты не определены. Введите адрес или укажите точку на карте.');
            return;
        }
        onSubmit({
            name,
            address,
            polygon: polygon ? { type: 'Feature', geometry: { type: 'Polygon', coordinates: polygon } } : null
        });
    };

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-[9999]">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-2xl">
                <h2 className="text-2xl font-bold mb-6">Создать новый объект</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">Название объекта</label>
                        <input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} className="shadow appearance-none border rounded w-full py-2 px-3" required />
                    </div>
                    <div>
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="address">Адрес (или укажите на карте)</label>
                        <input id="address" type="text" value={address} onChange={(e) => setAddress(e.target.value)} onBlur={handleAddressBlur} className="shadow appearance-none border rounded w-full py-2 px-3" required />
                    </div>

                    <div className="h-64 w-full rounded-lg overflow-hidden border">
                        <YMaps query={{ apikey: apiKey, lang: 'ru_RU' }}>
                            <Map state={{ center: mapCenter, zoom: 15 }} width="100%" height="100%" onClick={handleMapClick}>
                                {placemarkCoords && <Placemark geometry={placemarkCoords} />}
                            </Map>
                        </YMaps>
                    </div>

                    {geocodingError && <p className="text-red-500 text-xs italic">{geocodingError}</p>}
                    {isGeocoded && !geocodingError && <p className="text-green-500 text-xs italic">Координаты объекта успешно определены.</p>}
                    {apiError && <div className="mt-2 p-3 bg-red-100 text-red-700 text-sm rounded">{apiError}</div>}

                    <div className="flex items-center justify-between mt-6">
                        <button type="submit" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:bg-blue-300" disabled={!isGeocoded || isGeocoding}>
                            {isGeocoding ? 'Определение координат...' : 'Создать'}
                        </button>
                        <button type="button" onClick={onCancel} className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded">Назад</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default CreateProjectForm;