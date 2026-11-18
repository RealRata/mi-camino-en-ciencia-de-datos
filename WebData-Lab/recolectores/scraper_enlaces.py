from .scraper_basico import descargar_html, extraer_pagina

def extraer_enlaces(url: str) -> list[dict]:
    return extraer_pagina(url, descargar_html(url))["enlaces"]
