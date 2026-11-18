# WebData Lab

Proyecto modular en Python para recolectar información pública de sitios web, limpiarla, validarla, almacenarla y analizarla.

## Instalación
```bash
python -m venv .venv
# Windows PowerShell:
.venv\Scripts\Activate.ps1
pip install -r WebData-Lab/requirements.txt
```

## Interfaz
Desde la raíz del repositorio:
```bash
streamlit run WebData-Lab/interfaz/app.py
```

## Módulos
- recolectores: extracción HTML, enlaces y tablas.
- procesamiento: limpieza, deduplicación y validación.
- almacenamiento: CSV, JSON y SQLite.
- análisis: estadísticas y visualizaciones.
- interfaz: aplicación Streamlit.

Consulta los términos del sitio y su robots.txt. Respeta pausas, límites de acceso y privacidad; no intentes evadir controles técnicos. Cuando exista una API oficial, prefiérela.
