import { NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(req: Request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "OpenAI API key not configured" },
        { status: 500 }
      );
    }
    const client = new OpenAI({ apiKey });

    const { text } = await req.json();

    const response = await client.audio.speech.create({
      model: "tts-1",
      voice: "alloy",
      response_format: "mp3",
      input: text,
    });

    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = Buffer.from(arrayBuffer);

    return new NextResponse(audioBuffer, {
      headers: {
        "Content-Type": "audio/mpeg",
      },
    });
  } catch (error: any) {
    console.error("Error in /api/tts:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
