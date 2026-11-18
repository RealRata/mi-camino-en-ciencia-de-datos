import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import json
import pandas as pd
import streamlit as st
from recolectores.scraper_basico import recolectar
from procesamiento.limpieza import limpiar_dataframe
from almacenamiento.exportar_json import guardar_json

st.set_page_config(page_title="WebData Lab", page_icon="🌐", layout="wide")
st.title("🌐 WebData Lab")
st.caption("Recolecta, organiza y exporta información pública de sitios web.")

with st.sidebar:
    st.header("Configuración")
    delay = st.slider("Pausa entre solicitudes (segundos)", 1, 10, 2)
    respect = st.checkbox("Comprobar robots.txt", value=True)
    st.info("Empieza con una sola página. Revisa los términos y la política del sitio.")

url = st.text_input("URL del sitio web", placeholder="https://example.com")
if st.button("Iniciar recolección", type="primary", disabled=not url.strip()):
    try:
        with st.spinner("Consultando el sitio..."):
            result = recolectar(url.strip(), delay=delay, respect_robots=respect)
        st.session_state["resultado"] = result
        st.success("Recolección completada.")
    except Exception as exc:
        st.error(f"No se pudo completar: {exc}")

result = st.session_state.get("resultado")
if result:
    st.subheader("Vista previa")
    st.write("**Título:**", result.get("titulo") or "(sin título)")
    a, b, c = st.columns(3)
    a.metric("Encabezados", len(result["encabezados"]))
    b.metric("Párrafos", len(result["parrafos"]))
    c.metric("Enlaces", len(result["enlaces"]))
    with st.expander("Encabezados"): st.write(result["encabezados"])
    with st.expander("Párrafos"): st.write(result["parrafos"])
    with st.expander("Enlaces"): st.dataframe(pd.DataFrame(result["enlaces"]), use_container_width=True)
    for tabla in result["tablas"]:
        st.markdown(f"**Tabla {tabla['tabla']}**")
        st.dataframe(pd.DataFrame(tabla["filas"]), use_container_width=True)
    registros = ([{"tipo":"encabezado","texto":x,"url":result["url"]} for x in result["encabezados"]]
                 + [{"tipo":"parrafo","texto":x,"url":result["url"]} for x in result["parrafos"]])
    df = limpiar_dataframe(pd.DataFrame(registros))
    st.subheader("Datos organizados")
    st.dataframe(df, use_container_width=True)
    st.download_button("Descargar CSV", df.to_csv(index=False).encode("utf-8-sig"),
                       "webdata.csv", "text/csv")
    st.download_button("Descargar JSON", json.dumps(result, ensure_ascii=False, indent=2),
                       "webdata.json", "application/json")
