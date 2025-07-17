#!/usr/bin/env python3
"""
Script para ejecutar la aplicación de mapas con OpenStreetMap
¡Sin necesidad de API Keys ni RFC!
"""
import os
import sys

def main():
    print("🗺️  Iniciando aplicación de mapas con OpenStreetMap")
    print("=" * 50)
    print("✅ 100% GRATUITO - Sin API Keys")
    print("✅ Sin RFC requerido")
    print("✅ Rutas reales por carretera")
    print("✅ Basado en OpenStreetMap")
    print("=" * 50)

    # Verificar dependencias
    try:
        import flask
        import folium
        import geopy
        import requests
        print("📦 Todas las dependencias están instaladas")
    except ImportError as e:
        print(f"❌ Falta instalar dependencias: {e}")
        print("📥 Ejecuta: pip install -r requirements_osm.txt")
        sys.exit(1)

    # Importar y ejecutar la aplicación
    try:
        print("🚀 Iniciando servidor...")
        print("🌐 Abre tu navegador en: http://localhost:5000")
        print("⏹️  Presiona Ctrl+C para detener el servidor")
        print("-" * 50)
        
        from main import app
        app.run(debug=True, host='0.0.0.0', port=5000)
        
    except ImportError as e:
        print(f"❌ Error al importar la aplicación: {e}")
        print("📁 Asegúrate de que todos los archivos estén en su lugar")
        sys.exit(1)
    except KeyboardInterrupt:
        print("\n👋 ¡Aplicación detenida correctamente!")
    except Exception as e:
        print(f"❌ Error inesperado: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()