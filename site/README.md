# site/ — sitio de demo técnica de ALAIA

HTML + CSS estáticos, sin build ni dependencias. No es UI de producto (`DEC-0004`): es la home de `docs/design/website-plan.md` (draft) con el copy de `docs/landing.md`.

## Verlo localmente

```powershell
cd site
python -m http.server 8080
```

Abrir `http://127.0.0.1:8080/`. Las rutas usan barra final (`limites/`), así que conviene servirlo por HTTP en vez de abrir el archivo directamente.

## Páginas

- `index.html`: home (secciones 1–9 del plan).
- `limites/index.html`: qué demuestra y qué no, con fuentes y los casos en verificación.
- `llms.txt`: mapa para LLM.

La salida de terminal de la home es real: `npx vitest run --reporter=verbose` en `packages/policy`, commit `5d0a1ab`, 2026-10-01 (ruta local recortada). Si cambian los tests, hay que regenerarla.

## Placeholders TBD pendientes

Se ven en la página como `[TBD: …]`. Los botones con `data-tbd` no tienen `href` hasta que haya URL.

- URL del repositorio (CTA "Ver el repositorio", "Ver los tests", `llms.txt`, `/limites`).
- URL de `docs/judge-quickstart.md` (CTA "Correr la demo local").
- Evento del hackathon (pie de página).
- Licencia (no hay `LICENSE` en el repo).
- Autoría y contacto.
- Captura de un recibo real y su memo en Horizon local, con commit y fecha (sección Recibo).
- Dominio canónico: sin él no hay `<link rel="canonical">`, `og:url`, `og:image`, `robots.txt` ni `sitemap.xml`.
- Sin decidir y por eso fuera del sitio: nombre público final (se usa "ALAIA", como en `landing.md`), `og:locale`, versión en inglés (`/en/`), video o grabación (`/demo`), tipografías web (se usan fuentes del sistema), uso de marca Stellar, analítica (no hay ninguna) y aviso legal de "demo sin fondos reales".
