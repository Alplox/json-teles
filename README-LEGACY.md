# Formato Legacy (canales.json)

> **Nota:** Este archivo documenta el formato original del repositorio (El cual ya no se actualiza y SERA BORRADO PRONTO). El formato actual es `channels.json` (v2). Usa `node scripts/migrate-to-v2.js` para convertir.

## Estructura

```json
{
  "noticiero-generico-id": {
    "nombre": "noticiero genérico",
    "logo": "https://logo.png",
    "señales": {
      "iframe_url": [
        "https://...",
        "https://..."
      ],
      "m3u8_url": [
        "https://....m3u8"
      ],
      "yt_id": "UC...",
      "yt_embed": "",
      "yt_playlist": "",
      "twitch_id": "noticiero"
    },
    "sitio_oficial": "https://www.sitio-noticiero.com/envivo/",
    "país": "cl",
    "categoría": "news"
  }
}
```

## Campos

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `nombre` | string | Nombre del canal |
| `logo` | string | URL del logo |
| `señales` | object | URLs de las señales |
| `señales.iframe_url` | array | Embeds o sitios con reproductores |
| `señales.m3u8_url` | array | Enlaces HLS (.m3u8) |
| `señales.yt_id` | string | ID del canal de YouTube |
| `señales.yt_embed` | string | URL de YouTube embebida |
| `señales.yt_playlist` | string | ID de playlist de YouTube |
| `señales.twitch_id` | string | ID de canal de Twitch |
| `sitio_oficial` | string | URL del sitio oficial |
| `país` | string | Código ISO 3166 (minúscula) |
| `categoría` | string | Categoría (compatible con iptv-org) |

## Categorías

`news`, `general`, `music`, `sports`, `kids`, `outdoor`, `legislative`, `religious`, `entertainment`, `education`, `culture`, `animation`, `auto`, `business`, `classic`, `lifestyle`, `relax`, `science`, `weather`

