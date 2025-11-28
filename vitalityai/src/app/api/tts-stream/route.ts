import { OpenAI } from "openai";
import { NextResponse } from "next/server";

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
      input: text,
    });

    return new Response(response.body, {
      headers: {
        "Content-Type": "audio/mpeg",
      },
    });
  } catch (error: any) {
    console.error("Error in /api/tts-stream:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
