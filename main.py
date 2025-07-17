from flask import Flask, render_template, request
from services.geo_service import generar_mapa, ESTADOS_COORDS

app = Flask(__name__)

@app.route("/", methods=["GET", "POST"])
def index():
    estados = list(ESTADOS_COORDS.keys())
    estado_default = "Chiapas"
    mapa_html = None

    if request.method == "POST":
        estado = request.form.get("estado")
        n_nodos = int(request.form.get("n_nodos"))
        mapa_html = generar_mapa(estado, n_nodos)

    return render_template("map.html", estados=estados, mapa_html=mapa_html)

if __name__ == "__main__":
    app.run(debug=True)
