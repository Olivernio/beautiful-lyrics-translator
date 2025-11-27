# Servidor de Traducción de Letras

Servidor Flask que proporciona traducciones de letras usando Musixmatch API y googletrans como fallback.

## Instalación

1. **Instalar dependencias de Python:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Instalar musicxmatch-api:**
   
   Si tienes la carpeta `musicxmatch-api-main` en tu Desktop:
   ```bash
   pip install -e ../musicxmatch-api-main
   ```
   
   O desde la ruta completa:
   ```bash
   pip install -e C:\Users\Oliver\Desktop\musicxmatch-api-main
   ```

## Uso

### Iniciar el servidor

**Opción 1: Usando el script de Windows**
```bash
start_server.bat
```

**Opción 2: Manualmente**
```bash
python server.py
```

El servidor se iniciará en `http://localhost:5000`

### Endpoints

#### `GET /ping`
Health check del servidor.

**Respuesta:**
```json
{
  "status": "ok",
  "musixmatch": true,
  "googletrans": true
}
```

#### `GET /search?artist=X&title=Y`
Busca un track en Musixmatch.

**Parámetros:**
- `artist` (requerido): Nombre del artista
- `title` (requerido): Título de la canción

**Respuesta:**
```json
{
  "results": [
    {
      "track_id": "...",
      "track_name": "...",
      "artist_name": "..."
    }
  ]
}
```

#### `GET /lyrics?artist=X&title=Y&lang=es`
Obtiene letras y traducción de una canción.

**Parámetros:**
- `artist` (requerido): Nombre del artista
- `title` (requerido): Título de la canción
- `lang` (opcional): Código de idioma (default: `es`)

**Respuesta:**
```json
{
  "lyrics": "Original lyrics text...",
  "translation": "Texto traducido...",
  "cached": false
}
```

## Configuración de Cloudflare Tunnel

Una vez que el servidor esté corriendo, expónlo usando Cloudflare Tunnel:

```bash
cloudflared tunnel --url http://localhost:5000
```

Esto generará una URL temporal (ej: `https://xxxx-xxxx.trycloudflare.com`). 

**Importante:** Esta URL cambia cada vez que reinicias el túnel. Deberás actualizarla en la extensión de Spicetify.

## Cache

El servidor usa SQLite para cachear traducciones. La base de datos se guarda en `lyrics_cache.db` en la misma carpeta del servidor.

El cache expira después de 30 días (configurable en `CACHE_EXPIRY_DAYS`).

## Troubleshooting

### Error: "musicxmatch-api no disponible"
- Verifica que hayas instalado la librería correctamente
- Asegúrate de que la ruta a `musicxmatch-api-main` sea correcta

### Error: "googletrans no disponible"
- Instala con: `pip install googletrans==4.0.0-rc1`

### El servidor no responde
- Verifica que el puerto 5000 no esté en uso
- Revisa los logs del servidor para errores

### Cloudflare Tunnel no funciona
- Asegúrate de tener `cloudflared` instalado
- Verifica que el servidor esté corriendo en localhost:5000

