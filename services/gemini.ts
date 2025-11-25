

import { GoogleGenAI } from "@google/genai";
import { SignalType, AssetType, TradingSignal, UserPreferences, Timeframe } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateSignal = async (asset: string, assetType: AssetType, prefs?: UserPreferences): Promise<Partial<TradingSignal>> => {
  try {
    // Construct dynamic parts of the prompt based on preferences
    const riskInstruction = prefs 
      ? `Risk Profile: ${prefs.riskLevel}. Adjust Stop Loss and Take Profit width accordingly. ${prefs.riskLevel === 'Conservative' ? 'Prioritize capital preservation with tight stops.' : 'Allow for wider volatility.'}`
      : '';
    
    const durationInstruction = prefs
      ? `Trade Duration: ${prefs.tradeDuration}. Analysis should reflect this timeframe. (Scalp = 15m/1H, Intraday = 1H/4H, Swing = 4H/Daily).`
      : '';

    const indicatorsInstruction = prefs && prefs.preferredIndicators.length > 0
      ? `MANDATORY: You MUST incorporate the following technical indicators in your Technical Analysis text: ${prefs.preferredIndicators.join(', ')}.`
      : '';

    const prompt = `
      Act as a world-class financial analyst (top 1% percentile). 
      
      TASK:
      1. Use Google Search to find the CURRENT LIVE PRICE of ${asset} (${assetType}) and the latest technical/fundamental news from the last 24 hours.
      2. Based on this REAL-TIME data, formulate a high-probability trading signal.
      3. Identify a specific technical chart pattern (e.g., Bull Flag, Head and Shoulders, Double Bottom, Support Bounce, Breakout) that justifies this trade.
      4. Return the response STRICTLY as a raw JSON object. Do not use Markdown formatting. Do not include comments in the JSON.

      USER PREFERENCES (Apply these strictly):
      ${riskInstruction}
      ${durationInstruction}
      ${indicatorsInstruction}

      RESPONSE FORMAT:
      {
        "type": "LONG", 
        "entryPrice": 0,
        "stopLoss": 0,
        "takeProfit": 0,
        "pattern": "Name of pattern",
        "timeframe": "15m",
        "support": 0,
        "resistance": 0,
        "technicalAnalysis": "Analysis text",
        "fundamentalAnalysis": "Analysis text",
        "confidenceScore": 85,
        "chartData": [
           {"time": "HH:MM", "price": 0}
        ]
      }

      CRITICAL REQUIREMENTS:
      - "type" must be exactly "LONG" or "SHORT".
      - "timeframe" must be one of: "15m", "1H", "4H", "Daily".
      - "entryPrice" must be the live market price found via search.
      - "chartData" must contain exactly 20 objects. 
      - The "chartData" prices must visually form the identified "pattern" and END exactly at the "entryPrice".
      - Do not include explanations outside the JSON.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 0.4 // Slightly lower for structure stability
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    // Robust JSON extraction: Find the first '{' and the last '}'
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');

    if (firstBrace === -1 || lastBrace === -1) {
       throw new Error("Valid JSON structure not found in response");
    }

    const jsonString = text.substring(firstBrace, lastBrace + 1);
    
    let data;
    try {
      data = JSON.parse(jsonString);
    } catch (e) {
      console.error("JSON Parse Error. String was:", jsonString);
      throw new Error("Failed to parse signal data.");
    }

    // Extract grounding chunks (sources)
    // @ts-ignore - Dynamic access to grounding metadata
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks
      ?.map((chunk: any) => {
        if (chunk.web) {
          return { title: chunk.web.title, uri: chunk.web.uri };
        }
        return null;
      })
      .filter((s: any) => s !== null) || [];

    // Map timeframe string to Enum
    let timeframeEnum = Timeframe.H1; // Default
    if (Object.values(Timeframe).includes(data.timeframe)) {
        timeframeEnum = data.timeframe;
    }

    return {
      type: data.type as SignalType,
      entryPrice: data.entryPrice,
      stopLoss: data.stopLoss,
      takeProfit: data.takeProfit,
      pattern: data.pattern,
      timeframe: timeframeEnum,
      support: data.support,
      resistance: data.resistance,
      technicalAnalysis: data.technicalAnalysis,
      fundamentalAnalysis: data.fundamentalAnalysis,
      confidenceScore: data.confidenceScore,
      chartData: data.chartData,
      searchSources: sources
    };

  } catch (error) {
    console.error("Error generating signal:", error);
    throw error;
  }
};

export const getLatestPrices = async (assets: string[]): Promise<Record<string, number>> => {
  if (assets.length === 0) return {};

  try {
    const assetsString = assets.join(", ");
    const prompt = `
      Find the CURRENT LIVE market price for the following assets: ${assetsString}.
      Return a RAW JSON object mapping the asset symbol to its current numerical price.
      Example: {"BTC/USD": 64000.50, "XAU/USD": 2300.10}
      Do not include any text other than the JSON.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 0.1
      }
    });

    const text = response.text;
    if (!text) return {};

    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    if (firstBrace === -1 || lastBrace === -1) return {};

    const jsonString = text.substring(firstBrace, lastBrace + 1);
    return JSON.parse(jsonString);
  } catch (error) {
    console.error("Error fetching latest prices:", error);
    return {};
  }
};