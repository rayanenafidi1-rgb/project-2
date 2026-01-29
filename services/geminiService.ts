
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { WasteAnalysis } from "../types";

// Always use process.env.API_KEY directly as a named parameter in the constructor
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function analyzeWaste(base64Image: string): Promise<WasteAnalysis> {
  // Using gemini-3-flash-preview for general vision/reasoning multimodal task
  const model = 'gemini-3-flash-preview';
  
  const prompt = `Analyze this image of waste and identify the primary material. 
  Determine if it is glass, plastic, paper, or cardboard. 
  Provide a percentage confidence for each category (summing to 1 or 100).
  Also provide a short, helpful recycling tip for this specific item.`;

  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      mainMaterial: {
        type: Type.STRING,
        description: "The primary detected material (e.g., 'Plastic', 'Glass', 'Paper', 'Cardboard')",
      },
      confidences: {
        type: Type.OBJECT,
        properties: {
          glass: { type: Type.NUMBER, description: "Confidence percentage (0-100)" },
          plastic: { type: Type.NUMBER, description: "Confidence percentage (0-100)" },
          paper: { type: Type.NUMBER, description: "Confidence percentage (0-100)" },
          cardboard: { type: Type.NUMBER, description: "Confidence percentage (0-100)" },
          other: { type: Type.NUMBER, description: "Confidence percentage (0-100)" },
        },
        required: ["glass", "plastic", "paper", "cardboard", "other"],
      },
      recyclingTip: {
        type: Type.STRING,
        description: "A short, actionable tip on how to recycle this item correctly.",
      },
      isRecyclable: {
        type: Type.BOOLEAN,
        description: "Whether the identified material is typically recyclable.",
      }
    },
    required: ["mainMaterial", "confidences", "recyclingTip", "isRecyclable"],
  };

  try {
    const result = await ai.models.generateContent({
      model: model,
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: "image/jpeg",
                data: base64Image.split(',')[1],
              },
            },
          ],
        },
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
    });

    // The result object has a 'text' property which returns the extracted string output.
    const text = result.text;
    if (!text) throw new Error("No response text from AI");
    
    return JSON.parse(text) as WasteAnalysis;
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
}
