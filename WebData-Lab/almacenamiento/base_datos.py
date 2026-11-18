import sqlite3
from pathlib import Path
import pandas as pd

def guardar_sqlite(df: pd.DataFrame, ruta: str = "datos/webdata.db",
                   tabla: str = "registros") -> None:
    Path(ruta).parent.mkdir(parents=True, exist_ok=True)
    with sqlite3.connect(ruta) as conexion:
        df.to_sql(tabla, conexion, if_exists="append", index=False)
