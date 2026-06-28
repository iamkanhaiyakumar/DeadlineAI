import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

let aiClient: any = null;
let isMockAi = true;

const apiKey = process.env.GEMINI_API_KEY;

if (apiKey && apiKey !== 'your_gemini_api_key_here') {
  try {
    aiClient = new GoogleGenAI({ apiKey });
    isMockAi = false;
    console.log('>>> Gemini AI Client Initialized Successfully!');
  } catch (error) {
    console.error('Failed to initialize Gemini AI client:', error);
  }
} else {
  console.log('>>> GEMINI_API_KEY not found or default value used. Gemini Agent will run in MOCK mode.');
}

export const aiService = {
  getClient: () => aiClient,
  isMockMode: () => isMockAi
};
