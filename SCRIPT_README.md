# Scripts del proyecto

## Descripción

Este proyecto usa scripts Node.js para construir, validar y mantener el directorio de canales IPTV.

### Scripts principales (core/)

| Script                           | Comando           | Propósito                                                                                                         |
| -------------------------------- | ----------------- | ----------------------------------------------------------------------------------------------------------------- |
| `scripts/core/build-channels.js` | `npm run build`   | Compila todos los `countries/*.json` en `channels.json`, valida unicidad de IDs y auto-ejecuta `validate-json.js` |
| `scripts/core/generate-m3u.js`   | `npm run convert` | Genera `channels.m3u` y `m3u-playlists/*.m3u` desde `channels.json`, filtrando señales `type: "m3u8"`             |
| `scripts/core/watch.js`          | `npm run watch`   | Watcher local que reconstruye `channels.json` al detectar cambios en `countries/`                                 |

### Scripts de validación (validation/)

| Script                                            | Comando                                      | Propósito                                                                                  |
| ------------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `scripts/validation/validate-json.js`             | `npm run validate`                           | Valida la estructura de `channels.json` contra esquema Ajv — (CI)                          |
| `scripts/validation/validate-country.js`          | `npm run validate:country`                   | Valida la estructura de cada `countries/*.json` contra esquema Ajv — (CI)                  |
| `scripts/validation/check-youtube-livestreams.js` | `npm run check-youtube`                      | Verifica si los canales de YouTube están transmitiendo en vivo (usa yt-dlp + HTML parsing) |
|                                                   | `npm run check-youtube -- --dry-run`         | Vista previa sin modificar archivos                                                        |
|                                                   | `npm run check-youtube -- --force`           | Ignora el umbral de salto (revisa todos aunque se hayan revisado hace poco)                |
|                                                   | `npm run check-youtube -- --channel <id>`    | Revisa un solo canal específico                                                            |
|                                                   | `npm run check-youtube -- --from <N>`        | Procesa desde el índice N (0-based)                                                        |
|                                                   | `npm run check-youtube -- --to <N>`          | Procesa hasta el índice N (inclusive)                                                      |
|                                                   | `npm run check-youtube -- --limit <N>`       | Máximo de canales a revisar                                                                |
| `scripts/validation/check-m3u8-signals.js`        | `npm run check-m3u8`                         | Verifica si las señales M3U8 responden con HLS válido. No modifica archivos                |
|                                                   | `npm run check-m3u8 -- --update`             | Mueve las señales muertas a `docs/dead-signals/<country>-dead-signals.json`                |
|                                                   | `npm run check-m3u8 -- --update --automatic` | Modo no interactivo (no pregunta)                                                          |
|                                                   | `npm run check-m3u8 -- --restore`            | Revierte: revisa `dead-signals/` y restaura señales que volvieron a funcionar              |
|                                                   | `npm run check-m3u8:restore`                 | Atajo para `--restore --update --automatic`                                                |
|                                                   | `npm run check-m3u8 -- --dry-run`            | Vista previa sin modificar archivos                                                        |
|                                                   | `npm run check-m3u8 -- --country <cc>`       | Valida solo un país (ej: `--country cl`)                                                   |
|                                                   | `npm run check-m3u8 -- --id <channel-id>`    | Valida solo un canal específico                                                            |
|                                                   | `npm run check-m3u8 -- --from <N>`           | Procesa desde el índice N (0-based)                                                        |
|                                                   | `npm run check-m3u8 -- --to <N>`             | Procesa hasta el índice N (inclusive)                                                      |
|                                                   | `npm run check-m3u8 -- --limit <N>`          | Máximo de canales a revisar                                                                |
|                                                   | `npm run check-m3u8 -- --verbose`            | Muestra resultado de cada señal individual                                                 |
| `scripts/validation/test-conversion.js`           | `npm run test`                               | Tests de conversión JSON→M3U                                                               |

### Scripts utilitarios (utils/)

| Script                                    | Comando                   | Propósito                                                                     |
| ----------------------------------------- | ------------------------- | ----------------------------------------------------------------------------- |
| `scripts/utils/cli-args.js`               | —                         | Parser compartido de CLI (`parseArgs`, `applyIndexFilters`)                   |
| `scripts/utils/split-by-country.js`       | `npm run split`           | Divide `channels.json` en archivos individuales por país (`countries/*.json`) |
| `scripts/utils/reorder-country-fields.js` | `npm run reorder`         | Reordena los campos de los canales en `countries/*.json` para consistencia    |
| `scripts/utils/generate-readme-lists.js`  | `npm run generate-readme` | Actualiza las listas del README con los canales actuales                      |

### Flujo de trabajo

```mermaid
countries/*.json          (editados manualmente)
      │
      ▼
npm run build ──────────► scripts/core/build-channels.js
      │                    │
      │                    ├── compila countries/*.json → channels.json
      │                    ├── valida unicidad de IDs
      │                    └── auto-ejecuta scripts/validation/validate-json.js
      │
      ▼
channels.json              (auto-generado, no editar)
      │
      ├── npm run convert ──► scripts/core/generate-m3u.js ──► channels.m3u + m3u-playlists/*.m3u
      │
      └── npm run check-youtube ──► scripts/validation/check-youtube-livestreams.js
      │
      ├── npm run check-m3u8 ──► scripts/validation/check-m3u8-signals.js
      │       │                     │
      │       ├── --update ────────► docs/dead-signals/<cc>-dead-signals.json
      │       └── --restore ───────► countries/<cc>.json (desde dead-signals)
      │
```

**Para agregar un canal:** edita `countries/<cc>.json` y ejecuta `npm run build` para regenerar `channels.json`.

**Para reportar una señal muerta:** crea un issue con la plantilla `[NO LIVE]` o ejecuta `npm run check-m3u8 -- --update` para mover señales muertas automáticamente.

**Para restaurar una señal:** mueve manualmente la entrada desde `docs/dead-signals/<cc>-dead-signals.json` de vuelta a `countries/<cc>.json` y ejecuta `npm run build`.

## Requisitos

- Node.js >= 18.0.0 (usa `fetch` o `https` nativo)
- `yt-dlp` (solo para `check-youtube`)

## Instalación

```bash
npm install
```

## Uso

```bash
# Compilar channels.json desde countries/*.json
npm run build

# Generar playlists M3U
npm run convert

# Validar estructura JSON (CI)
npm run validate

# Validar señales M3U8 (solo lectura)
npm run check-m3u8

# Mover señales muertas a dead-signals
npm run check-m3u8:update

# Vista previa de señales a mover
npm run check-m3u8:dry

# Restaurar señales que volvieron a funcionar (desde dead-signals/)
npm run check-m3u8:restore

# Validar señales YouTube
npm run check-youtube

# CI completa
npm run ci
```

## Categorías disponibles

`animation`, `auto`, `business`, `classic`, `culture`, `entertainment`, `general`, `kids`, `legislative`, `lifestyle`, `music`, `news`, `outdoor`, `relax`, `religious`, `science`, `sports`, `weather`

## Señales M3U8 — Algoritmo de verificación

Cada señal se verifica en 2 pasos:

1. **HTTP fetch**: se hace una petición GET a la URL con timeout de 15s y rotación de User-Agent. Sigue redirecciones (máximo 1 nivel). Respuestas > 64KB se rechazan.
2. **Validación HLS**: se verifica que el cuerpo de la respuesta comience exactamente con `#EXTM3U`.

Si falla, se reintenta 1 vez con 2s de delay antes de declararla muerta.

Al terminar de revisar un canal, se actualiza `channel.last_checked` con la fecha/hora actual ISO.

Las señales muertas se mueven del `signals[]` del canal en `countries/<cc>.json` a `docs/dead-signals/<cc>-dead-signals.json`, preservando la información del canal. El canal original no se elimina — solo se remueve la señal específica.

### Concurrencia

- Máximo 10 señales verificadas en paralelo
- Sin rate limiter por dominio (las señales M3U8 generalmente están en CDNs distintas a los sitios web)
