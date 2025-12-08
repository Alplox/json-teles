---
name: Enviar canal para adaptación al formato JSON
about: Usa este template para solicitar la incorporación de un nuevo canal.
title: "[AÑADIR CANAL JSON]"
labels: Añadir Canal
assignees: ''

---

**Completa todos los campos**, respetando el formato y las normas indicadas.

---

## 🆔 ID del canal

`id-del-canal`
*(minúsculas, sin espacios, usando guiones. Ej: tvn-24h, mega-live, canal-13)*

---

## 📡 Datos del canal

```json
"id-del-canal": {
    "nombre": "",
    "logo": "",
    "señales": {
        "iframe_url": [
            ""
        ],
        "m3u8_url": [
            ""
        ],
        "yt_id": "",
        "yt_embed": "",
        "yt_playlist": "",
        "twitch_id": ""
    },
    "sitio_oficial": "",
    "país": "",
    "categoría": ""
}
```

---

## 📘 Guía para completar los campos

### 🔑 Campos obligatorios

* **id-del-canal**
  ID único del canal, todo minúsculas, espacios reemplazados por `-`.

* **nombre**
  Nombre oficial del canal.

* **logo**
  URL a un logo (PNG, SVG, JPG).

* **señales**

  * **iframe_url**
    Enlaces a páginas con reproductores embebidos o señales que no requieren tokens.
  * **m3u8_url**
    Solo URLs que terminen en `.m3u8`.
  * **yt_id**
    ID del canal de YouTube (no el handle). https://github.com/Alplox/json-teles/tree/main?tab=readme-ov-file#herramientas-obtener-yt_id
  * **yt_embed**
    ID del video YouTube para transmisión en vivo estable.
  * **yt_playlist**
    ID de playlist YouTube.
  * **twitch_id**
    Usuario del canal de Twitch.

* **sitio_oficial**
  URL del sitio oficial del canal.

* **país**
  Código ISO 3166 en minúsculas (ej: `cl`, `mx`, `es`). https://flagcdn.com/en/codes.json

* **categoría**
  Categoría en inglés según IPTV-org (ej: `news`, `general`, `kids`, `music`). https://iptv-org.github.io/api/categories.json

---

## 📝 Notas adicionales (opcional)

Agrega cualquier información relevante sobre el canal, funcionamiento, disponibilidad geográfica, etc.
