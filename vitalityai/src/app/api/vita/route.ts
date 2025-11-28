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

    const client = new OpenAI({
      apiKey: apiKey,
    });

    const body = await req.json();
    const messages = body.messages || [];
    const userInfo = body.userInfo;

    let systemPrompt = `
      You are Vita, a friendly, supportive AI health coach.
      You remember previous messages and maintain context.
      Do NOT reintroduce yourself unless it's the first message.
      If the user references "that meal" or "that workout", infer meaning.
      Keep answers short, helpful, and conversational.
    `;

    if (userInfo) {
      systemPrompt += `
        Here is the user's information:
        Age: ${userInfo.age}
        Height: ${userInfo.height} cm
        Weight: ${userInfo.weight} kg
        Goal: ${userInfo.goal}
        Activity Level: ${userInfo.activity}
        Sleep: ${userInfo.sleep} hours/night
        
        Tailor your advice based on this information.
      `;
    }

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        ...messages,
      ],
    });

    return NextResponse.json({
      reply: response.choices[0].message.content,
    });
  } catch (error: any) {
    console.error("Error in /api/vita:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
