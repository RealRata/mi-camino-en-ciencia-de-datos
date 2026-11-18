from pathlib import Path
import pandas as pd

def guardar_csv(df: pd.DataFrame, ruta: str | Path) -> Path:
    ruta = Path(ruta)
    ruta.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(ruta, index=False, encoding="utf-8-sig")
    return ruta
