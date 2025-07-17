from flask import Flask, render_template, request, jsonify, send_from_directory
from services.maps_service import OSMService
from services.geo_service import GeoServiceOSM

app = Flask(__name__)

geo_service = GeoServiceOSM()
osm_service = OSMService()

@app.route('/static/<path:filename>')
def static_files(filename):
    return send_from_directory('templates/static', filename)

@app.route("/")
def index():
    estados = geo_service.get_estados()
    return render_template("index.html", estados=estados)

@app.route("/api/generate-complete-routes", methods=["POST"])
def generate_complete_routes():
    try:
        data = request.get_json()
        estado = data.get('estado', 'Chiapas')
        n_nodos = data.get('n_nodos', 5)
        
        nodos_data = geo_service.generar_nodos_secundarios(estado, n_nodos)
        
        rutas_completas = osm_service.obtener_rutas_completas_optimizado(
            nodos_data['nodo_principal'], 
            nodos_data['nodos_secundarios']
        )
        
        return jsonify({
            'success': True,
            'nodo_principal': nodos_data['nodo_principal'],
            'nodos_secundarios': nodos_data['nodos_secundarios'],
            'rutas_data': rutas_completas
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route("/api/status")
def get_status():
    return jsonify({
        'status': 'online',
        'message': 'Servidor funcionando correctamente'
    })

if __name__ == "__main__":
    app.run(debug=True, host='0.0.0.0', port=5000)