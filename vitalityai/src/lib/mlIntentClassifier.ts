import rawModelData from "../../ml/vita_intent_model.json";

export type IntentLabel =
  | "general"
  | "workout"
  | "nutrition"
  | "weight_loss"
  | "muscle_gain"
  | "supplements"
  | "recovery"
  | "beginner"
  | "cardio"
  | "lifestyle";

// Describe the JSON model structure
interface ModelData {
  vocabulary: Record<string, number>;
  idf: number[];
  classes: string[];       // JSON stores strings, not union types
  coef: number[][];
  intercept: number[];
}

// Tell TypeScript to treat the JSON as this structure
const modelData = rawModelData as ModelData;

// Cast JSON "classes" string[] → IntentLabel[]
const vocabulary: Record<string, number> = modelData.vocabulary;
const idf: number[] = modelData.idf;
const classes: IntentLabel[] = modelData.classes.map((c) => c as IntentLabel);
const coef: number[][] = modelData.coef;
const intercept: number[] = modelData.intercept;

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

export function predictIntentWithML(
  text: string
): { intent: IntentLabel; confidence: number } {
  const tokens = tokenize(text);

  const termCounts: Record<string, number> = {};
  for (const t of tokens) {
    termCounts[t] = (termCounts[t] || 0) + 1;
  }

  const numFeatures = idf.length;
  const features: Record<number, number> = {};

  // Build tf * idf sparse vector
  for (const [term, count] of Object.entries(termCounts)) {
    const idx = vocabulary[term];
    if (typeof idx === "number" && idx < numFeatures) {
      const tf = count;
      features[idx] = tf * idf[idx];
    }
  }

  // Compute raw scores for each class
  const scores: number[] = [];

  for (let k = 0; k < classes.length; k++) {
    let score = intercept[k];
    const weights = coef[k];

    for (const [jStr, xj] of Object.entries(features)) {
      const j = Number(jStr);
      score += weights[j] * xj;
    }

    scores.push(score);
  }

  // Find best score index
  let bestIndex = 0;
  let bestScore = scores[0];

  for (let i = 1; i < scores.length; i++) {
    if (scores[i] > bestScore) {
      bestScore = scores[i];
      bestIndex = i;
    }
  }

  // Convert raw scores → softmax confidence
  const maxScore = bestScore;
  const exps = scores.map((s) => Math.exp(s - maxScore)); // numerical stability
  const sumExp = exps.reduce((a, b) => a + b, 0);
  const probs = exps.map((e) => e / sumExp);
  const confidence = probs[bestIndex];

  return {
    intent: classes[bestIndex],
    confidence,
  };
}
