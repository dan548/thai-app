#!/usr/bin/env python3
"""
Скачивает субтитры (транскрипции) роликов с ютуба в папку transcripts/.
Из этих файлов вы вместе с Claude вычленяете тайские слова/фразы и заносите их
в базу как слова видео (source='video'), после чего они всплывают в приложении.

Зачем скрипт: приложение и Claude в сессии не имеют доступа к ютубу
(закрыто сетевой политикой), поэтому транскрипции собираются на своей машине.

Как пользоваться:
  1. Поставить Python 3 и библиотеку:
       pip install youtube-transcript-api
  2. Запустить из корня проекта:
       python scripts/fetch_transcripts.py
  3. В папке transcripts/ появятся файлы <номер>_<id>.txt.
     Пришли их Claude (или скопируй текст в чат) — я разберу слова по видео.

Если у ролика нет тайских субтитров — берём английские авто-субтитры,
из них всё равно видно, какие фразы разбираются в видео.
"""

import os
import sys

# Те же 12 роликов, что и в приложении (lib/data.js → VIDEOS).
VIDEOS = [
    ("vpGdD9fgWsw", "The First 10 Thai Words You Must Know!"),
    ("RJGG9hOJOVo", "20 First-to-Know Thai Language Verbs"),
    ("Vrgeac31-Cw", "Ways to call yourself and others in Thai"),
    ("Y9gUTvhaVLI", "Basic Thai Language Grammar Rules!"),
    ("DBxro6aGCPk", "Thai ways to ending sentences"),
    ("fhcDc8Ge1d4", "Thai sentences based on English Tense"),
    ("RSlSpcaq9M0", "How to make questions in Thai"),
    ("Let5JPI2R0I", "What to say to motorcycle taxis"),
    ("u4af2z4sPq4", "What to say to a taxi driver"),
    ("nBeMnQZ_Knk", "How to order food in Thailand"),
    ("KRdLsDmiUpg", "How to order drinks in Thailand"),
    ("FSZFYNNYh38", "Counting in Thai — Numbers 1-10"),
]

# Языки в порядке предпочтения: тайский, потом английский (в т.ч. авто).
LANGS = ["th", "en"]

OUT_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "transcripts")


def fetch_one(video_id):
    """Возвращает список строк субтитров или бросает исключение."""
    try:
        # Новый API (youtube-transcript-api >= 1.0)
        from youtube_transcript_api import YouTubeTranscriptApi
        api = YouTubeTranscriptApi()
        fetched = api.fetch(video_id, languages=LANGS)
        return [snippet.text for snippet in fetched]
    except (ImportError, AttributeError, TypeError):
        # Старый API (youtube-transcript-api < 1.0)
        from youtube_transcript_api import YouTubeTranscriptApi
        data = YouTubeTranscriptApi.get_transcript(video_id, languages=LANGS)
        return [row["text"] for row in data]


def main():
    try:
        import youtube_transcript_api  # noqa: F401
    except ImportError:
        print("Не установлена библиотека. Выполни:\n  pip install youtube-transcript-api")
        sys.exit(1)

    os.makedirs(OUT_DIR, exist_ok=True)
    ok, failed = 0, []
    for i, (vid, title) in enumerate(VIDEOS, start=1):
        try:
            lines = fetch_one(vid)
            text = "\n".join(lines)
            path = os.path.join(OUT_DIR, f"{i:02d}_{vid}.txt")
            with open(path, "w", encoding="utf-8") as f:
                f.write(f"# Видео {i}: {title}\n")
                f.write(f"# https://www.youtube.com/watch?v={vid}\n\n")
                f.write(text)
            print(f"[OK]   Видео {i:2d}  {vid}  → {os.path.relpath(path)}  ({len(lines)} строк)")
            ok += 1
        except Exception as e:  # noqa: BLE001
            print(f"[SKIP] Видео {i:2d}  {vid}  — нет субтитров? ({type(e).__name__})")
            failed.append((i, vid, title))

    print(f"\nГотово: {ok}/{len(VIDEOS)} роликов. Файлы в: {OUT_DIR}")
    if failed:
        print("Без субтитров (открой вручную «Показать текст видео» на ютубе и пришли текст):")
        for i, vid, title in failed:
            print(f"  Видео {i}: {title} — https://www.youtube.com/watch?v={vid}")


if __name__ == "__main__":
    main()
