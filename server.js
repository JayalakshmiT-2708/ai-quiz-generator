import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// Serve static frontend files
app.use(express.static(path.join(__dirname, 'public')));

// Initialize Gemini Client
const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

app.post('/api/quiz/generate', async (req, res) => {
  try {
    const { topic } = req.body;
    
    if (!topic || topic.trim() === '') {
      return res.status(400).json({ success: false, error: 'Topic is required' });
    }

    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_google_gemini_api_key_here') {
      return res.status(500).json({ success: false, error: 'Gemini API key is missing. Please add it to the .env file.' });
    }

    const promptText = `Generate 5 multiple choice questions (MCQs) on the topic '${topic}'.
Rules:
* Each question must have 4 options
* Provide correct answer
* Provide short explanation
* Avoid duplicates
* Keep difficulty medium
* If the correct answer describes a physical concept, working mechanism, or model, provide a highly specific YouTube search query (e.g., "internal combustion engine working animation") in the video_search_query field. Otherwise, set it to null.

Return ONLY valid JSON in this format:
{
  "questions": [
    {
      "question": "string",
      "options": ["A", "B", "C", "D"],
      "answer": "string",
      "explanation": "string",
      "video_search_query": "string | null"
    }
  ]
}`;

    const model = ai.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const responseResult = await model.generateContent(promptText);
    const response = responseResult.response;
    let rawJson = response.text();
    
    // Attempt to parse out JSON from potential markdown wrappers
    if (rawJson.includes('```json')) {
      rawJson = rawJson.split('```json')[1].split('```')[0].trim();
    } else if (rawJson.includes('```')) {
      rawJson = rawJson.split('```')[1].split('```')[0].trim();
    }

    const parsedData = JSON.parse(rawJson);

    return res.json({
      success: true,
      topic: topic,
      quiz: parsedData.questions || parsedData.quiz || parsedData
    });

  } catch (error) {
    console.error('Error generating quiz:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to generate quiz. Make sure the API key is valid and check the backend console.' 
    });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running locally on http://localhost:${PORT}`);
});
