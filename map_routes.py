
from flask import Blueprint, jsonify
from models import Project
from auth import token_required
from analytics_routes import calculate_project_risk

map_bp = Blueprint('map_bp', __name__)

@map_bp.route('/api/map/projects_status', methods=['GET'])
@token_required
def get_projects_status_map():
    """
    Возвращает GeoJSON со статусами проектов для отображения на карте.
    """
    projects = Project.query.filter(Project.polygon != None).all()
    features = []

    for project in projects:
        risk_data = calculate_project_risk(project.id)
        
        features.append({
            "type": "Feature",
            "geometry": project.polygon,
            "properties": {
                "project_id": project.id,
                "name": project.name,
                "address": project.address,
                "risk_level": risk_data['risk_level'],
                "risk_score": risk_data['score']
            }
        })

    geojson_response = {
        "type": "FeatureCollection",
        "features": features
    }

    return jsonify(geojson_response), 200
