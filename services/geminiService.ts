import { GoogleGenAI, Type, Schema } from "@google/genai";
import { ReminderData } from "../types";

// Define the JSON schema for the response
const REMINDER_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    reminder_content: {
      type: Type.STRING,
      description: "A concise, action-oriented summary of the reminder",
    },
    scheduled_time: {
      type: Type.STRING,
      description: "The extracted date and time in ISO 8601 UTC format (YYYY-MM-DDTHH:MM:SSZ)",
    },
    confidence_score: {
      type: Type.NUMBER,
      description: "A float number between 0.0 and 1.0 (1.0 is highest certainty)",
    },
  },
  required: ["reminder_content", "scheduled_time", "confidence_score"],
};

const SYSTEM_INSTRUCTION = `
You are a highly specialized and precise **Time and Reminder Parsing Agent**. Your sole, critical function is to analyze the provided user text (or audio transcription), and accurately extract two required parameters: the final reminder content, and the exact scheduled date and time.

### ABSOLUTE OUTPUT RULES
1.  **Date/Time Format:** The 'scheduled_time' value must be in the strict, absolute **ISO 8601 UTC** format (e.g., YYYY-MM-DDTHH:MM:SSZ).
2.  **Time Resolution:** You MUST resolve all relative time phrases (e.g., "tomorrow," "in 5 minutes," "next Friday") into an absolute timestamp using the provided NOW reference and User Timezone.
3.  **Error Handling:** If the input text is ambiguous, impossible to schedule (e.g., "Hello"), or missing a date/time component, you must set the 'scheduled_time' to an empty string ("") and the 'confidence_score' below 0.5.
`;

export const parseInput = async (
  input: string | { data: string; mimeType: string }
): Promise<{ data: ReminderData; rawText: string }> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found in environment variables");
  }

  const ai = new GoogleGenAI({ apiKey });
  const now = new Date();
  const currentUtc = now.toISOString();
  const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const contextPrompt = `
### CONTEXT FOR TIME RESOLUTION
* **NOW Reference (Current UTC Time):** ${currentUtc}
* **User Timezone:** ${userTimezone}

### TASK
Process the user input provided and return the JSON object.
  `;

  try {
    const modelId = "gemini-2.5-flash";
    
    let contents: any;

    if (typeof input === 'string') {
      // Text Input
      contents = [
        { text: contextPrompt },
        { text: `[USER_INPUT]: ${input}` }
      ];
    } else {
      // Audio Input (Multimodal)
      contents = [
        { text: contextPrompt },
        { text: "The following is an audio recording of the reminder. Transcribe and process it." },
        {
          inlineData: {
            mimeType: input.mimeType,
            data: input.data,
          }
        }
      ];
    }

    const response = await ai.models.generateContent({
      model: modelId,
      contents: { parts: contents },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: REMINDER_SCHEMA,
        temperature: 0.1, // Low temperature for precision
      },
    });

    const responseText = response.text;
    
    if (!responseText) {
      throw new Error("No response from Gemini");
    }

    const parsedData = JSON.parse(responseText) as ReminderData;
    
    // If audio input, we don't have the "raw text" easily available unless we ask for it.
    // For simplicity in this specific agent task, we assume the result is what matters.
    // However, to fill the 'originalInput' in history, if it was audio, we might want a transcript.
    // But the prompt requested strictly JSON output. We will return a placeholder for audio transcript.
    const rawText = typeof input === 'string' ? input : "(Audio Transcription handled by AI)";

    return { data: parsedData, rawText };

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};
