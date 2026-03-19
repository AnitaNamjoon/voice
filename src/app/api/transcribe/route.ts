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

import { NextRequest, NextResponse } from "next/server"; // They come from Next.js, it handles HTTP requests and send responses
import { AssemblyAI } from "assemblyai";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";

interface TranscriptionResponse {
  url: string;
  transcription: string;

}

export async function POST(req: NextRequest): Promise<NextResponse<TranscriptionResponse | { error: string; }>> {
  try { //error handling 
    const { url, language, fileId } = await req.json();

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "Valid audio URL is required" }, { status: 400 });
    }

    const apiKey = process.env.ASSEMBLYAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: "AssemblyAI API key not configured" }, { status: 500 });
    }

    const cleanUrl = url.split("?")[0];

    const client = new AssemblyAI({
      apiKey: apiKey,
    });

    // language_code and language_detection cannot exist together like at the same time so you must choose one of them 
    const transcriptParams: Parameters<typeof client.transcripts.transcribe>[0] =
      language && typeof language === "string" //Checking if a language was provided 
        ? {
          audio: cleanUrl,
          speech_models: ["universal-2"],
          language_code: language,
          speaker_labels: true,
          speakers_expected: 2,
        }
        : {
          // No language: let AssemblyAI auto-detect
          audio: cleanUrl,
          speech_models: ["universal-2"],
          language_detection: true,
          speaker_labels: true,
          speakers_expected: 2,
        };

    const transcript = await client.transcripts.transcribe(transcriptParams);

    let transcription = "";
    if (transcript.utterances && transcript.utterances.length > 0) {
      transcription = transcript.utterances
        .map((utterance) => `Speaker ${utterance.speaker}: ${utterance.text}`)
        .join("\n\n");
    } else {
      transcription = transcript.text || "";
    }


    // mutation from convex
    if (!fileId) {
      return NextResponse.json({
        error: "Missing fileId. Please upload a new file.",
      }, { status: 400 });
    }

    try {
      if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
        throw new Error("NEXT_PUBLIC_CONVEX_URL is not set in environment");
      }
      const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);
      await convex.mutation(api.files.updateTranscription, {
        fileId: fileId as Id<"files">,
        transcription: transcription,
      });
    } catch (err: any) {
      console.error("Mutation failed:", err);
      return NextResponse.json({
        error: "Failed to update transcription in database",
        details: err.message || String(err),
      }, { status: 500 });
    }

    return NextResponse.json({
      url: cleanUrl,
      transcription: transcription,
    });
  } catch (error) {
    console.error("[/api/transcribe] Error:", error);
    return NextResponse.json(
      {
        error: "Transcription request failed",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}