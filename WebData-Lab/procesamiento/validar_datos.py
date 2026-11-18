import pandas as pd

def resumen_calidad(df: pd.DataFrame) -> dict:
    return {"filas": int(len(df)), "columnas": int(len(df.columns)),
            "duplicados": int(df.duplicated().sum()),
            "nulos_por_columna": df.isna().sum().to_dict()}
