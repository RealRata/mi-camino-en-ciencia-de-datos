import pandas as pd

def limpiar_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    limpio = df.copy()
    limpio.columns = [str(c).strip().lower().replace(" ", "_") for c in limpio.columns]
    for columna in limpio.select_dtypes(include=["object"]).columns:
        limpio[columna] = limpio[columna].map(
            lambda x: " ".join(x.split()) if isinstance(x, str) else x
        )
    return limpio.drop_duplicates().reset_index(drop=True)
