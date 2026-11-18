from recolectores.scraper_basico import recolectar
from procesamiento.validar_datos import resumen_calidad
import pandas as pd

if __name__ == "__main__":
    datos = recolectar("https://example.com", delay=2)
    df = pd.DataFrame([{"url": datos["url"], "titulo": datos["titulo"]}])
    print(df)
    print(resumen_calidad(df))
