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
    critical: {
        fillColor: '#991B1B',
        color: '#7F1D1D',
        weight: 3,
        fillOpacity: 0.45,
    },
    high: {
        fillColor: '#DC2626',
        color: '#B91C1C',
        weight: 3,
        fillOpacity: 0.40,
    },
    medium: {
        fillColor: '#F59E0B',
        color: '#D97706',
        weight: 2,
        fillOpacity: 0.35,
    },
    low: {
        fillColor: '#10B981',
        color: '#059669',
        weight: 2,
        fillOpacity: 0.30,
    },
    default: {
        fillColor: '#6B7280',
        color: '#4B5563',
        weight: 2,
        fillOpacity: 0.25,
    }
};

const MapObject = ({ project }) => {
    const getRiskColor = (level) => {
        switch(level) {
            case 'CRITICAL': return '#991B1B';
            case 'HIGH': return '#DC2626';
            case 'MEDIUM': return '#F59E0B';
            case 'LOW': return '#10B981';
            default: return '#6B7280';
        }
    };

    const getRiskLabel = (level) => {
        switch(level) {
            case 'CRITICAL': return 'Критический';
            case 'HIGH': return 'Высокий';
            case 'MEDIUM': return 'Средний';
            case 'LOW': return 'Низкий';
            default: return 'Неизвестен';
        }
    };

    const getPopupContent = () => (
        <div style={{ fontFamily: 'sans-serif', fontSize: '14px', minWidth: '250px' }}>
            <h3 style={{ fontWeight: 600, fontSize: '16px', margin: '0 0 4px' }}>{project.name}</h3>
            <p style={{ fontSize: '12px', color: '#6B7280', margin: '0 0 12px' }}>{project.address}</p>
            
            <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '11px', color: '#6B7280', marginBottom: '4px' }}>Задачи</div>
                    <div style={{ fontWeight: 600, fontSize: '18px' }}>{project.tasks_count || 0}</div>
                </div>
                <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '11px', color: '#6B7280', marginBottom: '4px' }}>Нарушения</div>
                    <div style={{ fontWeight: 600, fontSize: '18px', color: project.issues_count > 0 ? '#EF4444' : '#10B981' }}>
                        {project.issues_count || 0}
                    </div>
                </div>
            </div>

            {project.risk_level && (
                <div style={{ 
                    marginBottom: '12px', 
                    padding: '8px 12px', 
                    backgroundColor: getRiskColor(project.risk_level) + '15',
                    borderLeft: `3px solid ${getRiskColor(project.risk_level)}`,
                    borderRadius: '4px'
                }}>
                    <div style={{ fontSize: '11px', color: '#6B7280', marginBottom: '2px' }}>Уровень риска</div>
                    <div style={{ 
                        fontWeight: 600, 
                        fontSize: '14px',
                        color: getRiskColor(project.risk_level)
                    }}>
                        {getRiskLabel(project.risk_level)}
                        <span style={{ fontSize: '12px', marginLeft: '6px', opacity: 0.8 }}>
                            ({project.risk_score || 0} баллов)
                        </span>
                    </div>
                </div>
            )}

            <a 
                href={`/projects/${project.id}`} 
                style={{ 
                    display: 'block',
                    width: '100%',
                    padding: '8px 12px',
                    backgroundColor: '#3B82F6',
                    color: 'white',
                    textAlign: 'center',
                    borderRadius: '6px',
                    textDecoration: 'none',
                    fontSize: '13px',
                    fontWeight: 500,
                    marginTop: '8px',
                    transition: 'background-color 0.2s'
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = '#2563EB'}
                onMouseOut={(e) => e.target.style.backgroundColor = '#3B82F6'}
            >
                Подробнее →
            </a>
        </div>
    );

    const coordinates = project.polygon?.coordinates || project.polygon?.geometry?.coordinates;
    
    if (coordinates && coordinates[0]) {
        const positions = coordinates[0].map(coord => [coord[1], coord[0]]);
        
        const getPolygonOptions = () => {
            if (project.risk_level) {
                switch(project.risk_level) {
                    case 'CRITICAL': return polygonOptions.critical;
                    case 'HIGH': return polygonOptions.high;
                    case 'MEDIUM': return polygonOptions.medium;
                    case 'LOW': return polygonOptions.low;
                    default: return polygonOptions.default;
                }
            }
            return project.status === 'active' ? polygonOptions.low : polygonOptions.default;
        };

        return (
            <Polygon positions={positions} pathOptions={getPolygonOptions()}>
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
            const coordinates = project.polygon?.coordinates || project.polygon?.geometry?.coordinates;
            
            if (coordinates && coordinates[0]) {
                coordinates[0].forEach(coord => {
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
        
        const coordinates = firstProject.polygon?.coordinates || firstProject.polygon?.geometry?.coordinates;
        if (coordinates && coordinates[0] && coordinates[0][0]) {
            const coords = coordinates[0][0];
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
