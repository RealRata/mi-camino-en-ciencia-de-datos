import matplotlib.pyplot as plt
import pandas as pd

def grafica_faltantes(df: pd.DataFrame):
    faltantes = df.isna().sum().sort_values(ascending=False)
    fig, ax = plt.subplots(figsize=(9, 4))
    faltantes.plot(kind="bar", ax=ax)
    ax.set_title("Valores faltantes por columna")
    ax.set_ylabel("Cantidad")
    fig.tight_layout()
    return fig
