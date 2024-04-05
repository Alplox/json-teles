# ¿Por qué dejar JSON en otro repositorio?
Evitar que muera todo el repositorio en caso de querer eliminar alguna señal.

[[Repositorio original (RIP)]](https://github.com/Alplox/tele)

# Guía rápida estructura JSON:

```
    'nombre': {                   (Nombre objeto/canal, no repetir entre señales debe ser único (sin espacios))
        'nombre': 'nombre'        (Nombre del canal a mostrar en botón y barra que dirige a su origen cuando esta activo)

 tipos de enlaces posibles [Recordar utilizar solo enlaces https si se aloja en GitHub y solo 1 tipo por canal/señal] 

        'iframe_url': 'url'        (contenido que va dentro de un iframe (un embed directo))
        'm3u8_url': 'url'          (para enlaces ".m3u8", no listas ".m3u". Solo canales individuales)
        'yt_id': 'url'             (ID referente a un canal de Youtube [https://www.youtube.com/channel/"yt_id"]. NO REQUIERE 'fuente' DEBIDO A REDUNDANCIA`y debe ser CHANNEL ID (UC...) no YOUTUBE HANDLE de canal (@nombre), herramienta https://commentpicker.com/youtube-channel-id.php
        'yt_embed': 'url'          (se usa para 1 video directamente [https://www.youtube.com/watch?v="yt_embed"])
        'yt_playlist': 'url'       (... [https://www.youtube.com/playlist?list="yt_playlist"])

        'fuente': 'url'           ("fuente" es el enlace de origen de la señal, a modo de transparencia y libertad de abandonar la página si solo se quiere continuar con dicha señal, si se extrae una señal ya sea tipo "iframe" o "m3u8" de www.pagina-ejemplo.cl debe de ponerse www.pagina-ejemplo.cl en "fuente". Si no se obtiene señal desde el emisor oficial como tal, se utiliza el sitio del emisor sobre el de terceros (ejemplo: saque canal de una lista IPTV, por lo que pongo el sitio del canal, no la lista IPTV. Ya que eso va en el listado de canales en archivo README))
        'pais': 'nombre país'     (nombre país es en base a ISO 3166, https://flagcdn.com/en/codes.json (Recomendable en minúsculas))
        'alt_icon': 'icono bootstrap'  (este concepto de icono alternativo se usa mayoritariamente para señales que no pertenece a un país en específico tanto como para quizás segmentar por tipo de señal, si es un canal o una radio. No es obligatorio)
    }

```

# Ejemplos:

## Señal yt_id:
No requiere atributo 'fuente' debido a que propio Channel ID tambien es la fuente del video directo
```
"24-horas": {
        "nombre": "24 horas",
        "yt_id": "UCTXNz3gjAypWp3EhlIATEJQ",
        "pais": "cl"
    },

```

## Señal iframe_url:
Requiere atributo 'fuente' ya que sitio de fuente no es exclusivo a solo video
```
 "24-horas-2": {
        "nombre": "24 horas 2",
        "iframe_url": "https://mdstrm.com/live-stream/57d1a22064f5d85712b20dab?jsapi=true&autoplay=true&volume=0",
        "fuente": "https://www.24horas.cl/envivo/",
        "pais": "cl"
    },
```

## Señal m3u8_url:
Requiere atributo 'fuente' ya que sitio de fuente no es exclusivo a solo video
```
"t13-3": {
        "nombre": "T13 3",
        "m3u8_url": "https://redirector.rudo.video/hls-video/10b92cafdf3646cbc1e727f3dc76863621a327fd/t13/t13.smil/playlist.m3u8",
        "fuente": "https://www.t13.cl/en-vivo",
        "pais": "cl"
    },
```

## Señal yt_embed:
Requiere atributo 'fuente' ya que sitio de fuente no es exclusivo a solo video (señal puede acabar), en este caso deja enlace con Channel ID como fuente
```
 "lofi-girl": {
        "nombre": "Lofi Girl",
        "yt_embed": "jfKfPfyJRdk",
        "fuente": "https://www.youtube.com/channel/UCSJ4gkVC6NrvII8umztf0Ow",
        "alt_icon": "<i class='bi bi-music-note-beamed'></i>"
    },
```

## Señal yt_playlist:
Requiere atributo 'fuente' ya que sitio de fuente no es exclusivo a solo video (más de un video), en este caso deja enlace con Channel ID como fuente
```
 "bob-ross": {
        "nombre": "Bob Ross (Todas las Temporadas)",
        "yt_playlist": "PLaLOVNqqD-2HgiA-GZyzcfZN9n-YelhB5",
        "fuente": "https://www.youtube.com/channel/UCxcnsr1R5Ge_fbTu5ajt8DQ"
    },
```

# Este JSON es empleado en los repositorios:

https://github.com/Alplox/teles

https://github.com/Alplox/la-tele
