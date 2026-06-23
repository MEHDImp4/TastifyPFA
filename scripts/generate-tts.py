"""Generate TTS audio for demo captions using Gemini API.

Usage:
  python scripts/generate-tts.py --api-key KEY --captions-json '...'
  python scripts/generate-tts.py --api-key KEY --captions-file captions.json
"""

import argparse
import json
import os
import struct
import sys
import time
from pathlib import Path

from google import genai
from google.genai import types


def parse_audio_mime_type(mime_type: str) -> dict:
    bits_per_sample = 16
    rate = 24000
    parts = mime_type.split(";")
    for param in parts:
        param = param.strip()
        if param.lower().startswith("rate="):
            try:
                rate = int(param.split("=", 1)[1])
            except (ValueError, IndexError):
                pass
        elif param.startswith("audio/L"):
            try:
                bits_per_sample = int(param.split("L", 1)[1])
            except (ValueError, IndexError):
                pass
    return {"bits_per_sample": bits_per_sample, "rate": rate}


def convert_to_wav(audio_data: bytes, mime_type: str) -> bytes:
    params = parse_audio_mime_type(mime_type)
    bits_per_sample = params["bits_per_sample"]
    sample_rate = params["rate"]
    num_channels = 1
    data_size = len(audio_data)
    bytes_per_sample = bits_per_sample // 8
    block_align = num_channels * bytes_per_sample
    byte_rate = sample_rate * block_align
    chunk_size = 36 + data_size

    header = struct.pack(
        "<4sI4s4sIHHIIHH4sI",
        b"RIFF",
        chunk_size,
        b"WAVE",
        b"fmt ",
        16,
        1,
        num_channels,
        sample_rate,
        byte_rate,
        block_align,
        bits_per_sample,
        b"data",
        data_size,
    )
    return header + audio_data


def generate_tts_segment(client, text, voice_name="Zephyr"):
    """Generate TTS audio for a single text segment."""
    contents = [
        types.Content(
            role="user",
            parts=[types.Part.from_text(text=text)],
        ),
    ]
    config = types.GenerateContentConfig(
        temperature=1,
        response_modalities=["audio"],
        speech_config=types.SpeechConfig(
            voice_config=types.VoiceConfig(
                prebuilt_voice_config=types.PrebuiltVoiceConfig(
                    voice_name=voice_name
                )
            )
        ),
    )

    audio_chunks = []
    for chunk in client.models.generate_content_stream(
        model="gemini-3.1-flash-tts-preview",
        contents=contents,
        config=config,
    ):
        if chunk.parts is None:
            continue
        if chunk.parts[0].inline_data and chunk.parts[0].inline_data.data:
            audio_chunks.append(chunk.parts[0].inline_data)
        elif text := getattr(chunk, "text", None):
            print(f"  TTS text: {text}")

    if not audio_chunks:
        raise RuntimeError(f"No audio generated for: {text[:50]}")

    raw_audio = b"".join(c.data for c in audio_chunks)
    mime_type = audio_chunks[0].mime_type
    return convert_to_wav(raw_audio, mime_type)


def build_full_audio(captions, audio_paths, sample_rate=24000, sample_width=2):
    """Combine audio segments at correct timestamps into one WAV file.

    Each audio segment is placed at its start time offset. Overlapping
    segments are mixed together. Returns the full audio as WAV bytes.
    """
    total_duration = max(end for _, end, _ in captions)
    total_samples = int(total_duration * sample_rate)
    mix_buf = bytearray(total_samples * sample_width)

    for i, (start, end, _) in enumerate(captions):
        wav_path = audio_paths[i]
        with open(wav_path, "rb") as f:
            wav_data = f.read()

        # Skip WAV header (44 bytes for PCM)
        audio_data = wav_data[44:]
        seg_samples = len(audio_data) // sample_width
        offset_samples = int(start * sample_rate)

        for j in range(seg_samples):
            idx = offset_samples + j
            if idx >= total_samples:
                break
            pos = idx * sample_width
            existing = int.from_bytes(mix_buf[pos : pos + sample_width], "little", signed=True)
            addition = int.from_bytes(audio_data[j * sample_width : (j + 1) * sample_width], "little", signed=True)
            mixed = max(-32768, min(32767, existing + addition))
            mix_buf[pos : pos + sample_width] = mixed.to_bytes(2, "little", signed=True)

    data_size = len(mix_buf)
    chunk_size = 36 + data_size
    header = struct.pack(
        "<4sI4s4sIHHIIHH4sI",
        b"RIFF", chunk_size, b"WAVE",
        b"fmt ", 16, 1, 1, sample_rate,
        sample_rate * sample_width, sample_width, sample_width * 8,
        b"data", data_size,
    )
    return header + bytes(mix_buf)


def main():
    parser = argparse.ArgumentParser(description="Generate TTS audio for demo captions")
    parser.add_argument("--api-key", required=True, help="Gemini API key")
    parser.add_argument("--voice", default="Zephyr", help="TTS voice name")
    parser.add_argument("--captions-file", help="JSON file with captions array")
    parser.add_argument("--captions-json", help="Inline JSON captions array")
    parser.add_argument("--output-dir", default="docs/demo-videos/tts", help="Output directory")
    parser.add_argument("--output", default="docs/demo-videos/tts-audio.wav", help="Final combined audio file")
    args = parser.parse_args()

    if args.captions_json:
        captions = json.loads(args.captions_json)
    elif args.captions_file:
        with open(args.captions_file) as f:
            captions = json.load(f)
    else:
        captions = [
            [0, 20, "Tastify centralise le parcours restaurant: client, salle, cuisine, paiement et avis."],
            [20, 55, "Le portail client présente la carte, les catégories et les plats appréciés."],
            [55, 95, "Le gérant suit les revenus, les commandes, le stock et les retours clients."],
            [95, 145, "Le serveur sélectionne une table, ajoute des plats et envoie la commande en cuisine."],
            [145, 185, "La cuisine reçoit la commande dans le KDS et met à jour son avancement."],
            [185, 225, "Le paiement simulé par QR ou lien sécurisé clôture la commande."],
            [225, 265, "Le client se connecte et laisse un avis analysé par le système."],
            [265, 288, "La commande est payée, la table est libérée et les données remontent au dashboard."],
        ]

    out_dir = Path(args.output_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    client = genai.Client(api_key=args.api_key)
    audio_paths = []

    print(f"Generating {len(captions)} TTS segments...")
    for i, (start, end, text) in enumerate(captions):
        seg_path = out_dir / f"segment_{i:02d}.wav"
        if seg_path.exists():
            print(f"  [{i+1}/{len(captions)}] Using cached: {text[:50]}...")
            audio_paths.append(str(seg_path))
            continue
        
        max_retries = 3
        retry_delay = 62  # seconds to clear the 1-minute window safely
        for attempt in range(max_retries):
            try:
                if attempt > 0:
                    print(f"  [{i+1}/{len(captions)}] Generating (Attempt {attempt+1}/{max_retries}): {text[:50]}...")
                else:
                    print(f"  [{i+1}/{len(captions)}] Generating: {text[:50]}...")
                
                wav_data = generate_tts_segment(client, text, args.voice)
                seg_path.write_bytes(wav_data)
                audio_paths.append(str(seg_path))
                break
            except Exception as e:
                err_str = str(e)
                if "RESOURCE_EXHAUSTED" in err_str or "429" in err_str:
                    print(f"  [Rate Limit] Quota exceeded. Waiting {retry_delay}s to refresh quota window before retrying...")
                    time.sleep(retry_delay)
                else:
                    raise e
        else:
            raise RuntimeError(f"Failed to generate TTS segment {i} after {max_retries} attempts due to rate limit.")

    print("Combining audio segments...")
    full_audio = build_full_audio(captions, audio_paths)

    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_bytes(full_audio)
    print(f"Done: {output_path}")


if __name__ == "__main__":
    main()
