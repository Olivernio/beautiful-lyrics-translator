#!/usr/bin/env python3
"""
Servidor Flask para traducción de letras usando Musixmatch API
Expone endpoints para obtener letras y traducciones
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
import os
import sys
from datetime import datetime
import traceback

# Intentar importar musicxmatch-api
try:
    # Asumir que está instalado o en el path relativo
    sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'musicxmatch-api-main', 'src'))
    from musicxmatch_api.main import MusixMatchAPI
    MUSIXMATCH_AVAILABLE = True
except ImportError:
    print("Warning: musicxmatch-api no disponible. Usando solo googletrans.")
    MUSIXMATCH_AVAILABLE = False

# Intentar importar googletrans como fallback
try:
    from googletrans import Translator
    GOOGLETRANS_AVAILABLE = True
except ImportError:
    try:
        # Intentar importar de manera alternativa para versiones más recientes
        import googletrans
        from googletrans import Translator
        GOOGLETRANS_AVAILABLE = True
    except Exception as e:
        print(f"Warning: googletrans no disponible: {e}")
        GOOGLETRANS_AVAILABLE = False

app = Flask(__name__)
CORS(app)  # Permitir CORS para requests desde Spotify

# Configuración
DB_PATH = os.path.join(os.path.dirname(__file__), 'lyrics_cache.db')
CACHE_EXPIRY_DAYS = 30  # Cache válido por 30 días

# Inicializar APIs
musixmatch = MusixMatchAPI() if MUSIXMATCH_AVAILABLE else None
translator = Translator() if GOOGLETRANS_AVAILABLE else None


def init_db():
    """Inicializar base de datos SQLite para cache"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS cache (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            artist TEXT NOT NULL,
            title TEXT NOT NULL,
            lang TEXT NOT NULL,
            lyrics TEXT,
            translation TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(artist, title, lang)
        )
    ''')
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS translation_cache (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            text TEXT NOT NULL,
            lang TEXT NOT NULL,
            translation TEXT NOT NULL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(text, lang)
        )
    ''')
    cursor.execute('''
        CREATE INDEX IF NOT EXISTS idx_artist_title_lang 
        ON cache(artist, title, lang)
    ''')
    cursor.execute('''
        CREATE INDEX IF NOT EXISTS idx_text_lang 
        ON translation_cache(text, lang)
    ''')
    conn.commit()
    conn.close()


def get_cached_lyrics(artist, title, lang):
    """Obtener letras/traducción del cache"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Verificar si existe y no está expirado
    cursor.execute('''
        SELECT lyrics, translation, timestamp 
        FROM cache 
        WHERE artist = ? AND title = ? AND lang = ?
    ''', (artist, title, lang))
    
    result = cursor.fetchone()
    conn.close()
    
    if result:
        lyrics, translation, timestamp = result
        # Verificar si no está expirado (simplificado - en producción usar timedelta)
        return {
            'lyrics': lyrics,
            'translation': translation,
            'cached': True
        }
    
    return None


def save_to_cache(artist, title, lang, lyrics=None, translation=None):
    """Guardar letras/traducción en cache"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute('''
        INSERT OR REPLACE INTO cache (artist, title, lang, lyrics, translation, timestamp)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', (artist, title, lang, lyrics, translation, datetime.now()))
    
    conn.commit()
    conn.close()


def get_cached_translation(text, lang):
    """Obtener traducción individual del cache"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT translation, timestamp 
        FROM translation_cache 
        WHERE text = ? AND lang = ?
    ''', (text, lang))
    
    result = cursor.fetchone()
    conn.close()
    
    if result:
        translation, timestamp = result
        return translation
    
    return None


def save_cached_translation(text, lang, translation):
    """Guardar traducción individual en cache"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute('''
        INSERT OR REPLACE INTO translation_cache (text, lang, translation, timestamp)
        VALUES (?, ?, ?, ?)
    ''', (text, lang, translation, datetime.now()))
    
    conn.commit()
    conn.close()


@app.route('/ping', methods=['GET'])
def ping():
    """Health check endpoint"""
    return jsonify({
        'status': 'ok',
        'musixmatch': MUSIXMATCH_AVAILABLE,
        'googletrans': GOOGLETRANS_AVAILABLE
    })


@app.route('/search', methods=['GET'])
def search_track():
    """Buscar track en Musixmatch"""
    if not MUSIXMATCH_AVAILABLE:
        return jsonify({'error': 'Musixmatch API no disponible'}), 503
    
    artist = request.args.get('artist', '').strip()
    title = request.args.get('title', '').strip()
    
    if not artist or not title:
        return jsonify({'error': 'Se requieren parámetros artist y title'}), 400
    
    try:
        # Construir query de búsqueda combinando artista y título
        query = f"{artist} {title}"
        result = musixmatch.search_tracks(query)
        # Acceder a la lista de tracks desde la estructura de respuesta
        track_list = result.get('message', {}).get('body', {}).get('track_list', [])
        # Limitar a 5 resultados y extraer solo los datos del track
        tracks = [item.get('track', {}) for item in track_list[:5]]
        return jsonify({
            'results': tracks
        })
    except Exception as e:
        print(f"Error en search_track: {traceback.format_exc()}")
        return jsonify({'error': str(e)}), 500


@app.route('/lyrics', methods=['GET'])
def get_lyrics():
    """
    Obtener letras y traducción para una canción
    Parámetros: artist, title, lang (default: 'es')
    """
    artist = request.args.get('artist', '').strip()
    title = request.args.get('title', '').strip()
    lang = request.args.get('lang', 'es').strip()
    
    if not artist or not title:
        return jsonify({'error': 'Se requieren parámetros artist y title'}), 400
    
    # Verificar cache primero
    cached = get_cached_lyrics(artist, title, lang)
    if cached:
        return jsonify(cached)
    
    lyrics_text = None
    translation_text = None
    
    # Intentar obtener traducción directa de Musixmatch
    if MUSIXMATCH_AVAILABLE:
        try:
            # Buscar track - usar query combinada
            query = f"{artist} {title}"
            result = musixmatch.search_tracks(query)
            track_list = result.get('message', {}).get('body', {}).get('track_list', [])
            if track_list and len(track_list) > 0:
                track = track_list[0].get('track', {})
                track_id = track.get('track_id')
                
                # Intentar obtener traducción directa
                try:
                    translation_data = musixmatch.get_track_lyrics_translation(
                        track_id, selected_language=lang
                    )
                    # La traducción está en message.body.translations_list[0].translation.translated_text
                    trans_list = translation_data.get('message', {}).get('body', {}).get('translations_list', [])
                    if trans_list and len(trans_list) > 0:
                        trans_obj = trans_list[0].get('translation', {})
                        translation_text = trans_obj.get('translated_text')
                except Exception as e:
                    print(f"No se pudo obtener traducción directa: {e}")
                
                # Obtener letras (siempre, para tener el texto original)
                try:
                    lyrics_data = musixmatch.get_track_lyrics(track_id)
                    # Las letras están en message.body.lyrics.lyrics_body
                    lyrics_obj = lyrics_data.get('message', {}).get('body', {}).get('lyrics', {})
                    lyrics_text = lyrics_obj.get('lyrics_body')
                except Exception as e:
                    print(f"No se pudieron obtener letras: {e}")
        except Exception as e:
            print(f"Error con Musixmatch: {traceback.format_exc()}")
    
    # Si tenemos letras pero no traducción, usar googletrans
    if lyrics_text and not translation_text and GOOGLETRANS_AVAILABLE:
        try:
            translated = translator.translate(lyrics_text, dest=lang)
            translation_text = translated.text
        except Exception as e:
            print(f"Error con googletrans: {e}")
    
    # Guardar en cache
    if lyrics_text or translation_text:
        save_to_cache(artist, title, lang, lyrics_text, translation_text)
    
    return jsonify({
        'lyrics': lyrics_text,
        'translation': translation_text,
        'cached': False
    })


@app.route('/translate', methods=['GET'])
def translate_text():
    """
    Traducir un texto individual
    Parámetros: text, lang (default: 'es')
    """
    text = request.args.get('text', '').strip()
    lang = request.args.get('lang', 'es').strip()
    
    if not text:
        return jsonify({'error': 'Se requiere parámetro text'}), 400
    
    # Verificar cache
    cached = get_cached_translation(text, lang)
    if cached:
        return jsonify({
            'translation': cached,
            'cached': True
        })
    
    translation_text = None
    
    # Usar googletrans
    if GOOGLETRANS_AVAILABLE:
        try:
            translated = translator.translate(text, dest=lang)
            translation_text = translated.text
        except Exception as e:
            print(f"Error con googletrans: {e}")
            # No retornar error, simplemente dejar translation_text como None
            translation_text = None
    
    if not translation_text:
        return jsonify({
            'translation': None,
            'error': 'No se pudo traducir el texto',
            'cached': False
        }), 200  # Retornar 200 pero con error en el JSON
    
    # Guardar en cache
    if translation_text:
        save_cached_translation(text, lang, translation_text)
    
    return jsonify({
        'translation': translation_text,
        'cached': False
    })


if __name__ == '__main__':
    # Inicializar base de datos
    init_db()
    
    print("=" * 50)
    print("Servidor de Traducción de Letras")
    print("=" * 50)
    print(f"Musixmatch API: {'✓' if MUSIXMATCH_AVAILABLE else '✗'}")
    print(f"Googletrans: {'✓' if GOOGLETRANS_AVAILABLE else '✗'}")
    print("=" * 50)
    print("\nIniciando servidor en http://localhost:5000")
    print("Endpoints disponibles:")
    print("  GET /ping - Health check")
    print("  GET /search?artist=X&title=Y - Buscar track")
    print("  GET /lyrics?artist=X&title=Y&lang=es - Obtener letras/traducción")
    print("  GET /translate?text=X&lang=es - Traducir texto individual")
    print("\nPresiona Ctrl+C para detener el servidor\n")
    
    app.run(host='0.0.0.0', port=5000, debug=False)

