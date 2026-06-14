import { useEffect } from "react";

const SUFFIX = "Radiance Laser";

/** Define o título da aba do navegador para a página atual. */
export function usePageTitle(title?: string) {
  useEffect(() => {
    document.title = title ? `${title} | ${SUFFIX}` : `${SUFFIX} | Locação do Laser DEKA DUOGlide em Maringá`;
    return () => {
      document.title = `${SUFFIX} | Locação do Laser DEKA DUOGlide em Maringá`;
    };
  }, [title]);
}
