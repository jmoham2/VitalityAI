import { NextResponse } from "next/server";
import OpenAI from "openai";
import { predictIntentWithML, IntentLabel } from "@/lib/mlIntentClassifier";

function isMessageTooShort(text: string): boolean {
  const cleaned = text.trim().toLowerCase();
  if (!cleaned) return true;

  const shortReplies = [
    "ok",
    "k",
    "yes",
    "yeah",
    "yup",
    "no",
    "nah",
    "thanks",
    "thank you",
    "got it",
    "cool",
    "sure",
    "alright",
  ];

  if (shortReplies.includes(cleaned)) return true;

  const tokens = cleaned.split(/\s+/);
  if (tokens.length <= 1 && cleaned.length < 4) return true;

  return false;
}

function getDefaultIntentFromOnboarding(userInfo: any | null): IntentLabel {
  if (!userInfo) return "general";

  const mainIntent = (userInfo.mainIntent || "").trim();

  // If they didn't give a main intent, just go general
  if (!mainIntent || mainIntent.length < 3) {
    return "general";
  }

  const { intent } = predictIntentWithML(mainIntent);
  return intent ?? "general";
}


const INTENT_PROMPTS: Record<IntentLabel, string> = {
  general: `
You are a balanced, all round fitness coach.
Answer with a mix of training, nutrition, and habit advice based on what the user asks.
Avoid going too deep into a niche unless the user clearly wants that.
`,

  workout: `
Prioritise training advice.
Talk about exercises, sets, reps, tempo, rest times, progression, and weekly structure.
Give simple, concrete workouts and mention warm ups and basic safety.
Avoid detailed meal plans unless the user explicitly asks about food.
`,

  nutrition: `
Prioritise food and nutrition.
Talk about calories, protein, carbs, fats, fibre, and hydration in simple terms.
Give easy, realistic meal and snack ideas instead of strict meal plans.
Do not give medical nutrition advice or treat health conditions.
`,

  weight_loss: `
Assume the user mainly wants sustainable fat loss.
Emphasise calorie awareness, protein intake, step count, sleep, and realistic habits.
Discourage crash diets or extreme methods.
Always frame suggestions as supportive and sustainable, not shame based.
`,

  muscle_gain: `
Assume the user mainly wants to build muscle.
Focus on progressive overload, hitting major muscle groups at least two times per week, and eating enough protein and calories.
Explain in simple language how to combine training and food for hypertrophy.
Avoid promising instant results.
`,

  supplements: `
Assume the user is mainly curious about supplements.
Keep advice conservative and safety first.
Focus on common, low risk basics such as protein powder, creatine, or caffeine and always mention that supplements are optional.
Do not give medical advice or recommend anything that treats diseases.
`,

  recovery: `
Prioritise rest, recovery, and managing soreness.
Talk about sleep, light movement, stretching, deloads, and listening to pain signals.
You can suggest when to rest versus train lighter, but never diagnose injuries or replace a doctor or physio.
`,

  beginner: `
Assume the user is new to fitness.
Explain concepts in very simple language and avoid heavy jargon.
Focus on building confidence, starting small, and forming habits rather than perfection.
Reassure them that it is okay to start slowly and make mistakes.
`,

  cardio: `
Assume the user is mainly interested in cardio and conditioning.
Talk about walking, running, cycling, intervals, and weekly structure.
Help them build endurance progressively and avoid doing too much too soon.
`,

  lifestyle: `
Assume the user mostly needs help with routines, motivation, and fitting health into daily life.
Emphasise sleep, stress, daily movement, environment, and mindset.
Use a very encouraging, low pressure tone.
Focus on realistic changes that fit their schedule.
`,
};

export async function POST(req: Request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "OpenAI API key not configured" },
        { status: 500 },
      );
    }

    const client = new OpenAI({ apiKey });

    const body = await req.json();
    const messages = body.messages || [];
    const userInfo = body.userInfo;

    const lastUserMessage = [...messages]
      .reverse()
      .find((m: any) => m.role === "user");

    const defaultIntent: IntentLabel = getDefaultIntentFromOnboarding(userInfo);

    let intent: IntentLabel = defaultIntent;
    let confidenceUsed = 1;

    if (lastUserMessage && lastUserMessage.content) {
      const text = String(lastUserMessage.content);

      if (!isMessageTooShort(text)) {
        const { intent: messageIntent, confidence } = predictIntentWithML(text);

        const THRESHOLD = 0.55;

        if (confidence >= THRESHOLD) {
          intent = messageIntent;
          confidenceUsed = confidence;
        } 
      }
    }

    console.log("Vita intent", {
      defaultIntent,
      finalIntent: intent,
      confidenceUsed,
    });

    const basePrompt = `
    Your name is Vita, a friendly, supportive AI health coach.
    You remember previous messages and maintain context from the whole conversation.
    Do not reintroduce yourself unless it is clearly the first message.
    If the user references that meal or that workout, infer what they mean from context.
    Keep answers Very Very short and not long, helpful, and conversational.
    Always treat this as one continuous chat with the same user, even if intent changes.
    `;

    const intentPrompt = INTENT_PROMPTS[intent] ?? INTENT_PROMPTS.general;

    let systemPrompt = `
${basePrompt}

User long term focus (from onboarding): "${userInfo?.mainIntent || userInfo?.goal || "not specified"}".
Default intent from onboarding: ${defaultIntent}.
Current message intent after ML and confidence filter: ${intent}.

You must follow these intent specific guidelines:
${intentPrompt}
`;

    if (userInfo) {
      systemPrompt += `
User information:
Age: ${userInfo.age}
Height: ${userInfo.height} cm
Weight: ${userInfo.weight} kg
Goal: ${userInfo.goal}
Activity level: ${userInfo.activity}
Sleep: ${userInfo.sleep} hours per night

Use this context to tailor your advice, but do not repeat it in every answer.
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
      intent,
      defaultIntent,
      confidence: confidenceUsed,
    });
  } catch (error: any) {
    console.error("Error in /api/vita:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 },
    );
  }
}
