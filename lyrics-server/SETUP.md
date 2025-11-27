# Guía Rápida de Configuración

## Paso 1: Instalar Dependencias

```bash
cd lyrics-server
pip install -r requirements.txt
```

Si tienes `musicxmatch-api-main` en tu Desktop:
```bash
pip install -e C:\Users\Oliver\Desktop\musicxmatch-api-main
```

## Paso 2: Iniciar el Servidor

Ejecuta `start_server.bat` o:
```bash
python server.py
```

El servidor estará disponible en `http://localhost:5000`

## Paso 3: Exponer con Cloudflare Tunnel

En una nueva terminal:
```bash
cloudflared tunnel --url http://localhost:5000
```

Copia la URL que aparece (ej: `https://xxxx-xxxx.trycloudflare.com`)

## Paso 4: Configurar la URL en Spicetify

Tienes dos opciones:

### Opción A: Configuración Automática desde GitHub (Recomendado)

1. Crea un repositorio en GitHub (o usa uno existente)
2. Crea un archivo `tunnel-url.txt` con solo la URL del túnel:
   ```
   https://discretion-scholarships-companion-transport.trycloudflare.com
   ```
3. Obtén la URL raw del archivo (botón "Raw" en GitHub)
4. Edita `Extensions/lyrics-translator.js` y actualiza la constante `GITHUB_TUNNEL_URL`:
   ```javascript
   const GITHUB_TUNNEL_URL = 'https://raw.githubusercontent.com/TU_USUARIO/TU_REPO/main/tunnel-url.txt';
   ```
5. Cada vez que cambies el túnel, solo actualiza el archivo `tunnel-url.txt` en GitHub
6. La extensión actualizará automáticamente la URL cada 5 minutos

### Opción B: Configuración Manual

1. Abre Spotify con Spicetify
2. Abre la consola del navegador (F12)
3. Ejecuta:
```javascript
LyricsTranslator.setServerUrl("https://discretion-scholarships-companion-transport.trycloudflare.com")
```

Reemplaza `https://xxxx-xxxx.trycloudflare.com` con la URL que obtuviste de Cloudflare Tunnel.

## Paso 5: Verificar

En la consola:
```javascript
LyricsTranslator.testServer()  // Debe retornar true
LyricsTranslator.getCurrentTrack()  // Muestra la canción actual
```

## Notas Importantes

- **La URL de Cloudflare Tunnel cambia cada vez que reinicias el túnel.** 
  - Si usas GitHub: solo actualiza el archivo `tunnel-url.txt` en tu repositorio
  - Si usas configuración manual: actualiza con `LyricsTranslator.setServerUrl()` en la consola
- El servidor debe estar corriendo mientras uses Spotify.
- Si el servidor no está disponible, la extensión usará traducción línea por línea como fallback.
- La URL desde GitHub se cachea por 5 minutos para evitar demasiadas peticiones.

## Troubleshooting

### El servidor no inicia
- Verifica que Python esté instalado: `python --version`
- Verifica que las dependencias estén instaladas: `pip list`

### Cloudflare Tunnel no funciona
- Asegúrate de tener `cloudflared` instalado
- Verifica que el servidor esté corriendo en `localhost:5000`

### La extensión no encuentra el servidor
- Verifica la URL con `LyricsTranslator.getServerUrl()`
- Prueba la conexión con `LyricsTranslator.testServer()`
- Asegúrate de que el túnel de Cloudflare esté activo

