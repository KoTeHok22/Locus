import React, { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Polygon, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const polygonOptions = {
    active: {
        fillColor: '#10B981',
        color: '#059669',
        weight: 2,
        fillOpacity: 0.35,
    },
    issue: {
        fillColor: '#EF4444',
        color: '#DC2626',
        weight: 2,
        fillOpacity: 0.35,
    },
    default: {
        fillColor: '#6B7280',
        color: '#4B5563',
        weight: 2,
        fillOpacity: 0.35,
    }
};

const MapObject = ({ project }) => {
    const getPopupContent = () => (
        <div style={{ fontFamily: 'sans-serif', fontSize: '14px', minWidth: '200px' }}>
            <h3 style={{ fontWeight: 600, fontSize: '16px', margin: '0 0 8px' }}>{project.name}</h3>
            <p style={{ fontSize: '12px', color: '#6B7280', margin: '0 0 12px' }}>{project.address}</p>
            <div style={{ display: 'flex', gap: '16px', borderTop: '1px solid #eee', paddingTop: '10px' }}>
                <div>
                    <div style={{ fontSize: '12px', color: '#6B7280' }}>Задачи</div>
                    <div style={{ fontWeight: 600 }}>{project.tasks_count || 0}</div>
                </div>
                <div>
                    <div style={{ fontSize: '12px', color: '#6B7280' }}>Нарушения</div>
                    <div style={{ fontWeight: 600, color: project.issues_count > 0 ? '#EF4444' : '#10B981' }}>
                        {project.issues_count || 0}
                    </div>
                </div>
            </div>
        </div>
    );

    if (project.polygon?.geometry?.coordinates) {
        const positions = project.polygon.geometry.coordinates[0].map(coord => [coord[1], coord[0]]);
        
        const options = project.issues_count > 0
            ? polygonOptions.issue
            : (project.status === 'active' ? polygonOptions.active : polygonOptions.default);

        return (
            <Polygon positions={positions} pathOptions={options}>
                <Popup>{getPopupContent()}</Popup>
            </Polygon>
        );
    }

    if (project.latitude && project.longitude) {
        return (
            <Marker position={[project.latitude, project.longitude]}>
                <Popup>{getPopupContent()}</Popup>
            </Marker>
        );
    }

    return null;
};

const AutoBounds = ({ projects }) => {
    const map = useMap();

    useEffect(() => {
        if (!projects || projects.length === 0) return;

        const bounds = [];

        projects.forEach(project => {
            if (project.polygon?.geometry?.coordinates) {
                project.polygon.geometry.coordinates[0].forEach(coord => {
                    bounds.push([coord[1], coord[0]]);
                });
            } else if (project.latitude && project.longitude) {
                bounds.push([project.latitude, project.longitude]);
            }
        });

        if (bounds.length > 0) {
            map.fitBounds(bounds, { padding: [50, 50] });
        }
    }, [projects, map]);

    return null;
};

const OSMMap = ({ projects }) => {
    const defaultCenter = [55.75, 37.61];
    const defaultZoom = 10;

    const initialCenter = useMemo(() => {
        if (!projects || projects.length === 0) return defaultCenter;

        const firstProject = projects[0];
        if (firstProject.latitude && firstProject.longitude) {
            return [firstProject.latitude, firstProject.longitude];
        }
        if (firstProject.polygon?.geometry?.coordinates) {
            const coords = firstProject.polygon.geometry.coordinates[0][0];
            return [coords[1], coords[0]];
        }
        return defaultCenter;
    }, [projects]);

    if (!projects || projects.length === 0) {
        return (
            <div className="flex items-center justify-center h-full bg-slate-100 text-gray-500">
                Нет данных для отображения на карте
            </div>
        );
    }

    return (
        <MapContainer
            center={initialCenter}
            zoom={defaultZoom}
            style={{ width: '100%', height: '100%' }}
            scrollWheelZoom={true}
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {projects.map(project => (
                <MapObject key={project.id} project={project} />
            ))}
            <AutoBounds projects={projects} />
        </MapContainer>
    );
};

export { OSMMap };
