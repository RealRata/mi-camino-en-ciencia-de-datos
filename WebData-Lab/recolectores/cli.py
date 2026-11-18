import argparse
from pathlib import Path
from datetime import datetime
from .scraper_basico import recolectar
from almacenamiento.exportar_json import guardar_json

def main():
    parser = argparse.ArgumentParser(description="Recolector básico de WebData Lab")
    parser.add_argument("url")
    parser.add_argument("--max-pages", type=int, default=1, choices=range(1, 21))
    parser.add_argument("--delay", type=float, default=2)
    args = parser.parse_args()
    resultado = recolectar(args.url, delay=max(args.delay, 1))
    nombre = datetime.now().strftime("%Y%m%d_%H%M%S") + ".json"
    destino = Path("datos/originales") / nombre
    guardar_json(resultado, destino)
    print(f"Datos guardados en: {destino}")

if __name__ == "__main__":
    main()
