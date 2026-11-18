import pandas as pd

def estadisticas_descriptivas(df: pd.DataFrame) -> pd.DataFrame:
    return df.describe(include="all").transpose()
