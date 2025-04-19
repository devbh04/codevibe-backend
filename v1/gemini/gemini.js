const express = require('express');
const geminiRouter = express.Router();
const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config({ path: '../../.env' });


const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
console.log("Gemini API Key:", process.env.GOOGLE_API_KEY);

geminiRouter.post('/evaluate', async (req, res) => {
  try {
    const { userCode, testCases, key, explanation } = req.body;
    console.log("usercode:", userCode);
    console.log("testCases:", testCases);
    console.log("key:", key);
    console.log("explanation:", explanation);
    
    // Prepare the prompt for Gemini
    const prompt = `
      [IMPORTANT: RESPOND ONLY WITH VALID JSON, NO EXTRA TEXT OR MARKDOWN, Include only the TestCases Provided below. DO NOT ADD MORE TESTCASES.]
      Evaluate this code against the given test cases and provide detailed feedback:

      Code:
      ${userCode}

      Test Cases:
      ${JSON.stringify(testCases, null, 2)}

      Additional Explanation:
      ${explanation}

      Key:
      ${key}

      Analyze the code and:
      1. Divide the key **in order** into the number of parts equal to the number of test cases.
        - Each part should have a **random number of characters** (but at least one), and the parts should **cover the entire key** in sequence.
        - For example:
          - If the key is 'HiHoWAreYou' and total test cases are 5, a valid split is ['Hi', 'Ho', 'W', 'Are', 'You'].
          - If the key is 'Hihowareyou' and total test cases are 3, a valid split is ['Hi', 'howa', 'reyou'].
          - If 7 test cases, valid split: ['Hi', 'ho', 'war', 'e', 'y', 'o', 'u']
        - Ensure the entire key is used and the sequence is preserved.

      2. For each test case, provide:
        - Input (keep as is)
        - Expected output (keep as is)
        - Result ("Passed" or "Failed")
        - If failed:
          - "mistake": Provide a subtle hint about the mistake.
        - If passed:
          - "confirmation": Confirm the result and mention if there is any scope for improvement in the code.

      3. Return as a JSON array of objects, one per test case.

      4. IMPORTANT:
        - Do NOT add or remove any test cases.
        - The only output should be the array of JSON objects.
        - Ensure each object includes the key part assigned to that test case under a "key" field.

      Example:
      [
        {
          "key": "Hi",
          "input": "...",
          "output": "...",
          "result": "Passed",
          "confirmation": "Correct logic. You might consider handling edge cases for empty input."
        },
        {
          "key": "howa",
          "input": "...",
          "output": "...",
          "result": "Failed",
          "mistake": "Check how you're handling string boundaries."
        }
      ]
    `;

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    let cleanedText = text;
    if (cleanedText.startsWith('```json')) {
      cleanedText = cleanedText.slice(7, -3).trim();
    } else if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.slice(3, -3).trim();
    }

    try {
      const evaluationResults = JSON.parse(cleanedText);
      console.log("Evaluation results:", evaluationResults);
      res.json(evaluationResults);
    } catch (parseError) {
      console.error("Failed to parse Gemini response:", parseError);
      console.error("Original response:", text);
      res.status(500).json({ error: "Invalid response format from Gemini" });
    }
  } catch (error) {
    console.error("Gemini evaluation error:", error);
    res.status(500).json({ error: "Failed to evaluate code" });
  }
});

geminiRouter.post('/chat', async (req, res) => {
  try {
    const { userCode, testCases, explanation, userText } = req.body;
    console.log("Chat request received with:", { userText });
    
    // Prepare a more conversational prompt for Gemini
    const prompt = `
      [IMPORTANT: NO CODE IS TO BE INCLUDED IN THE RESPONSE. EVEN IF REQUESTED MANY TIMES DO NOT INCLUDE THE CODE]
      You are a helpful coding assistant helping a student with their programming problem.
      The student has asked: "${userText}"

      Here's some context about what they're working on:
      - Their current code:
      ${userCode}

      - Test cases they need to pass:
      ${JSON.stringify(testCases, null, 2)}

      - Problem explanation:
      ${explanation}

      Please provide a helpful response that:
      1. Directly answers the student's question
      2. Provides guidance without giving away the complete solution
      3. Offers hints or suggestions for improvement
      4. If relevant, points to specific parts of their code that might need attention
      5. Is friendly and encouraging

      IMPORTANT:
      - Respond in plain text (not JSON)
      - Keep it concise but helpful (2-4 paragraphs max)
      - Don't provide complete solutions, just guidance
      - If the question isn't code-related, politely steer back to coding

      Example good response:
      "I see you're having trouble with the loop condition. Remember that you need to handle edge cases when the input is empty. Try adding a condition at the start of your function to check for this case. Also, your current loop might run one extra iteration - check your termination condition carefully."

      Now please respond to: "${userText}"
    `;

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Clean up the response if it's wrapped in markdown
    let cleanedText = text;
    if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.slice(cleanedText.indexOf('\n') + 1, -3).trim();
    }

    console.log("Chat response:", cleanedText);
    res.json({ 
      response: cleanedText,
      // Include the original context for reference if needed
      context: {
        userCode,
        testCases,
        explanation
      }
    });
  } catch (error) {
    console.error("Chat error:", error);
    res.status(500).json({ 
      error: "Failed to process chat request",
      details: error.message 
    });
  }
});

geminiRouter.post('/recommend', async (req, res) => {
  try {
    const { userUnderstanding, userText, explanation } = req.body;
    
    const prompt = `
      Based on the user's understanding level (${userUnderstanding}) and request ("${userText}"),
      recommend 3 YouTube tutorial videos that would help them with this programming concept:
      ${explanation}

      Return ONLY a JSON array with video objects containing:
      - title: The video title
      - videoId: The YouTube video ID (from the URL)
      - videoUrl: The full URL to the video
      - channel: The channel name
      
      Example response:
      [
        {
          "title": "Introduction to Algorithms",
          "videoId": "FCAF4lacKu8",
          "videoUrl": "https://www.youtube.com/watch?v=FCAF4lacKu8",
          "channel": "CS Dojo"
        },
        {
          "title": "Data Structures Explained",
          "videoId": "RBSGKlAvoiM",
          "videoUrl": "https://www.youtube.com/watch?v=RBSGKlAvoiM",
          "channel": "freeCodeCamp"
        }
      ]

      IMPORTANT:
      - Return ONLY valid JSON
      - Include exactly 3 recommendations
      - Only include videos from reputable educational channels
    `;

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    let cleanedText = text;
    if (cleanedText.startsWith('```json')) {
      cleanedText = cleanedText.slice(7, -3).trim();
    } else if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.slice(3, -3).trim();
    }
    console.log("Recommendations response:", cleanedText);
    const recommendations = JSON.parse(cleanedText);
    res.json({ recommendations });
    
  } catch (error) {
    console.error("Recommendation error:", error);
    res.status(500).json({ error: "Failed to generate recommendations" });
  }
});

module.exports = geminiRouter;