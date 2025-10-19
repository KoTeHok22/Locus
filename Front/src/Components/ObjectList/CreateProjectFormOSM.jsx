import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Polygon, Polyline, CircleMarker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function MapClickHandler({ onMapClick, onRightClick }) {
    useMapEvents({
        click: (e) => {
            onMapClick(e.latlng);
        },
        contextmenu: (e) => {
            if (onRightClick) {
                onRightClick(e.latlng);
            }
        }
    });
    return null;
}

function CreateProjectFormOSM({ onSubmit, onCancel, apiError }) {
    const [name, setName] = useState('');
    const [address, setAddress] = useState('');
    const [mapMode, setMapMode] = useState('address');
    const [placemarkCoords, setPlacemarkCoords] = useState(null);
    const [polygonPoints, setPolygonPoints] = useState([]);
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

    const formatAddress = (addressData) => {
        const parts = [];
        
        const city = addressData.city || addressData.town || addressData.village || addressData.municipality;
        if (city) {
            parts.push(`г. ${city}`);
        }
        
        if (addressData.road) {
            parts.push(`${addressData.road}`);
        }
        
        if (addressData.house_number) {
            parts.push(`д.${addressData.house_number}`);
        }
        
        return parts.length > 0 ? parts.join(', ') : null;
    };

    const handleMapClick = async (latlng) => {
        if (mapMode === 'address') {
            setIsGeocoding(true);
            setGeocodingError('');

            try {
                const response = await fetch(
                    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latlng.lat}&lon=${latlng.lng}&addressdetails=1`
                );
                const data = await response.json();
                
                if (data.address) {
                    const formattedAddress = formatAddress(data.address);
                    if (formattedAddress) {
                        setAddress(formattedAddress);
                    } else {
                        setAddress(data.display_name);
                    }
                    setMapCenter([latlng.lat, latlng.lng]);
                    setPlacemarkCoords([latlng.lat, latlng.lng]);
                    setIsGeocoded(true);
                } else {
                    setGeocodingError('Не удалось определить адрес.');
                }
            } catch (error) {
                setGeocodingError('Ошибка обратного геокодирования.');
            } finally {
                setIsGeocoding(false);
            }
        } else {
            if (!isGeocoded) {
                setGeocodingError('Сначала укажите адрес.');
                return;
            }

            const newPoint = [latlng.lat, latlng.lng];
            const updatedPoints = [...polygonPoints, newPoint];
            setPolygonPoints(updatedPoints);
            
            if (updatedPoints.length >= 3) {
                const polygonCoords = updatedPoints.map(p => [p[1], p[0]]);
                polygonCoords.push(polygonCoords[0]);
                setPolygon([[...polygonCoords]]);
            }
        }
    };

    const handleRightClick = (latlng) => {
        if (mapMode !== 'polygon' || polygonPoints.length === 0) return;

        const clickedPoint = [latlng.lat, latlng.lng];
        const threshold = 0.0001;

        const pointIndex = polygonPoints.findIndex(p => 
            Math.abs(p[0] - clickedPoint[0]) < threshold && 
            Math.abs(p[1] - clickedPoint[1]) < threshold
        );

        if (pointIndex !== -1) {
            const updatedPoints = polygonPoints.filter((_, i) => i !== pointIndex);
            setPolygonPoints(updatedPoints);
            
            if (updatedPoints.length >= 3) {
                const polygonCoords = updatedPoints.map(p => [p[1], p[0]]);
                polygonCoords.push(polygonCoords[0]);
                setPolygon([[...polygonCoords]]);
            } else {
                setPolygon(null);
            }
        }
    };

    const handleRemoveLastPoint = () => {
        if (polygonPoints.length === 0) return;
        
        const updatedPoints = polygonPoints.slice(0, -1);
        setPolygonPoints(updatedPoints);
        
        if (updatedPoints.length >= 3) {
            const polygonCoords = updatedPoints.map(p => [p[1], p[0]]);
            polygonCoords.push(polygonCoords[0]);
            setPolygon([[...polygonCoords]]);
        } else {
            setPolygon(null);
        }
    };

    const handleClearPolygon = () => {
        setPolygonPoints([]);
        setPolygon(null);
    };

    const handleFormSubmit = (e) => {
        e.preventDefault();
        
        if (!placemarkCoords) {
            setGeocodingError('Укажите адрес на карте или в поле ввода.');
            return;
        }

        if (polygon && polygonPoints.length >= 3) {
            const centerLat = polygonPoints.reduce((sum, p) => sum + p[0], 0) / polygonPoints.length;
            const centerLng = polygonPoints.reduce((sum, p) => sum + p[1], 0) / polygonPoints.length;
            
            const projectData = {
                name,
                address,
                latitude: centerLat,
                longitude: centerLng,
                polygon: { 
                    type: 'Feature', 
                    geometry: { 
                        type: 'Polygon', 
                        coordinates: polygon 
                    } 
                }
            };
            
            onSubmit(projectData);
        } else {
            const projectData = {
                name,
                address,
                latitude: placemarkCoords[0],
                longitude: placemarkCoords[1],
                polygon: null
            };
            
            onSubmit(projectData);
        }
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Режим работы с картой</label>
                <div className="flex gap-4">
                    <label className="flex items-center">
                        <input
                            type="radio"
                            value="address"
                            checked={mapMode === 'address'}
                            onChange={(e) => setMapMode(e.target.value)}
                            className="mr-2"
                        />
                        <span className="text-sm">Указать адрес</span>
                    </label>
                    <label className="flex items-center">
                        <input
                            type="radio"
                            value="polygon"
                            checked={mapMode === 'polygon'}
                            onChange={(e) => setMapMode(e.target.value)}
                            disabled={!isGeocoded}
                            className="mr-2"
                        />
                        <span className={`text-sm ${!isGeocoded ? 'text-gray-400' : ''}`}>Указать полигон</span>
                    </label>
                </div>
                {!isGeocoded && (
                    <p className="mt-1 text-xs text-gray-500">
                        Сначала укажите адрес, чтобы создать полигон
                    </p>
                )}
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    {mapMode === 'address' 
                        ? 'Карта (кликните на карту для выбора адреса)' 
                        : 'Карта (кликайте для создания полигона, минимум 3 точки)'}
                </label>
                {mapMode === 'polygon' && polygonPoints.length > 0 && (
                    <div className="mb-2 flex gap-2">
                        <button
                            type="button"
                            onClick={handleRemoveLastPoint}
                            className="text-xs px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                        >
                            Удалить последнюю точку
                        </button>
                        <button
                            type="button"
                            onClick={handleClearPolygon}
                            className="text-xs px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                        >
                            Очистить все
                        </button>
                        <span className="text-xs text-gray-600 self-center">
                            Точек: {polygonPoints.length}
                        </span>
                    </div>
                )}
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
                        <MapClickHandler onMapClick={handleMapClick} onRightClick={handleRightClick} />
                        {mapMode === 'address' && placemarkCoords && <Marker position={placemarkCoords} />}
                        {mapMode === 'polygon' && polygonPoints.length > 0 && polygonPoints.map((point, index) => (
                            <CircleMarker
                                key={index}
                                center={point}
                                radius={6}
                                pathOptions={{ 
                                    color: 'blue', 
                                    fillColor: 'blue', 
                                    fillOpacity: 0.6 
                                }}
                            />
                        ))}
                        {mapMode === 'polygon' && polygonPoints.length > 1 && (
                            <Polyline 
                                positions={polygonPoints}
                                pathOptions={{ color: 'blue', weight: 2, dashArray: '5, 5' }}
                            />
                        )}
                        {mapMode === 'polygon' && polygon && polygonPoints.length >= 3 && (
                            <Polygon
                                positions={polygonPoints}
                                pathOptions={{
                                    color: 'blue',
                                    fillColor: 'blue',
                                    fillOpacity: 0.2,
                                    weight: 2
                                }}
                            />
                        )}
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
                    disabled={!isGeocoded || !placemarkCoords}
                    className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                    Создать проект
                </button>
            </div>
        </form>
    );
}

export default CreateProjectFormOSM;
