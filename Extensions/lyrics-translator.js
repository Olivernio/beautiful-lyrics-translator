console.log("LyricsTranslator extension loaded (Beautiful Lyrics translator)");

// ==================== CONFIGURACIÓN ====================
const TARGET_LANGUAGE = 'es'; // Idioma de destino fijo (español)
const CACHE_KEY = 'lyrics-translator-cache';
const SERVER_URL_KEY = 'lyrics-translator-server-url';
const GITHUB_URL_KEY = 'lyrics-translator-github-url'; // Cache de URL desde GitHub
const GITHUB_URL_TIMESTAMP_KEY = 'lyrics-translator-github-url-timestamp'; // Timestamp del cache
const TRACK_CACHE_KEY = 'lyrics-translator-track-cache';
const DEBOUNCE_DELAY = 500; // Debounce más agresivo para evitar rate limits
const SERVER_TIMEOUT = 5000; // Timeout para requests al servidor (5 segundos)

// URL del archivo en GitHub que contiene la URL del túnel
// Formato: https://raw.githubusercontent.com/USUARIO/REPO/RAMA/archivo.txt
// El archivo debe contener solo la URL, ej: https://xxxx-xxxx.trycloudflare.com
// CAMBIAR ESTA URL con la URL raw de tu archivo en GitHub
const GITHUB_TUNNEL_URL = 'https://raw.githubusercontent.com/Olivernio/beautiful-lyrics-translator/refs/heads/main/tunnel-url.txt';

// Tiempo de cache para la URL de GitHub (en milisegundos)
// Actualizar cada 5 minutos (300000 ms)
const GITHUB_URL_CACHE_TIME = 5 * 60 * 1000;

// URL por defecto del servidor (Cloudflare Tunnel) - fallback de emergencia
// Solo se usa si GitHub no está configurado o falla
// Puedes dejarlo vacío si siempre usarás GitHub: const DEFAULT_SERVER_URL = '';
const DEFAULT_SERVER_URL = '';

// ==================== SISTEMA DE CACHE ====================
function getCache() {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    return cached ? JSON.parse(cached) : {};
  } catch (e) {
    console.warn('Error reading cache:', e);
    return {};
  }
}

function saveCache(cache) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch (e) {
    console.warn('Error saving cache:', e);
  }
}

function getCachedTranslation(text, lang) {
  const cache = getCache();
  const key = `${text}|${lang}`;
  return cache[key] || null;
}

function saveCachedTranslation(text, lang, translation) {
  const cache = getCache();
  const key = `${text}|${lang}`;
  cache[key] = translation;
  saveCache(cache);
}

// ==================== OBTENER URL DESDE GITHUB ====================
async function fetchServerUrlFromGitHub() {
  if (!GITHUB_TUNNEL_URL) {
    // Si no está configurada la URL de GitHub, no hacer nada
    return null;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 segundos timeout
    
    const response = await fetch(GITHUB_TUNNEL_URL, {
      signal: controller.signal,
      cache: 'no-cache' // Forzar actualización
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`GitHub request failed: ${response.status}`);
    }
    
    const url = (await response.text()).trim();
    
    // Validar que sea una URL válida
    if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
      // Guardar en cache con timestamp
      localStorage.setItem(GITHUB_URL_KEY, url);
      localStorage.setItem(GITHUB_URL_TIMESTAMP_KEY, Date.now().toString());
      console.log('LyricsTranslator: URL obtenida desde GitHub:', url);
      return url;
    } else {
      throw new Error('URL inválida desde GitHub');
    }
  } catch (error) {
    if (error.name !== 'AbortError') {
      console.warn('LyricsTranslator: Error obteniendo URL desde GitHub:', error);
    }
    return null;
  }
}

function getCachedGitHubUrl() {
  try {
    const cachedUrl = localStorage.getItem(GITHUB_URL_KEY);
    const cachedTimestamp = localStorage.getItem(GITHUB_URL_TIMESTAMP_KEY);
    
    if (cachedUrl && cachedTimestamp) {
      const age = Date.now() - parseInt(cachedTimestamp, 10);
      // Si el cache es válido (menos de GITHUB_URL_CACHE_TIME), usarlo
      if (age < GITHUB_URL_CACHE_TIME) {
        return cachedUrl;
      }
    }
  } catch (e) {
    console.warn('LyricsTranslator: Error leyendo cache de GitHub URL:', e);
  }
  return null;
}

async function getServerUrlFromGitHub() {
  // Primero intentar obtener del cache
  const cached = getCachedGitHubUrl();
  if (cached) {
    return cached;
  }
  
  // Si no hay cache válido, obtener desde GitHub
  return await fetchServerUrlFromGitHub();
}

// ==================== CONFIGURACIÓN DEL SERVIDOR ====================
function getServerUrl() {
  // 1. Primero intentar obtener de localStorage (configuración manual desde consola)
  //    Esto tiene prioridad sobre todo
  const stored = localStorage.getItem(SERVER_URL_KEY);
  if (stored) return stored;
  
  // 2. Intentar obtener desde cache de GitHub
  const cachedGitHubUrl = getCachedGitHubUrl();
  if (cachedGitHubUrl) return cachedGitHubUrl;
  
  // 3. Si GitHub está configurado pero aún no hay cache, usar DEFAULT_SERVER_URL temporalmente
  //    hasta que GitHub responda (se actualizará automáticamente cuando GitHub responda)
  //    Si GitHub no está configurado, usar DEFAULT_SERVER_URL como fallback permanente
  return DEFAULT_SERVER_URL || null;
}

// Función para inicializar la obtención de URL desde GitHub
async function initializeServerUrl() {
  // Si GitHub no está configurado, no hacer nada
  if (!GITHUB_TUNNEL_URL) {
    return;
  }
  
  // Obtener URL desde GitHub en background
  // Si hay una URL manual, GitHub se obtendrá pero no se usará hasta que se limpie la manual
  const githubUrl = await getServerUrlFromGitHub();
  if (githubUrl) {
    const hasManualUrl = localStorage.getItem(SERVER_URL_KEY);
    if (hasManualUrl) {
      console.log('LyricsTranslator: URL obtenida desde GitHub:', githubUrl);
      console.log('💡 Hay una URL manual configurada. Usa LyricsTranslator.useGitHub() para usar la URL de GitHub');
    } else {
      console.log('LyricsTranslator: URL del servidor actualizada desde GitHub:', githubUrl);
    }
  } else {
    // Si GitHub falla y hay DEFAULT_SERVER_URL, usarlo como fallback
    if (DEFAULT_SERVER_URL) {
      console.warn('LyricsTranslator: No se pudo obtener URL desde GitHub, usando URL por defecto');
    } else {
      console.warn('LyricsTranslator: No se pudo obtener URL desde GitHub y no hay URL por defecto configurada');
    }
  }
}

// Función para limpiar la URL manual y usar GitHub
function clearManualServerUrl() {
  localStorage.removeItem(SERVER_URL_KEY);
  console.log('LyricsTranslator: URL manual eliminada. Ahora se usará la URL de GitHub.');
  // Forzar actualización desde GitHub
  if (GITHUB_TUNNEL_URL) {
    initializeServerUrl();
  }
}

function setServerUrl(url) {
  if (url) {
    localStorage.setItem(SERVER_URL_KEY, url);
  } else {
    localStorage.removeItem(SERVER_URL_KEY);
  }
}

async function isServerAvailable(serverUrl) {
  if (!serverUrl) return false;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    const response = await fetch(`${serverUrl}/ping`, {
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response.ok;
  } catch (e) {
    return false;
  }
}

// ==================== OBTENER INFORMACIÓN DE LA CANCIÓN ACTUAL ====================
function getCurrentTrackInfo() {
  try {
    // Intentar obtener desde Spicetify
    const player = window.Spicetify?.Player?.data || window.Spicetify?.Platform?.Player?.data;
    if (player && player.track) {
      const track = player.track;
      return {
        artist: track.artists?.map(a => a.name).join(', ') || track.artist?.name || '',
        title: track.name || track.title || '',
        uri: track.uri || ''
      };
    }
    
    // Fallback: intentar desde el DOM
    const titleEl = document.querySelector('[data-testid="entityTitle"]');
    const artistEl = document.querySelector('[data-testid="context-item-info-artist"] a, [data-testid="context-item-info-artist"]');
    
    if (titleEl && artistEl) {
      return {
        artist: artistEl.textContent?.trim() || '',
        title: titleEl.textContent?.trim() || '',
        uri: ''
      };
    }
  } catch (e) {
    console.warn('Error obteniendo info de canción:', e);
  }
  return null;
}

// ==================== OBTENER LETRAS DEL SERVIDOR ====================
async function getLyricsFromServer(artist, title, lang = TARGET_LANGUAGE) {
  const serverUrl = getServerUrl();
  if (!serverUrl) {
    return null;
  }

  // Verificar cache de track
  const trackCache = getTrackCache(artist, title, lang);
  if (trackCache) {
    return trackCache;
  }

  try {
    const url = `${serverUrl}/lyrics?artist=${encodeURIComponent(artist)}&title=${encodeURIComponent(title)}&lang=${lang}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), SERVER_TIMEOUT);
    
    const response = await fetch(url, {
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.translation || data.lyrics) {
      // Guardar en cache de track
      saveTrackCache(artist, title, lang, data);
      return data;
    }
    
    return null;
  } catch (error) {
    if (error.name !== 'AbortError') {
      console.warn('Error obteniendo letras del servidor:', error);
    }
    return null;
  }
}

// ==================== CACHE DE TRACKS ====================
function getTrackCache(artist, title, lang) {
  try {
    const cache = localStorage.getItem(TRACK_CACHE_KEY);
    if (!cache) return null;
    const parsed = JSON.parse(cache);
    const key = `${artist}|${title}|${lang}`;
    return parsed[key] || null;
  } catch (e) {
    return null;
  }
}

function saveTrackCache(artist, title, lang, data) {
  try {
    const cache = localStorage.getItem(TRACK_CACHE_KEY);
    const parsed = cache ? JSON.parse(cache) : {};
    const key = `${artist}|${title}|${lang}`;
    parsed[key] = data;
    localStorage.setItem(TRACK_CACHE_KEY, JSON.stringify(parsed));
  } catch (e) {
    console.warn('Error guardando cache de track:', e);
  }
}

// ==================== MAPEO DE LETRAS COMPLETAS A LÍNEAS ====================
function mapLyricsToLines(fullLyrics, fullTranslation, visibleLines) {
  if (!fullTranslation) return null;
  
  // Dividir letras y traducción en líneas
  const lyricsLines = fullLyrics ? fullLyrics.split(/\n+/).map(l => l.trim()).filter(l => l) : [];
  const translationLines = fullTranslation.split(/\n+/).map(l => l.trim()).filter(l => l);
  
  // Crear mapa de traducciones por línea
  const translationMap = {};
  
  // Normalizar texto para comparación (remover puntuación, minúsculas)
  function normalizeText(text) {
    return text.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }
  
  // Mapear líneas visibles a traducciones
  visibleLines.forEach((line, index) => {
    const lineText = line.texto.trim();
    const normalizedLine = normalizeText(lineText);
    
    // Buscar línea más similar en las letras originales
    let bestMatch = null;
    let bestScore = 0;
    
    lyricsLines.forEach((lyricLine, lyricIndex) => {
      const normalizedLyric = normalizeText(lyricLine);
      
      // Coincidencia exacta después de normalización
      if (normalizedLine === normalizedLyric) {
        bestScore = 1.0;
        bestMatch = lyricIndex;
        return;
      }
      
      // Calcular similitud usando palabras
      const lineWords = normalizedLine.split(/\s+/).filter(w => w.length > 2);
      const lyricWords = normalizedLyric.split(/\s+/).filter(w => w.length > 2);
      
      if (lineWords.length === 0 || lyricWords.length === 0) return;
      
      // Contar palabras comunes
      const commonWords = lineWords.filter(w => lyricWords.includes(w));
      const score = commonWords.length / Math.max(lineWords.length, lyricWords.length);
      
      // También verificar si la línea del DOM está contenida en la línea de lyrics (o viceversa)
      const containsMatch = normalizedLyric.includes(normalizedLine) || normalizedLine.includes(normalizedLyric);
      const finalScore = containsMatch ? Math.max(score, 0.7) : score;
      
      if (finalScore > bestScore && finalScore > 0.4) { // Al menos 40% de similitud
        bestScore = finalScore;
        bestMatch = lyricIndex;
      }
    });
    
    // Si encontramos match, usar la traducción correspondiente
    if (bestMatch !== null && bestMatch < translationLines.length && bestScore >= 0.4) {
      translationMap[lineText.toLowerCase().trim()] = {
        translation: translationLines[bestMatch],
        score: bestScore,
        matched: true
      };
    } else {
      // Marcar como no encontrado para traducir individualmente
      translationMap[lineText.toLowerCase().trim()] = {
        translation: null,
        score: 0,
        matched: false
      };
    }
  });
  
  return translationMap;
}

// ==================== TRADUCCIÓN CON SERVIDOR ====================
// Traducir línea individual usando el servidor
async function translateLineWithServer(text, lang = TARGET_LANGUAGE) {
  if (!text || !text.trim()) return null;

  const trimmedText = text.trim();
  const serverUrl = getServerUrl();
  
  if (!serverUrl) {
    if (GITHUB_TUNNEL_URL) {
      console.warn('LyricsTranslator: Esperando URL desde GitHub... Si el problema persiste, verifica la conexión o configura LyricsTranslator.setServerUrl() manualmente');
    } else {
      console.warn('LyricsTranslator: No hay URL del servidor configurada. Configura GITHUB_TUNNEL_URL, DEFAULT_SERVER_URL o usa LyricsTranslator.setServerUrl()');
    }
    return null;
  }

  // Verificar cache primero
  const cached = getCachedTranslation(trimmedText, lang);
  if (cached) {
    return cached;
  }

  try {
    const url = `${serverUrl}/translate?text=${encodeURIComponent(trimmedText)}&lang=${lang}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), SERVER_TIMEOUT);
    
    const response = await fetch(url, {
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.translation) {
      // Guardar en cache
      saveCachedTranslation(trimmedText, lang, data.translation);
      return data.translation;
    }
    
    return null;
  } catch (error) {
    if (error.name !== 'AbortError') {
      console.warn('Error traduciendo línea con servidor:', error);
    }
    return null;
  }
}

// ==================== UTILIDADES ====================
function debounce(fn, wait = DEBOUNCE_DELAY) {
  let t;
  return (...a) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...a), wait);
  };
}

// Contenedor scroll oficial de Beautiful Lyrics
function getLyricsScroller() {
  return document.querySelector('.simplebar-content-wrapper');
}

function getLyricsRoot() {
  const any = document.querySelector('.VocalsGroup, [class*="VocalsGroup"]');
  return any ? any.parentElement : null;
}

function getGroups(root) {
  return Array.from(root.querySelectorAll('.VocalsGroup, [class*="VocalsGroup"]'));
}

function tipoVoz(cl) {
  cl = cl.toLowerCase();
  if (cl.includes('lead')) return 'VOZ PRINCIPAL';
  if (cl.includes('background') || cl.includes('bg')) return 'VOCES SECUNDARIAS';
  return 'VOZ';
}

function reconstruirPalabra(wordNode) {
  let out = '';
  for (const node of wordNode.children) {
    if (
      (node.classList && (node.classList.contains('Lyric') || node.classList.contains('Syllable')))
    ) {
      out += node.textContent.trim();
    } else if (node.classList && node.classList.contains('Emphasis')) {
      out += Array.from(node.querySelectorAll('.Letter.Synced')).map(e => e.textContent.trim()).join('');
    } else if (node.classList && node.classList.contains('Letter')) {
      out += node.textContent.trim();
    }
  }
  return out;
}

function isBlockActive(bloque) {
  if (!bloque) return false;
  if (bloque.classList && (bloque.classList.contains('Active') || bloque.classList.contains('Highlight'))) return true;
  if (bloque.querySelector('.Active, .Highlight')) return true;
  let g = bloque.parentElement;
  while (g && g !== document.body) {
    if (g.classList && (g.classList.contains('Active') || g.classList.contains('Highlight'))) return true;
    g = g.parentElement;
  }
  return false;
}

function extractLinesFromGroup(group) {
  let resultado = [];

  for (const bloque of group.querySelectorAll(':scope > .Vocals, :scope > .Vocals.Lead, :scope > .Vocals.Background, :scope > .Vocals.Sung')) {
    let palabras = [];

    const line = bloque.querySelector('.Lyric.Synced.Line');
    if (line) {
      palabras.push(line.textContent.trim());
    } else {
      for (const node of bloque.childNodes) {
        if (node.nodeType !== 1) continue;

        if (node.classList && node.classList.contains('Word')) {
          const palabra = reconstruirPalabra(node);
          if (palabra) palabras.push(palabra);
        } else if (
          node.classList &&
          node.classList.contains('Lyric') &&
          node.classList.contains('Syllable') &&
          node.classList.contains('Synced')
        ) {
          palabras.push(node.textContent.trim());
        } else if (
          node.classList &&
          node.classList.contains('Lyric') &&
          node.classList.contains('Syllable') &&
          node.classList.contains('Emphasis')
        ) {
          const letras = Array.from(node.querySelectorAll('.Letter.Synced')).map(l => l.textContent.trim()).join('');
          if (letras) palabras.push(letras);
        }
      }
    }

    if (!palabras.length) continue;

    resultado.push({
      bloque: bloque,
      texto: palabras.join(' ').replace(/\s+/g, ' ').trim(),
      rol: tipoVoz(bloque.className)
    });
  }

  if (!resultado.length) {
    let palabras = [];
    for (const node of group.querySelectorAll('.Lyric.Synced.Line, .Word, .Lyric.Syllable.Synced, .Lyric.Syllable.Emphasis')) {
      if (node.classList && node.classList.contains('Lyric') && node.classList.contains('Synced') && node.classList.contains('Line')) {
        palabras.push(node.textContent.trim());
      } else if (node.classList && node.classList.contains('Word')) {
        const palabra = reconstruirPalabra(node);
        if (palabra) palabras.push(palabra);
      } else if (node.classList && node.classList.contains('Emphasis')) {
        const letras = Array.from(node.querySelectorAll('.Letter.Synced')).map(l => l.textContent.trim()).join('');
        if (letras) palabras.push(letras);
      } else {
        palabras.push(node.textContent.trim());
      }
    }
    if (palabras.length) {
      resultado.push({
        bloque: group,
        texto: palabras.join(' ').replace(/\s+/g, ' ').trim(),
        rol: 'VOZ'
      });
    }
  }

  return resultado;
}

// ==================== INSERCIÓN DE TRADUCCIONES ====================
function insertBoxAfterBlock(bloque, texto, rol, traduccion, isLast) {
  // Verificar si ya existe una caja después de este bloque
  let next = bloque.nextSibling;
  if (next && next.classList && next.classList.contains('translated-fake')) {
    // Si ya existe, actualizar contenido y estilos
    const isActive = isBlockActive(bloque);
    
    // Solo mostrar traducción si está disponible
    if (traduccion) {
      next.textContent = traduccion;
    } else {
      // Si no hay traducción aún, dejar vacío o mostrar placeholder
      next.textContent = '';
    }
    
    // Estilos: sin fondo, color según estado activo/inactivo, brillo si está activa
    next.style.background = 'transparent';
    next.style.color = isActive ? '#E4DFDF' : 'rgba(234, 233, 229, 0.6)';
    next.style.outline = 'none';
    next.style.boxShadow = '';
    next.style.padding = '0';
    next.style.borderRadius = '0';
    next.style.margin = isLast ? '0 0 48px 0' : '0 0 6px 0';
    next.style.fontSize = '42px';
    next.style.fontWeight = '400';
    
    // Brillo cuando está activa
    if (isActive) {
      next.style.textShadow = '0 0 10px rgba(228, 223, 223, 0.8), 0 0 20px rgba(228, 223, 223, 0.5)';
      next.style.filter = 'brightness(1.2)';
    } else {
      next.style.textShadow = '';
      next.style.filter = '';
    }
    
    return; // No crear duplicado
  }

  const box = document.createElement('div');
  box.className = 'translated-fake';
  box.setAttribute('data-original-text', texto); // Guardar texto original para referencia
  
  // Solo mostrar traducción si está disponible
  if (traduccion) {
    box.textContent = traduccion;
  } else {
    // Si no hay traducción aún, dejar vacío
    box.textContent = '';
  }

  const isActive = isBlockActive(bloque);
  
  // Estilos: sin fondo, color según estado activo/inactivo, brillo si está activa
  box.style.cssText = [
    'background:transparent',
    `color:${isActive ? '#E4DFDF' : 'rgba(234, 233, 229, 0.6)'}`,
    'outline:none',
    'padding:0',
    'border-radius:0',
    isLast ? 'margin:0 0 48px 0' : 'margin:0 0 6px 0',
    'font-size:42px',
    'font-weight:400',
    'position:relative',
    'z-index:10',
    'display:block',
    isActive ? 'text-shadow:0 0 10px rgba(228, 223, 223, 0.8), 0 0 20px rgba(228, 223, 223, 0.5)' : '',
    isActive ? 'filter:brightness(1.2)' : ''
  ].filter(Boolean).join(';');

  bloque.parentNode.insertBefore(box, bloque.nextSibling);
}

function clearBoxes(root) {
  root.querySelectorAll('.translated-fake').forEach(n => n.remove());
}

// ==================== SCROLL HACK ====================
let lastActiveElement = null;
let scrollAdjustmentScheduled = false;

function adjustScrollForActiveLine() {
  if (scrollAdjustmentScheduled) return;
  scrollAdjustmentScheduled = true;

  // Usar múltiples requestAnimationFrame para asegurar que Beautiful Lyrics terminó su scroll
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      scrollAdjustmentScheduled = false;
      const scroller = getLyricsScroller();
      if (!scroller) return;

      // Buscar la línea activa actual
      const activeVocals = document.querySelector('.VocalsGroup > .Vocals.Active, .VocalsGroup > .Vocals.Lead.Active, .VocalsGroup > .Vocals.Background.Active, .VocalsGroup > .Vocals.Highlight');
      if (!activeVocals) return;

      // Obtener el VocalsGroup padre
      const vocalsGroup = activeVocals.closest('.VocalsGroup');
      if (!vocalsGroup) return;

      // Buscar la caja de traducción asociada (después del bloque activo)
      let translationBox = null;
      let nextSibling = activeVocals.nextSibling;
      
      // Buscar el siguiente elemento hermano que sea nuestra caja
      while (nextSibling) {
        if (nextSibling.nodeType === 1 && nextSibling.classList && nextSibling.classList.contains('translated-fake')) {
          translationBox = nextSibling;
          break;
        }
        nextSibling = nextSibling.nextSibling;
      }

      // Si no se encuentra después del bloque, buscar después del grupo
      if (!translationBox) {
        nextSibling = vocalsGroup.nextSibling;
        while (nextSibling) {
          if (nextSibling.nodeType === 1 && nextSibling.classList && nextSibling.classList.contains('translated-fake')) {
            translationBox = nextSibling;
            break;
          }
          nextSibling = nextSibling.nextSibling;
        }
      }

      // Calcular la posición para centrar el bloque completo (línea + caja de traducción)
      const activeRect = activeVocals.getBoundingClientRect();
      const scrollerRect = scroller.getBoundingClientRect();
      
      // Calcular la altura total del bloque (línea activa + caja si existe)
      let blockBottom = activeRect.bottom;
      if (translationBox) {
        const translationRect = translationBox.getBoundingClientRect();
        blockBottom = Math.max(blockBottom, translationRect.bottom);
      }
      
      const totalHeight = blockBottom - activeRect.top;
      const blockCenter = activeRect.top + (totalHeight / 2);
      const scrollerCenter = scrollerRect.top + (scrollerRect.height / 2);
      
      // Calcular el offset necesario para centrar
      const offset = blockCenter - scrollerCenter;
      
      // Aplicar el scroll ajustado suavemente
      if (Math.abs(offset) > 5) { // Solo ajustar si hay diferencia significativa
        scroller.scrollTop = scroller.scrollTop + offset;
      }
    });
  });
}

function scrollToActiveLyrics() {
  // Usar la nueva función mejorada
  adjustScrollForActiveLine();
}

// ==================== PROCESAMIENTO PRINCIPAL ====================
let observerRoot = null;
let mainObserver = null;
let lastChecksum = "";
let currentTrackInfo = null;
let currentTranslationMap = null;

function checksum(groups) {
  return groups.map(g => g.innerText).join('||');
}

const debouncedProcess = debounce(processOnce, DEBOUNCE_DELAY);

async function processOnce() {
  const root = getLyricsRoot();
  if (!root) return;

  const groups = getGroups(root);
  const cksum = checksum(groups);
  
  // Obtener información de la canción actual
  const trackInfo = getCurrentTrackInfo();
  const trackChanged = !currentTrackInfo || 
    !trackInfo || 
    currentTrackInfo.uri !== trackInfo.uri ||
    currentTrackInfo.artist !== trackInfo.artist ||
    currentTrackInfo.title !== trackInfo.title;
  
  // Si cambió la canción, intentar obtener letras del servidor
  if (trackChanged && trackInfo && trackInfo.artist && trackInfo.title) {
    currentTrackInfo = trackInfo;
    currentTranslationMap = null;
    
    // Intentar obtener letras del servidor
    const serverUrl = getServerUrl();
    if (serverUrl) {
      try {
        const lyricsData = await getLyricsFromServer(trackInfo.artist, trackInfo.title, TARGET_LANGUAGE);
        if (lyricsData && lyricsData.translation) {
          // El mapeo se hará después cuando tengamos las líneas visibles
          console.log('Letras obtenidas del servidor para:', trackInfo.title);
        }
      } catch (e) {
        console.warn('Error obteniendo letras del servidor:', e);
      }
    }
  }
  
  // Solo procesar si realmente cambió el contenido de las letras
  if (cksum === lastChecksum && !trackChanged) {
    // Aún así, actualizar estilos de cajas existentes si cambió la línea activa
    updateExistingBoxesStyles(root);
    adjustScrollForActiveLine();
    return;
  }

  lastChecksum = cksum;
  
  // Extraer todas las líneas visibles
  const allVisibleLines = [];
  for (const g of groups) {
    const resultado = extractLinesFromGroup(g);
    allVisibleLines.push(...resultado);
  }
  
  // Si tenemos letras del servidor, crear mapa de traducciones
  if (trackInfo && trackInfo.artist && trackInfo.title) {
    const lyricsData = getTrackCache(trackInfo.artist, trackInfo.title, TARGET_LANGUAGE);
    if (lyricsData && lyricsData.translation) {
      currentTranslationMap = mapLyricsToLines(
        lyricsData.lyrics,
        lyricsData.translation,
        allVisibleLines
      );
    }
  }

  // Procesar todos los grupos e insertar traducciones
  for (const g of groups) {
    const resultado = extractLinesFromGroup(g);
    if (!resultado.length) continue;

    resultado.forEach(({ bloque, texto, rol }, idx2) => {
      if (!texto) return;
      
      // Buscar traducción en el mapa
      let traduccion = null;
      let needsTranslation = false;
      
      if (currentTranslationMap) {
        const lineKey = texto.toLowerCase().trim();
        const mapEntry = currentTranslationMap[lineKey];
        
        if (mapEntry && mapEntry.matched && mapEntry.translation) {
          // Usar traducción del servidor (Musixmatch)
          traduccion = mapEntry.translation;
        } else {
          // No hay match, necesita traducción individual
          needsTranslation = true;
        }
      } else {
        // No hay mapa, traducir individualmente
        needsTranslation = true;
      }
      
      // Si necesita traducción, usar el servidor
      if (needsTranslation) {
        // Traducir de forma asíncrona
        translateLineWithServer(texto, TARGET_LANGUAGE).then(trans => {
          if (trans) {
            // Buscar la caja asociada usando el texto original como referencia
            // Primero buscar después del bloque
            let next = bloque.nextSibling;
            while (next) {
              if (next.nodeType === 1 && next.classList && next.classList.contains('translated-fake')) {
                const originalText = next.getAttribute('data-original-text');
                if (originalText === texto) {
                  // Encontrada, actualizar solo con la traducción
                  next.textContent = trans;
                  return;
                }
              }
              next = next.nextSibling;
            }
            
            // Si no se encuentra, buscar en todo el contenedor de letras
            const root = getLyricsRoot();
            if (root) {
              const allBoxes = root.querySelectorAll('.translated-fake');
              for (const box of allBoxes) {
                const originalText = box.getAttribute('data-original-text');
                if (originalText === texto) {
                  // Encontrada, actualizar solo con la traducción
                  box.textContent = trans;
                  return;
                }
              }
            }
          }
        }).catch(err => {
          console.warn('Error traduciendo línea:', err);
        });
      }
      
      // Insertar la caja (con traducción si está disponible, o sin ella si aún se está traduciendo)
      insertBoxAfterBlock(bloque, texto, rol, traduccion, idx2 === resultado.length - 1);
    });
  }

  // Actualizar estilos de todas las cajas existentes
  updateExistingBoxesStyles(root);
  adjustScrollForActiveLine();
}

// Función para actualizar estilos de cajas existentes sin recrearlas
function updateExistingBoxesStyles(root) {
  const boxes = root.querySelectorAll('.translated-fake');
  boxes.forEach(box => {
    // Buscar el bloque asociado (el hermano anterior)
    let bloque = box.previousSibling;
    while (bloque && bloque.nodeType !== 1) {
      bloque = bloque.previousSibling;
    }
    
    if (bloque) {
      const isActive = isBlockActive(bloque);
      
      // Estilos: sin fondo, color según estado activo/inactivo, brillo si está activa
      box.style.background = 'transparent';
      box.style.color = isActive ? '#E4DFDF' : 'rgba(234, 233, 229, 0.6)';
      box.style.outline = 'none';
      box.style.boxShadow = '';
      box.style.padding = '0';
      box.style.borderRadius = '0';
      
      // Brillo cuando está activa
      if (isActive) {
        box.style.textShadow = '0 0 10px rgba(228, 223, 223, 0.8), 0 0 20px rgba(228, 223, 223, 0.5)';
        box.style.filter = 'brightness(1.2)';
      } else {
        box.style.textShadow = '';
        box.style.filter = '';
      }
    }
  });
}

// ==================== OBSERVADORES ====================
let activeLineObserver = null;

function setupActiveLineObserver() {
  if (activeLineObserver) activeLineObserver.disconnect();

  // Observer específico para cambios en líneas activas
  activeLineObserver = new MutationObserver((mutations) => {
    let shouldAdjust = false;
    
    for (const mutation of mutations) {
      if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
        const target = mutation.target;
        // Verificar si es una línea de letras que cambió su estado activo
        if (target.classList && (
          target.classList.contains('Vocals') ||
          target.classList.contains('Active') ||
          target.classList.contains('Highlight')
        )) {
          // Verificar si realmente cambió el estado activo
          const isNowActive = target.classList.contains('Active') || target.classList.contains('Highlight');
          if (isNowActive) {
            shouldAdjust = true;
            break;
          }
        }
      }
    }
    
    if (shouldAdjust) {
      // Actualizar estilos de cajas existentes
      const root = getLyricsRoot();
      if (root) {
        updateExistingBoxesStyles(root);
      }
      
      // Ajustar scroll después de que Beautiful Lyrics termine
      setTimeout(() => adjustScrollForActiveLine(), 100);
    }
  });

  const lyricsRoot = getLyricsRoot();
  if (lyricsRoot) {
    activeLineObserver.observe(lyricsRoot, {
      attributes: true,
      attributeFilter: ['class'],
      subtree: true
    });
  }
}

function setupObservers() {
  if (observerRoot) observerRoot.disconnect();

  observerRoot = new MutationObserver(() => {
    debouncedProcess();
    // Reconfigurar el observer de líneas activas cuando cambia el DOM
    setupActiveLineObserver();
  });
  
  observerRoot.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['class']
  });
  
  setupActiveLineObserver();
  debouncedProcess();
}

function bootstrap() {
  if (mainObserver) mainObserver.disconnect();

  mainObserver = new MutationObserver(() => {
    setupObservers();
    debouncedProcess();
  });

  mainObserver.observe(document.body, { childList: true, subtree: true });
  debouncedProcess();
}

bootstrap();

// ==================== HOOKS DE NAVEGACIÓN ====================
function hookNav() {
  try {
    const H = window.Spicetify?.Platform?.History;
    if (H && typeof H.listen === 'function') H.listen(() => debouncedProcess());
  } catch {}

  window.addEventListener('popstate', debouncedProcess);
  window.addEventListener('hashchange', debouncedProcess);

  try {
    const P = window.Spicetify?.Platform?.Player;
    if (P && typeof P.addEventListener === 'function') {
      P.addEventListener('songchange', debouncedProcess);
      P.addEventListener('queue_change', debouncedProcess);
    }
  } catch {}

  try {
    const P2 = window.Spicetify?.Player;
    if (P2 && typeof P2.addEventListener === 'function') {
      P2.addEventListener('songchange', debouncedProcess);
    }
  } catch {}
}

hookNav();

// ==================== FUNCIONES GLOBALES PARA CONFIGURACIÓN ====================
// Exponer funciones útiles en la consola para configuración
window.LyricsTranslator = {
  setServerUrl: (url) => {
    if (url && !url.startsWith('http')) {
      console.error('La URL debe comenzar con http:// o https://');
      return;
    }
    setServerUrl(url);
    console.log(`URL del servidor configurada: ${url || '(deshabilitado)'}`);
    if (url) {
      isServerAvailable(url).then(available => {
        console.log(`Servidor ${available ? 'disponible' : 'no disponible'}`);
      });
    }
  },
  useGitHub: () => {
    clearManualServerUrl();
  },
  clearServerUrl: () => {
    clearManualServerUrl();
  },
  getServerUrl: () => {
    const url = getServerUrl();
    const stored = localStorage.getItem(SERVER_URL_KEY);
    const cachedGitHub = getCachedGitHubUrl();
    
    if (stored) {
      console.log(`URL del servidor (configurada manualmente): ${url}`);
    } else if (cachedGitHub) {
      console.log(`URL del servidor (desde GitHub): ${url}`);
      console.log('💡 La URL se actualiza automáticamente desde GitHub cada 5 minutos');
    } else if (DEFAULT_SERVER_URL) {
      console.log(`URL del servidor (por defecto): ${url}`);
      console.log('💡 Puedes sobrescribirla usando: LyricsTranslator.setServerUrl("https://...")');
    } else {
      console.log(`URL del servidor: ${url || '(no configurada)'}`);
      if (GITHUB_TUNNEL_URL) {
        console.log('💡 Esperando URL desde GitHub... Si el problema persiste, configura LyricsTranslator.setServerUrl("https://...")');
      } else {
        console.log('💡 Configura GITHUB_TUNNEL_URL, DEFAULT_SERVER_URL o usa LyricsTranslator.setServerUrl("https://...")');
      }
    }
    return url;
  },
  testServer: async () => {
    const url = getServerUrl();
    if (!url) {
      console.error('No hay URL del servidor configurada. Usa LyricsTranslator.setServerUrl("https://...")');
      return;
    }
    const available = await isServerAvailable(url);
    console.log(`Servidor ${available ? '✓ disponible' : '✗ no disponible'}`);
    return available;
  },
  getCurrentTrack: () => {
    const track = getCurrentTrackInfo();
    console.log('Canción actual:', track);
    return track;
  }
};

console.log('LyricsTranslator: Usa LyricsTranslator.setServerUrl("https://...") para configurar la URL del servidor');
console.log('LyricsTranslator: Usa LyricsTranslator.useGitHub() para limpiar la URL manual y usar GitHub');

// Inicializar URL del servidor desde GitHub (si está configurado)
initializeServerUrl();

