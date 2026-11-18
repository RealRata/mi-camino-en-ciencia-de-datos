from __future__ import annotations
from urllib.parse import urljoin, urldefrag
from urllib.robotparser import RobotFileParser
import time
import requests
from bs4 import BeautifulSoup

DEFAULT_HEADERS = {"User-Agent": "WebDataLab/1.0 (educational data collection; contact: add-your-email)"}

def permitido_por_robots(url: str, user_agent: str = "*", timeout: int = 10) -> bool:
    """Comprueba robots.txt; si no puede consultarse, falla de forma conservadora."""
    from urllib.parse import urlparse
    parsed = urlparse(url)
    robots_url = f"{parsed.scheme}://{parsed.netloc}/robots.txt"
    parser = RobotFileParser()
    parser.set_url(robots_url)
    try:
        response = requests.get(robots_url, headers=DEFAULT_HEADERS, timeout=timeout)
        if response.status_code == 404:
            return True
        response.raise_for_status()
        parser.parse(response.text.splitlines())
        return parser.can_fetch(user_agent, url)
    except requests.RequestException:
        return False

def descargar_html(url: str, timeout: int = 20, user_agent: str | None = None) -> str:
    headers = {"User-Agent": user_agent or DEFAULT_HEADERS["User-Agent"]}
    response = requests.get(url, headers=headers, timeout=timeout)
    response.raise_for_status()
    if "text/html" not in response.headers.get("Content-Type", "").lower():
        raise ValueError("La URL no devolvió contenido HTML.")
    response.encoding = response.apparent_encoding
    return response.text

def extraer_pagina(url: str, html: str) -> dict:
    soup = BeautifulSoup(html, "lxml")
    for tag in soup(["script", "style", "noscript", "svg"]):
        tag.decompose()
    title = soup.title.get_text(" ", strip=True) if soup.title else ""
    headings = [h.get_text(" ", strip=True) for h in soup.find_all(["h1", "h2", "h3"])]
    paragraphs = [p.get_text(" ", strip=True) for p in soup.find_all("p")]
    links = []
    for a in soup.find_all("a", href=True):
        href = urldefrag(urljoin(url, a["href"])).url
        links.append({"texto": a.get_text(" ", strip=True), "url": href})
    tables = []
    for index, table in enumerate(soup.find_all("table"), start=1):
        rows = []
        for tr in table.find_all("tr"):
            cells = [cell.get_text(" ", strip=True) for cell in tr.find_all(["th", "td"])]
            if cells:
                rows.append(cells)
        tables.append({"tabla": index, "filas": rows})
    return {"url": url, "titulo": title, "encabezados": headings,
            "parrafos": paragraphs, "enlaces": links, "tablas": tables}

def recolectar(url: str, timeout: int = 20, delay: float = 2,
               respect_robots: bool = True) -> dict:
    if not url.startswith(("http://", "https://")):
        raise ValueError("La URL debe comenzar con http:// o https://")
    if respect_robots and not permitido_por_robots(url):
        raise PermissionError("robots.txt no permite la consulta o no pudo verificarse.")
    html = descargar_html(url, timeout=timeout)
    result = extraer_pagina(url, html)
    if delay > 0:
        time.sleep(delay)
    return result
