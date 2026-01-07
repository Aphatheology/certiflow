import { GoogleGenAI } from "@google/genai";

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const ai = new GoogleGenAI({
  apiKey: GEMINI_API_KEY,
});

/**
 * Generates a certificate background template using Gemini Imagen model.
 */
export const generateCertificateTemplate = async (
  prompt: string
): Promise<string> => {
  if (!GEMINI_API_KEY) {
    throw new Error(
      "API Key is missing. Please configure VITE_GEMINI_API_KEY in .env"
    );
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: {
        parts: [
          {
            text: `Design a professional, empty certificate background template. 
            Style: ${prompt}. 
            Do not include any placeholder text like 'Name' or 'Date'. 
            The center should be spacious for text overlay. 
            High resolution, clean borders, elegant design.`,
          },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: "4:3",
        },
      },
    });

    // Iterate through parts to find the image
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        const base64EncodeString = part.inlineData.data;
        return `data:image/png;base64,${base64EncodeString}`;
      }
    }

    throw new Error("No image data found in response");
  } catch (error) {
    console.error("Gemini Image Generation Error:", error);
    throw error;
  }
};
