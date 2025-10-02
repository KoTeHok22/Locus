import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix для иконок маркеров Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Компонент для обработки кликов на карте
function MapClickHandler({ onMapClick }) {
    useMapEvents({
        click: (e) => {
            onMapClick(e.latlng);
        },
    });
    return null;
}

function CreateProjectFormOSM({ onSubmit, onCancel, apiError }) {
    const [name, setName] = useState('');
    const [address, setAddress] = useState('');
    const [placemarkCoords, setPlacemarkCoords] = useState(null);
    const [mapCenter, setMapCenter] = useState([55.751574, 37.573856]);
    const [polygon, setPolygon] = useState(null);
    const [geocodingError, setGeocodingError] = useState('');
    const [isGeocoding, setIsGeocoding] = useState(false);
    const [isGeocoded, setIsGeocoded] = useState(false);

    const handleAddressBlur = async () => {
        if (!address) return;
        setIsGeocoding(true);
        setGeocodingError('');

        try {
            // Используем Nominatim для геокодирования
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`
            );
            const data = await response.json();
            
            if (data.length > 0) {
                const location = data[0];
                const lat = parseFloat(location.lat);
                const lon = parseFloat(location.lon);
                setMapCenter([lat, lon]);
                setPlacemarkCoords([lat, lon]);
                setIsGeocoded(true);
                
                // Создаем небольшой полигон вокруг точки
                const offset = 0.001;
                setPolygon([[
                    [lon - offset, lat - offset],
                    [lon + offset, lat - offset],
                    [lon + offset, lat + offset],
                    [lon - offset, lat + offset],
                    [lon - offset, lat - offset]
                ]]);
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

    const handleMapClick = async (latlng) => {
        const coords = [latlng.lat, latlng.lng];
        setPlacemarkCoords(coords);
        setIsGeocoding(true);
        setGeocodingError('');

        try {
            // Обратное геокодирование
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latlng.lat}&lon=${latlng.lng}`
            );
            const data = await response.json();
            
            if (data.display_name) {
                setAddress(data.display_name);
                setIsGeocoded(true);
                
                // Создаем полигон
                const offset = 0.001;
                setPolygon([[
                    [latlng.lng - offset, latlng.lat - offset],
                    [latlng.lng + offset, latlng.lat - offset],
                    [latlng.lng + offset, latlng.lat + offset],
                    [latlng.lng - offset, latlng.lat + offset],
                    [latlng.lng - offset, latlng.lat - offset]
                ]]);
            } else {
                setGeocodingError('Не удалось определить адрес.');
            }
        } catch (error) {
            setGeocodingError('Ошибка обратного геокодирования.');
        } finally {
            setIsGeocoding(false);
        }
    };

    const handleFormSubmit = (e) => {
        e.preventDefault();
        if (!placemarkCoords) {
            setGeocodingError('Выберите местоположение на карте.');
            return;
        }
        
        const projectData = {
            name,
            address,
            latitude: placemarkCoords[0],
            longitude: placemarkCoords[1],
            polygon: polygon ? { 
                type: 'Feature', 
                geometry: { 
                    type: 'Polygon', 
                    coordinates: polygon 
                } 
            } : null
        };
        
        onSubmit(projectData);
    };

    return (
        <form onSubmit={handleFormSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700">Название проекта *</label>
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700">Адрес *</label>
                <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    onBlur={handleAddressBlur}
                    required
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
                    placeholder="Введите адрес и нажмите Tab"
                />
                {isGeocoding && <p className="mt-1 text-xs text-blue-600">Поиск адреса...</p>}
                {geocodingError && <p className="mt-1 text-xs text-red-600">{geocodingError}</p>}
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Карта (кликните для указания точного расположения)
                </label>
                <div style={{ height: '300px', width: '100%' }} className="rounded-lg overflow-hidden">
                    <MapContainer
                        center={mapCenter}
                        zoom={15}
                        style={{ height: '100%', width: '100%' }}
                    >
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <MapClickHandler onMapClick={handleMapClick} />
                        {placemarkCoords && <Marker position={placemarkCoords} />}
                    </MapContainer>
                </div>
            </div>

            {apiError && (
                <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                    {apiError}
                </div>
            )}

            <div className="flex gap-3 pt-4">
                <button
                    type="button"
                    onClick={onCancel}
                    className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50"
                >
                    Отмена
                </button>
                <button
                    type="submit"
                    disabled={!isGeocoded}
                    className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                    Создать проект
                </button>
            </div>
        </form>
    );
}

export default CreateProjectFormOSM;
