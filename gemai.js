require('dotenv').config();
const GoogleGenAI = require('@google/genai').GoogleGenAI;

const ai = new GoogleGenAI({apiKey:process.env.GEMINI_API_KEY});
const gem=async(texting)=>{ 
    const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `${texting}`,
    config: {
      thinkingConfig: {
        thinkingBudget: 0, 
      }}
  });
    return response;
}

module.exports =gem;