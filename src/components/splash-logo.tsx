/** Usa os estilos da abertura definidos no index.html, para não haver salto na transição. */
export function SplashLogo() {
  return (
    <div role="status" aria-label="A carregar" className="splash">
      <img src="/splash-icone.png" alt="" />
    </div>
  );
}
