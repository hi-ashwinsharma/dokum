import { app } from "./config";
import { getAI, getGenerativeModel, GoogleAIBackend } from "firebase/ai";

// Initialize the AI Logic service (Gemini Developer API)
const ai = getAI(app, { backend: new GoogleAIBackend() });

// Standard command generation schema instructions
const systemInstruction = `
You are Dokum's NLP PDF Command engine.
Analyze the user's prompt alongside the list of currently loaded workspace files.
Output a JSON object matching this schema:
{
  "actionRequired": boolean, // Set to true if a redirect/suggestion is needed or actions can be processed
  "redirection": "pdf-studio" | null, // If the user wants to perform multiple actions across different tools at once, redirect them to "pdf-studio"
  "message": "perform multiple ops at the same time, in pdf studio" | string, // Use exactly that string if redirecting. Otherwise, a brief success message.
  "commands": [
    {
      "action": "merge" | "rotate" | "split" | "numbers" | "delete",
      "fileName": string, // The name of the file to target
      "parameters": {
        // For rotate:
        "angle": 90 | 180 | 270,
        "pageIndex": number, // 0-based page index to rotate
        
        // For split:
        "pageRange": string, // Range of pages to extract (e.g. "1-3, 5")
        
        // For numbers:
        "position": "header" | "footer",
        
        // For merge:
        "mergeOrder": string[], // Array of fileNames in the requested order of merging
        "segments": [
          { "fileName": string, "range": string } // Specific pages to merge (e.g. range "1" or "5-7" or "last")
        ]
      }
    }
  ]
}

- Selecting specific page ranges to merge (e.g., 'merge page 1 of A and last page of B') is a single-tool action in the merge tool (using segments) and does NOT require redirection to PDF Studio.
- If the user is trying to perform multiple actions at once across different tools (e.g. rotate AND split, or add page numbers AND rotate) and redirection is needed, set:
  - redirection: "pdf-studio"
  - message: "perform multiple ops at the same time, in pdf studio"
  - actionRequired: true
  - commands: (empty or null)
`;

// Export the generative model configuration
export const commandModel = getGenerativeModel(ai, {
  model: "gemini-2.5-flash",
  generationConfig: {
    responseMimeType: "application/json",
  },
  systemInstruction,
});
