// Use Server
// import axios
//Set up API key  from the .env
// Define your headers - Set up authorization and content type
// Set up Function  - dont forget to export  
// Submit transcription request 
// const transcript =  await  axios.post (url, )
// do not console log  instead return {
// url: file.ufsUrl,
//};

import { NextRequest, NextResponse } from "next/server";
import { AssemblyAI } from "assemblyai";

interface TranscriptionResponse {
  url: string;
  transcription: string;
  detectedLanguage?: string;
}

// Language codes used by AssemblyAI detection → MyMemory langpair source
const LANG_LABEL: Record<string, string> = {
  en: "English",
  fr: "French",
  de: "German",
  sw: "Swahili",
};

/**
 * Translate a block of text to the target language using the MyMemory free API.
 * Returns the original text if translation fails or the language is already correct.
 */
async function translateText(text: string, targetLang: string): Promise<string> {
  if (!text.trim()) return text;

  // MyMemory supports up to ~500 chars per request; chunk if needed
  const MAX_CHARS = 450;

  if (text.length <= MAX_CHARS) {
    return callMyMemory(text, targetLang);
  }

  // Split on double-newline (speaker boundaries) to keep speaker labels intact
  const segments = text.split("\n\n");
  const translated: string[] = [];

  for (const segment of segments) {
    translated.push(await callMyMemory(segment, targetLang));
  }

  return translated.join("\n\n");
}

async function callMyMemory(text: string, targetLang: string): Promise<string> {
  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|${targetLang}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
    if (!res.ok) return text;
    const data = await res.json();
    const translated: string = data?.responseData?.translatedText ?? text;
    // MyMemory returns the original text unchanged when it can't translate
    return translated || text;
  } catch {
    return text; // graceful fallback
  }
}

export async function POST(
  req: NextRequest
): Promise<NextResponse<TranscriptionResponse | { error: string; details?: string }>> {
  try {
    const { url, language } = await req.json();

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "Valid audio URL is required" }, { status: 400 });
    }

    const apiKey = process.env.ASSEMBLYAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "AssemblyAI API key not configured" }, { status: 500 });
    }

    const cleanUrl = url.split("?")[0];

    const client = new AssemblyAI({ apiKey });

    // Always auto-detect the spoken language; translation happens after
    const transcript = await client.transcripts.transcribe({
      audio: cleanUrl,
      speech_models: ["universal"],
      language_detection: true,
      speaker_labels: true,
      speakers_expected: 2,
    });

    // Build the raw transcription string (preserve speaker labels)
    let rawTranscription = "";
    if (transcript.utterances && transcript.utterances.length > 0) {
      rawTranscription = transcript.utterances
        .map((u) => `Speaker ${u.speaker}: ${u.text}`)
        .join("\n\n");
    } else {
      rawTranscription = transcript.text ?? "";
    }

    const detectedLanguage = transcript.language_code ?? "en";

    // Translate only when the target differs from the detected/source language
    let finalTranscription = rawTranscription;
    const targetLang = language && typeof language === "string" ? language : "en";

    if (targetLang !== "en" && targetLang !== detectedLanguage) {
      finalTranscription = await translateText(rawTranscription, targetLang);
    }

    return NextResponse.json({
      url: cleanUrl,
      transcription: finalTranscription,
      detectedLanguage: LANG_LABEL[detectedLanguage] ?? detectedLanguage,
    });
  } catch (error) {
    console.error("[/api/transcribe] Error:", error);
    return NextResponse.json(
      {
        error: "Transcription request failed",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}