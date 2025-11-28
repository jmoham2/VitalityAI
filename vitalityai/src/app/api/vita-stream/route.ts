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

    const { messages } = await req.json();

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
      stream: true,
    });

    const stream = new ReadableStream({
      async start(controller) {
        for await (const chunk of response) {
          const content = chunk.choices[0]?.delta?.content || "";
          if (content) {
            controller.enqueue(new TextEncoder().encode(content));
          }
        }
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
  } catch (error: any) {
    console.error("Error in /api/vita-stream:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
