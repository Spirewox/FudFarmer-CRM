import { GoogleGenAI, Type } from "@google/genai";
import { Sentiment } from "../types";

const apiKey = process.env.API_KEY || ''; // In a real app, ensure this is set safely.
const ai = new GoogleGenAI({ apiKey });

const modelName = 'gemini-2.5-flash';

export const GeminiService = {
  /**
   * Analyzes the sentiment of a customer feedback/complaint.
   */
  analyzeSentiment: async (text: string): Promise<Sentiment> => {
    if (!apiKey) return Sentiment.NEUTRAL;

    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: `Analyze the sentiment of this text: "${text}". Return one word only: Positive, Neutral, or Negative.`,
      });
      
      const result = response.text?.trim();
      
      if (result?.toLowerCase().includes('positive')) return Sentiment.POSITIVE;
      if (result?.toLowerCase().includes('negative')) return Sentiment.NEGATIVE;
      return Sentiment.NEUTRAL;
    } catch (error) {
      console.error("Gemini Sentiment Error:", error);
      return Sentiment.NEUTRAL;
    }
  },

  /**
   * Generates a draft email response for an enquiry.
   */
  draftResponse: async (customerName: string, message: string): Promise<string> => {
    if (!apiKey) return "AI service unavailable. Please write response manually.";

    try {
      const prompt = `
        You are a helpful customer service agent for FudFarmer, a food business in Lagos and Ife selling preserved protein and food stuff.
        Write a polite, professional, and concise email response to:
        Customer: ${customerName}
        Enquiry: "${message}"
        
        Focus on being helpful and inviting.
      `;

      const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
      });

      return response.text || "Could not generate response.";
    } catch (error) {
      console.error("Gemini Draft Error:", error);
      return "Error generating draft.";
    }
  },

  /**
   * Scores a B2B lead based on notes.
   */
  scoreLead: async (notes: string, businessName: string): Promise<{ score: number; insight: string }> => {
    if (!apiKey) return { score: 50, insight: "AI Scoring unavailable" };

    try {
        const response = await ai.models.generateContent({
            model: modelName,
            contents: `
                Evaluate this B2B lead for a food supply business.
                Business: ${businessName}
                Notes: ${notes}
                
                Return JSON with:
                - score (integer 0-100, where 100 is high value/probability)
                - insight (string, max 20 words explanation)
            `,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        score: { type: Type.INTEGER },
                        insight: { type: Type.STRING }
                    }
                }
            }
        });

        const json = JSON.parse(response.text || '{}');
        return {
            score: json.score || 50,
            insight: json.insight || "No insight available"
        };
    } catch (error) {
        console.error("Gemini Lead Score Error:", error);
        return { score: 50, insight: "Error processing lead" };
    }
  }
};
