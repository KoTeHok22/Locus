import React from 'react';
import { YMaps, Map, Placemark, Polygon, withYMaps } from '@pbe/react-yandex-maps';

const polygonOptions = {
    active: {
        fillColor: '#10B98155',
        strokeColor: '#059669',
        strokeWidth: 2,
    },
    issue: {
        fillColor: '#EF444455',
        strokeColor: '#DC2626',
        strokeWidth: 2,
    },
    default: {
        fillColor: '#6B728055',
        strokeColor: '#4B5563',
        strokeWidth: 2,
    }
};

const MapObject = ({ project }) => {
    console.log('Обработка проекта для карты:', project);
    if (!project.polygon?.geometry?.coordinates) {
        return null;
    }

    const geometry = project.polygon.geometry.coordinates.map(ring =>
        ring.map(point => [point[1], point[0]])
    );

    const options = project.issues_count > 0 
        ? polygonOptions.issue 
        : (project.status === 'active' ? polygonOptions.active : polygonOptions.default);

    const balloonContent = `
        <div style="font-family: sans-serif; font-size: 14px; max-width: 250px;">
            <h3 style="font-weight: 600; font-size: 16px; margin: 0 0 8px;">${project.name}</h3>
            <p style="font-size: 12px; color: #6B7280; margin: 0 0 12px;">${project.address}</p>
            <div style="display: flex; gap: 16px; border-top: 1px solid #eee; padding-top: 10px;">
                <div>
                    <div style="font-size: 12px; color: #6B7280;">Задачи</div>
                    <div style="font-weight: 600;">${project.tasks_count || 0}</div>
                </div>
                <div>
                    <div style="font-size: 12px; color: #6B7280;">Нарушения</div>
                    <div style="font-weight: 600; color: ${project.issues_count > 0 ? '#EF4444' : '#10B981'}">${project.issues_count || 0}</div>
                </div>
            </div>
        </div>
    `;

    return (
        <Polygon
            geometry={geometry}
            properties={{ balloonContent: balloonContent }}
            options={options}
        />
    );
};

const YandexMapInternal = ({ projects }) => {
    if (!projects || projects.length === 0) {
        return (
            <div className="flex items-center justify-center h-full bg-slate-100 text-gray-500">
                Нет данных для отображения на карте
            </div>
        );
    }

    return (
        <Map 
            defaultState={{ center: [55.75, 37.61], zoom: 9 }} 
            width="100%" 
            height="100%"
            modules={["geoObject.addon.balloon"]}
        >
            {projects.map(project => (
                <MapObject key={project.id} project={project} />
            ))}
        </Map>
    );
};

const YandexMap = ({ projects }) => {
    const YandexMapWrapped = withYMaps(YandexMapInternal, true);

    return (
        <YMaps query={{ apikey: import.meta.env.VITE_YANDEX_MAPS_API_KEY, lang: 'ru_RU' }}>
            <YandexMapWrapped projects={projects} />
        </YMaps>
    );
};

export { YandexMap };