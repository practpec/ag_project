import requests
import json
from geopy.distance import geodesic
import time

class OSMService:
    """Servicio para obtener rutas usando OpenStreetMap y OSRM"""
    
    def __init__(self):
        # Servidor público de OSRM (OpenStreetMap Routing Machine)
        self.osrm_base_url = "http://router.project-osrm.org"
        
    def obtener_ruta(self, origen, destino):
        """
        Obtener ruta entre dos puntos usando OSRM
        """
        try:
            # Formato: lng,lat (OSRM usa longitud,latitud)
            origen_str = f"{origen['lng']},{origen['lat']}"
            destino_str = f"{destino['lng']},{destino['lat']}"
            
            # URL para OSRM
            url = f"{self.osrm_base_url}/route/v1/driving/{origen_str};{destino_str}"
            params = {
                'overview': 'full',
                'geometries': 'geojson',
                'steps': 'true'
            }
            
            response = requests.get(url, params=params, timeout=10)
            
            if response.status_code != 200:
                # Fallback: calcular línea recta
                return self._calcular_ruta_directa(origen, destino)
            
            data = response.json()
            
            if 'routes' not in data or len(data['routes']) == 0:
                return self._calcular_ruta_directa(origen, destino)
            
            route = data['routes'][0]
            
            # Extraer información de la ruta
            ruta_info = {
                'distancia': {
                    'text': f"{route['distance']/1000:.1f} km",
                    'value': route['distance']  # en metros
                },
                'duracion': {
                    'text': f"{route['duration']/60:.0f} min",
                    'value': route['duration']  # en segundos
                },
                'puntos_ruta': self._extraer_puntos_geojson(route['geometry']),
                'pasos': self._extraer_pasos_osrm(route.get('legs', []))
            }
            
            return ruta_info
            
        except Exception as e:
            print(f"Error al obtener ruta OSRM: {e}")
            # Fallback: calcular línea recta
            return self._calcular_ruta_directa(origen, destino)
    
    def obtener_rutas_multiples(self, origen, destinos):
        """
        Obtener rutas desde un origen hacia múltiples destinos
        """
        rutas = []
        
        for i, destino in enumerate(destinos):
            print(f"Calculando ruta {i+1}/{len(destinos)}...")
            ruta = self.obtener_ruta(origen, destino)
            if ruta:
                rutas.append({
                    'indice': i,
                    'destino': destino,
                    'ruta': ruta
                })
            
            # Pequeña pausa para no sobrecargar el servidor
            time.sleep(0.5)
        
        return rutas
    
    def _calcular_ruta_directa(self, origen, destino):
        """
        Calcular ruta en línea recta como fallback
        """
        distancia_km = geodesic(
            (origen['lat'], origen['lng']),
            (destino['lat'], destino['lng'])
        ).kilometers
        
        # Estimar tiempo (50 km/h promedio)
        tiempo_minutos = (distancia_km / 50) * 60
        
        return {
            'distancia': {
                'text': f"{distancia_km:.1f} km",
                'value': distancia_km * 1000
            },
            'duracion': {
                'text': f"{tiempo_minutos:.0f} min",
                'value': tiempo_minutos * 60
            },
            'puntos_ruta': [
                {'lat': origen['lat'], 'lng': origen['lng']},
                {'lat': destino['lat'], 'lng': destino['lng']}
            ],
            'pasos': [{
                'instruccion': f"Dirigirse hacia el destino",
                'distancia': f"{distancia_km:.1f} km",
                'duracion': f"{tiempo_minutos:.0f} min"
            }]
        }
    
    def _extraer_puntos_geojson(self, geometry):
        """
        Extraer puntos de la geometría GeoJSON
        """
        if geometry['type'] == 'LineString':
            puntos = []
            for coord in geometry['coordinates']:
                puntos.append({
                    'lat': coord[1],  # Latitud
                    'lng': coord[0]   # Longitud
                })
            return puntos
        return []
    
    def _extraer_pasos_osrm(self, legs):
        """
        Extraer pasos de navegación de OSRM
        """
        pasos = []
        
        for leg in legs:
            for step in leg.get('steps', []):
                pasos.append({
                    'instruccion': step.get('maneuver', {}).get('instruction', 'Continuar'),
                    'distancia': f"{step.get('distance', 0)/1000:.1f} km",
                    'duracion': f"{step.get('duration', 0)/60:.1f} min"
                })
        
        return pasos
    
    def obtener_rutas_con_nominatim(self, origen, destino):
        """
        Método alternativo usando Nominatim para geocodificación
        """
        try:
            # Usar Nominatim para obtener direcciones más precisas
            nominatim_url = "https://nominatim.openstreetmap.org/reverse"
            
            # Obtener dirección del origen
            params_origen = {
                'lat': origen['lat'],
                'lon': origen['lng'],
                'format': 'json'
            }
            
            response_origen = requests.get(nominatim_url, params=params_origen)
            direccion_origen = "Origen"
            
            if response_origen.status_code == 200:
                data_origen = response_origen.json()
                direccion_origen = data_origen.get('display_name', 'Origen')
            
            # Obtener dirección del destino
            params_destino = {
                'lat': destino['lat'],
                'lon': destino['lng'],
                'format': 'json'
            }
            
            response_destino = requests.get(nominatim_url, params=params_destino)
            direccion_destino = "Destino"
            
            if response_destino.status_code == 200:
                data_destino = response_destino.json()
                direccion_destino = data_destino.get('display_name', 'Destino')
            
            # Obtener ruta normal
            ruta = self.obtener_ruta(origen, destino)
            if ruta:
                ruta['direccion_origen'] = direccion_origen
                ruta['direccion_destino'] = direccion_destino
            
            return ruta
            
        except Exception as e:
            print(f"Error con Nominatim: {e}")
            return self.obtener_ruta(origen, destino)