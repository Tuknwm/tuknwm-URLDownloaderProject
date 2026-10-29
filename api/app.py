import os
import re
import subprocess
import tempfile
from flask import Flask, request, jsonify, Response
import yt_dlp

_env = os.path.join(os.path.dirname(__file__), '.env')
if os.path.exists(_env):
    for _line in open(_env):
        _line = _line.strip()
        if _line and not _line.startswith('#') and '=' in _line:
            _k, _v = _line.split('=', 1)
            os.environ.setdefault(_k.strip(), _v.strip())

app = Flask(__name__)

FFMPEG = os.environ.get('FFMPEG_PATH', '/usr/bin/ffmpeg')
ALLOWED_ORIGINS = {'https://kurokyu.web.id', 'https://tuknwm-urldownloader.vercel.app', 'http://localhost:5173', 'http://localhost:3000'}


@app.after_request
def add_cors(r):
    origin = request.headers.get('Origin', '')
    if origin in ALLOWED_ORIGINS:
        r.headers['Access-Control-Allow-Origin'] = origin
    r.headers['Access-Control-Allow-Headers'] = 'Content-Type'
    return r


def safe_filename(title, ext):
    name = re.sub(r'[^\w\s-]', '', title or 'video').strip().replace(' ', '_')[:60]
    return f'{name}.{ext}'


@app.route('/info')
def info():
    url = request.args.get('url', '').strip()
    if not url:
        return jsonify({'error': 'missing url'}), 400

    try:
        with yt_dlp.YoutubeDL({'quiet': True, 'no_warnings': True}) as ydl:
            meta = ydl.extract_info(url, download=False)
    except Exception as e:
        return jsonify({'error': str(e)}), 400

    # all video formats with height
    formats = [
        {
            'id': f['format_id'],
            'label': f'{f.get("height", "?")}p',
            'height': f.get('height') or 0,
            'url': f['url'],
            'ext': f.get('ext', 'mp4'),
        }
        for f in meta.get('formats', [])
        if f.get('vcodec') not in (None, 'none') and f.get('height')
    ]
    formats.sort(key=lambda f: f['height'], reverse=True)
    seen = set()
    formats = [f for f in formats if not (f['height'] in seen or seen.add(f['height']))]

    # best audio
    audio = next(
        (f for f in meta.get('formats', [])
         if f.get('acodec') != 'none' and f.get('vcodec') == 'none'),
        None
    )

    return jsonify({
        'title': meta.get('title', ''),
        'channel': meta.get('uploader') or meta.get('channel', ''),
        'duration': meta.get('duration', 0),
        'thumbnail': meta.get('thumbnail', ''),
        'formats': formats,
        'audio_url': audio['url'] if audio else None,
        'audio_ext': audio.get('ext', 'mp3') if audio else 'mp3',
    })


@app.route('/download')
def download():
    url = request.args.get('url', '').strip()
    fmt_id = request.args.get('fmt_id', 'bestvideo+bestaudio').strip()
    title = request.args.get('title', 'video').strip()

    if not url:
        return jsonify({'error': 'missing url'}), 400

    filename = safe_filename(title, 'mp4')

    def generate():
        with tempfile.NamedTemporaryFile(suffix='.mp4', delete=False, dir='/tmp') as tmp:
            tmp_path = tmp.name
        try:
            ydl_opts = {
                'format': fmt_id,
                'outtmpl': tmp_path + '.%(ext)s',
                'ffmpeg_location': os.path.dirname(FFMPEG),
                'quiet': True,
                'no_warnings': True,
                'merge_output_format': 'mp4',
            }
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                ydl.download([url])

            actual = tmp_path + '.mp4'
            with open(actual, 'rb') as f:
                while chunk := f.read(1024 * 256):
                    yield chunk
        finally:
            for p in [tmp_path, tmp_path + '.mp4', tmp_path + '.webm', tmp_path + '.mkv']:
                if os.path.exists(p):
                    os.unlink(p)

    return Response(
        generate(),
        mimetype='video/mp4',
        headers={
            'Content-Disposition': f'attachment; filename="{filename}"',
            'X-Accel-Buffering': 'no',
        }
    )


@app.route('/download-audio')
def download_audio():
    url = request.args.get('url', '').strip()
    title = request.args.get('title', 'audio').strip()
    if not url:
        return jsonify({'error': 'missing url'}), 400
    filename = safe_filename(title, 'mp3')

    is_tiktok = 'tiktok.com' in url

    with tempfile.NamedTemporaryFile(delete=False, dir='/tmp') as tmp:
        tmp_path = tmp.name

    try:
        ydl_opts = {
            'format': 'best' if is_tiktok else 'bestaudio/best',
            'outtmpl': tmp_path + '.%(ext)s',
            'ffmpeg_location': os.path.dirname(FFMPEG),
            'quiet': True,
            'no_warnings': True,
            'postprocessors': [{'key': 'FFmpegExtractAudio', 'preferredcodec': 'mp3'}],
        }
        if is_tiktok:
            ydl_opts['extractor_args'] = {'tiktok': {'api_hostname': ['api22-normal-c-useast2a.tiktok.com']}}
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl.download([url])
    except Exception as e:
        for ext in ['.mp3', '.webm', '.m4a', '.opus', '.ogg', '']:
            p = tmp_path + ext
            if os.path.exists(p):
                os.unlink(p)
        return jsonify({'error': str(e)}), 500

    def generate():
        try:
            actual = tmp_path + '.mp3'
            with open(actual, 'rb') as f:
                while chunk := f.read(1024 * 256):
                    yield chunk
        finally:
            for ext in ['.mp3', '.webm', '.m4a', '.opus', '.ogg', '']:
                p = tmp_path + ext
                if os.path.exists(p):
                    os.unlink(p)

    return Response(
        generate(),
        mimetype='audio/mpeg',
        headers={
            'Content-Disposition': f'attachment; filename="{filename}"',
            'X-Accel-Buffering': 'no',
        }
    )


if __name__ == '__main__':
    app.run()
