# Canales IPTV

El contenido del repositorio es principalmente enfocado a medios audiovisuales que transmiten noticias, pero existen casos que rompen esta regla.

* Siendo lo importante que todo canal debe:
  * Ser de acceso público. (No hay mano pa' peliculas ni "canales premiums")
  * Tener el enlace a su sitio oficial.
  * Utilizar HTTPS. (Para compatibilidad con GitHub Pages)

(Nota: Lista canales JSON se actualiza de forma manual y luego lista M3U genera automaticamente mediante GitHub Actions)

## Formato JSON 🗂️{}

### RAW

* `https://raw.githubusercontent.com/Alplox/json-teles/refs/heads/main/canales.json`

### CDN

* `https://cdn.jsdelivr.net/gh/Alplox/json-teles@refs/heads/main/canales.json`
* `https://cdn.statically.io/gh/Alplox/json-teles/refs/heads/main/canales.json`
* `https://rawcdn.githack.com/Alplox/json-teles/refs/heads/main/canales.json`

## Formato M3U 🗂️#EXTM3U

### RAW

* `https://raw.githubusercontent.com/Alplox/json-teles/refs/heads/main/canales.m3u`

### CDN

* `https://cdn.jsdelivr.net/gh/Alplox/json-teles@refs/heads/main/canales.m3u`
* `https://cdn.statically.io/gh/Alplox/json-teles/refs/heads/main/canales.m3u`
* `https://rawcdn.githack.com/Alplox/json-teles/refs/heads/main/canales.m3u`

## ¿Por qué dejar canales en este repositorio?

Evitar que muera todo el repositorio en caso de querer eliminar alguna señal.

[[Repositorio original (RIP)]](https://github.com/Alplox/tele)

## Convertir JSON a M3U manualmente

[https://alplox.github.io/json-teles/](https://alplox.github.io/json-teles/)

## Canales disponibles junto a su origen

Canales totales disponibles, versión M3U puede contener menos canales.

(clic para expandir)


<details>
<summary>Canales por País 🌐</summary>

<!-- START:POR_PAIS -->
<!-- END:POR_PAIS -->

</details>

<details>
<summary>Canales por Categoría 📻</summary>

<!-- START:POR_CATEGORIA -->
<!-- END:POR_CATEGORIA -->

</details>

## Guía rápida estructura JSON

```jsonc
 "noticiero-generico-id": {
        "nombre": "noticiero genérico",
        "logo": "https://logo.png",
        "señales": {
            "iframe_url": [
                "https://...",
                "https://...",
            ],
            "m3u8_url": [
                "https://....m3u8"
            ],
            "yt_id": "",
            "yt_embed": "",
            "yt_playlist": "",
            "twitch_id": ""
        },
        "sitio_oficial": "https://www.sitio-noticiero.com/envivo/",
        "país": "cl",
        "categoría": "news"
    }
```

| Campo                 | Tipo   | Descripción                                                                                                                                                                                                               |
|-----------------------|--------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| noticiero-generico-id | string | ID único del canal, en minúsculas y con espacios reemplazados por guiones.                                                                                                                                                |
| nombre                | string | Nombre del canal                                                                                                                                                                                                          |
| logo                  | string | URL del logo del canal (PNG, SVG, JPG...)                                                                                                                                                                                 |
| señales               | object | Contiene las URLs de las señales del canal.                                                                                                                                                                               |
| iframe_url            | array  | Enlaces directos a sitios web que contengan reproductores del canal, embeds y/o señales que requieran tokens para reproducirse.                                                                                           |
| m3u8_url              | array  | Destinado a solo enlaces finalizados en ".m3u8" (HLS), no listas ".m3u"                                                                                                                                                   |
| yt_id                 | string | ID referente a un canal de Youtube [https://www.youtube.com/channel/yt_id]. No su Youtube Handle [@nombre]                                                                                                                |
| yt_embed              | string | Para señales conocidas por no reiniciar su transimision (evitando asi el cambio de su URL) tanto como para casos donde un canal contenga multiples señales en directo activas. [https://www.youtube.com/watch?v=yt_embed] |
| yt_playlist           | string | ID Youtube playlists [https://www.youtube.com/playlist?list=yt_playlist]                                                                                                                                                  |
| twitch_id             | string | ID referente a un canal de Twitch [https://www.twitch.tv/twitch_id]                                                                                                                                                       |
| sitio_oficial         | string | Enlace sitio web oficial de canal.                                                                                                                                                                                        |
| país                  | string | Añade en base a ISO 3166, <https://flagcdn.com/en/codes.json>. Se recomiendo escribirlo en minúscula.                                                                                                                       |
| categoría             | string | Categorías en ingles para compatibilidad con <https://iptv-org.github.io/api/categories.json>.                                                                                                                              |

## Herramientas obtener yt_id

- <https://www.streamweasels.com/tools/youtube-channel-id-and-user-id-convertor/>
- <https://commentpicker.com/youtube-channel-id.php>

## Herramientas generales

- <https://viloud.tv/hls-stream-tester/>
- <https://castr.com/hlsplayer/>
- <https://iptv-org.github.io/>

[![Visits Badge](https://badges.strrl.dev/visits/Alplox/json-teles)](https://badges.strrl.dev)
