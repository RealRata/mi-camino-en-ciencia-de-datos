from urllib.parse import urlparse
from .scraper_basico import recolectar

def recolectar_urls(urls: list[str], max_paginas: int = 5,
                    delay: float = 2) -> list[dict]:
    if not urls:
        return []
    dominio = urlparse(urls[0]).netloc
    resultados = []
    for url in urls[:max_paginas]:
        if urlparse(url).netloc != dominio:
            raise ValueError("Todas las URLs deben pertenecer al mismo dominio.")
        resultados.append(recolectar(url, delay=delay))
    return resultados
