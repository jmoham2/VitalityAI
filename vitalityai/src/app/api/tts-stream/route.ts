import { NextResponse } from "next/server";
import { OpenAI } from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
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
    stream: true,
  });

  const stream = new ReadableStream({
    async start(controller) {
      for await (const event of response) {
        if (event.type === "response.audio.delta") {
          controller.enqueue(Buffer.from(event.delta, "base64"));
        }

        if (event.type === "response.audio.done") {
          controller.close();
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "audio/mpeg",
      "Transfer-Encoding": "chunked",
    },
  });
}
