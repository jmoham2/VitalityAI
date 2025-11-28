import { NextResponse } from "next/server";
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  const body = await req.json();
  const messages = body.messages || [];

  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `
          You are Vita, a friendly, supportive AI health coach.
          You remember previous messages and maintain context.
          Do NOT reintroduce yourself unless it's the first message.
          If the user references "that meal" or "that workout", infer meaning.
          Keep answers short, helpful, and conversational.
        `,
      },
      ...messages,
    ],
  });

  return NextResponse.json({
    reply: response.choices[0].message.content,
  });
}
