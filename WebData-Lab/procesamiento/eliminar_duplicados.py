import pandas as pd

def eliminar_duplicados(df: pd.DataFrame, columnas: list[str] | None = None) -> pd.DataFrame:
    return df.drop_duplicates(subset=columnas).reset_index(drop=True)
