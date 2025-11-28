import { OpenAI } from "openai";
import { NextResponse } from "next/server";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!, // or OPENAI_KEY if you prefer
});

export async function POST(req: Request) {
  const { text } = await req.json();

  const response = await client.responses.create({
    model: "gpt-4o-mini-tts",
    input: text,
    audio: {
      voice: "alloy",
      format: "mp3",
    },
  });

  const stream = new ReadableStream({
    async start(controller) {
      for await (const event of response) {
        if (event.type === "response.output_audio.delta") {
          const chunk = Buffer.from(event.delta, "base64");
          controller.enqueue(chunk);
        }
      }
      controller.close();
    },
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "audio/mpeg",
    },
  });
}
