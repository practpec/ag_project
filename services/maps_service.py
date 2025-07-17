import requests
import json
from geopy.distance import geodesic
import time

class OSMService:
    def __init__(self):
        self.osrm_base_url = "http://router.project-osrm.org"
        
    def obtener_rutas_completas_optimizado(self, origen, destinos):
        rutas_data = []
        
        for i, destino in enumerate(destinos):
            rutas_destino = self._obtener_rutas_multiples_destino(origen, destino, i)
            
            rutas_data.append({
                'indice': i,
                'destino': destino,
                'rutas': rutas_destino
            })
            
            time.sleep(0.3)
        
        return rutas_data
    
    def _obtener_rutas_multiples_destino(self, origen, destino, index):
        rutas = []
        
        try:
            ruta_principal = self._obtener_ruta_simple(origen, destino)
            if ruta_principal:
                ruta_principal['tipo'] = 'Ruta 1'
                ruta_principal['descripcion'] = 'Ruta hacia el destino'
                rutas.append(ruta_principal)

            distancia_km = self._calcular_distancia_directa(origen, destino)
            
            if distancia_km > 10:
                ruta_norte = self._obtener_ruta_variante(origen, destino, 'norte')
                if ruta_norte and not self._son_rutas_similares(ruta_principal, ruta_norte):
                    ruta_norte['tipo'] = 'Ruta 2'
                    ruta_norte['descripcion'] = 'Ruta hacia el destino'
                    rutas.append(ruta_norte)

                if distancia_km > 30:
                    ruta_sur = self._obtener_ruta_variante(origen, destino, 'sur')
                    if ruta_sur and not self._es_ruta_similar_a_lista(ruta_sur, rutas):
                        ruta_sur['tipo'] = 'Ruta 3'
                        ruta_sur['descripcion'] = 'Ruta hacia el destino'
                        rutas.append(ruta_sur)

        except Exception as e:
            print(f"Error obteniendo rutas para destino {index + 1}: {e}")
        
        return rutas
    
    def _obtener_ruta_simple(self, origen, destino):
        try:
            origen_str = f"{origen['lng']},{origen['lat']}"
            destino_str = f"{destino['lng']},{destino['lat']}"
            
            url = f"{self.osrm_base_url}/route/v1/driving/{origen_str};{destino_str}"
            params = {
                'overview': 'simplified',
                'geometries': 'geojson'
            }
            
            response = requests.get(url, params=params, timeout=8)
            
            if response.status_code != 200:
                return self._calcular_ruta_directa(origen, destino)
            
            data = response.json()
            
            if 'routes' not in data or len(data['routes']) == 0:
                return self._calcular_ruta_directa(origen, destino)
            
            route = data['routes'][0]
            
            return {
                'distancia': {
                    'text': f"{route['distance']/1000:.1f} km",
                    'value': route['distance']
                },
                'puntos_ruta': self._extraer_puntos_geojson(route['geometry'])
            }
            
        except Exception as e:
            return self._calcular_ruta_directa(origen, destino)
    
    def _obtener_ruta_variante(self, origen, destino, direccion):
        try:
            mid_lat = (origen['lat'] + destino['lat']) / 2
            mid_lng = (origen['lng'] + destino['lng']) / 2
            
            offset = 0.01 if direccion == 'norte' else -0.01
            waypoint = {
                'lat': mid_lat + offset,
                'lng': mid_lng
            }

            ruta1 = self._obtener_ruta_simple(origen, waypoint)
            ruta2 = self._obtener_ruta_simple(waypoint, destino)

            if ruta1 and ruta2:
                return self._combinar_rutas(ruta1, ruta2)
                
        except Exception:
            pass
        
        return None
    
    def _combinar_rutas(self, ruta1, ruta2):
        return {
            'distancia': {
                'text': f"{(ruta1['distancia']['value'] + ruta2['distancia']['value'])/1000:.1f} km",
                'value': ruta1['distancia']['value'] + ruta2['distancia']['value']
            },
            'puntos_ruta': ruta1['puntos_ruta'] + ruta2['puntos_ruta']
        }
    
    def _calcular_ruta_directa(self, origen, destino):
        distancia_km = geodesic(
            (origen['lat'], origen['lng']),
            (destino['lat'], destino['lng'])
        ).kilometers
        
        return {
            'distancia': {
                'text': f"{distancia_km:.1f} km",
                'value': distancia_km * 1000
            },
            'puntos_ruta': [
                {'lat': origen['lat'], 'lng': origen['lng']},
                {'lat': destino['lat'], 'lng': destino['lng']}
            ]
        }
    
    def _extraer_puntos_geojson(self, geometry):
        if geometry['type'] == 'LineString':
            puntos = []
            coords = geometry['coordinates']
            step = max(1, len(coords) // 20)
            
            for i in range(0, len(coords), step):
                coord = coords[i]
                puntos.append({
                    'lat': coord[1],
                    'lng': coord[0]
                })
            
            if len(coords) > 0 and coords[-1] != coords[step * (len(coords) // step - 1)]:
                coord = coords[-1]
                puntos.append({
                    'lat': coord[1],
                    'lng': coord[0]
                })
            
            return puntos
        return []
    
    def _calcular_distancia_directa(self, origen, destino):
        return geodesic(
            (origen['lat'], origen['lng']),
            (destino['lat'], destino['lng'])
        ).kilometers
    
    def _son_rutas_similares(self, ruta1, ruta2, threshold=0.15):
        if not ruta1 or not ruta2:
            return False
        
        diff = abs(ruta1['distancia']['value'] - ruta2['distancia']['value']) / ruta1['distancia']['value']
        return diff < threshold
    
    def _es_ruta_similar_a_lista(self, nueva_ruta, rutas_existentes, threshold=0.15):
        return any(self._son_rutas_similares(nueva_ruta, ruta, threshold) for ruta in rutas_existentes)