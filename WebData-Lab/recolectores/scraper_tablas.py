import pandas as pd
from .scraper_basico import descargar_html
from bs4 import BeautifulSoup

def extraer_tablas(url: str, timeout: int = 20) -> list[pd.DataFrame]:
    html = descargar_html(url, timeout=timeout)
    return pd.read_html(html)
