import { GoogleGenAI } from '@google/genai';

const GEMINI_API_KEY = 'AIzaSyDEywp676KNoTmg5yL-Goi_2F8I5Y2yPGI';

export type SVGState = {
  svg: string;
  script: string;
  stageNumber: number;
  stageTitle: string;
}

export type ProcessBreakdown = {
  processName: string;
  stages: SVGState[];
}

export type QuizQuestion = {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  svgReference: number | null; // null if no SVG, otherwise index of stage
}

export type QuizData = {
  questions: QuizQuestion[];
}

export async function generateProcessSVGs(userQuery: string): Promise<ProcessBreakdown> {
  try {
    console.time('⏱️ Gemini API Call');
    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
    
    const prompt = `
You are an expert at breaking down processes into visual stages and creating SVG representations.

User wants to learn about: "${userQuery}"

Please break this down into exactly 5 distinct stages/states that show the progression or cycle of this process.

For each stage, provide:
1. A simple, clean SVG that visually represents that stage
2. A clear, concise script (2-3 sentences) explaining what's happening in that stage

CRITICAL SVG MORPHING REQUIREMENTS:
- Use viewBox="0 0 400 400" for ALL 5 stages
- Use ONLY simple shapes: <circle> (with cx, cy, r), <rect> (with x, y, width, height), <ellipse> (with cx, cy, rx, ry)
- Elements representing the SAME OBJECT across stages MUST have the SAME ID
- For example: if a sun appears in stages 1-3, use id="sun" in all three stages
- Elements that represent the same thing should morph smoothly by changing attributes (position, size, color, opacity)
- SVGs can have different numbers of elements - just ensure matching IDs for shared objects
- Use descriptive IDs like: id="sun", id="cloud", id="water", id="plant", id="ground", etc.
- Elements can fade in/out by going from/to opacity="0" when they don't exist in a stage
- Use vibrant, meaningful colors to represent different states

Example of proper ID usage across stages:
Stage 1 (Water Evaporation):
<svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
  <circle id="sun" cx="80" cy="80" r="40" fill="#FDB813" opacity="1"/>
  <rect id="ground" x="0" y="320" width="400" height="80" fill="#8B4513" opacity="1"/>
  <ellipse id="water" cx="200" cy="340" rx="120" ry="30" fill="#2E86DE" opacity="1"/>
  <circle id="vapor1" cx="200" cy="300" r="8" fill="#87CEEB" opacity="0.3"/>
  <circle id="vapor2" cx="220" cy="280" r="6" fill="#87CEEB" opacity="0.2"/>
</svg>

Stage 2 (Cloud Formation):
<svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
  <circle id="sun" cx="80" cy="80" r="40" fill="#FDB813" opacity="0.8"/>
  <rect id="ground" x="0" y="320" width="400" height="80" fill="#8B4513" opacity="1"/>
  <ellipse id="water" cx="200" cy="345" rx="100" ry="25" fill="#2E86DE" opacity="1"/>
  <ellipse id="cloud" cx="250" cy="120" rx="70" ry="35" fill="#ECEFF1" opacity="1"/>
  <circle id="vapor1" cx="250" cy="200" r="10" fill="#87CEEB" opacity="0.5"/>
  <circle id="vapor2" cx="270" cy="180" r="8" fill="#87CEEB" opacity="0.4"/>
</svg>

Notice how sun, ground, water, vapor1, vapor2 morph smoothly, while cloud appears!
This creates beautiful, meaningful transitions!

Respond ONLY with valid JSON in this exact format:
{
  "processName": "Name of the Process",
  "stages": [
    {
      "stageNumber": 1,
      "stageTitle": "Stage Title",
      "svg": "<svg viewBox=\\"0 0 400 400\\" xmlns=\\"http://www.w3.org/2000/svg\\">...</svg>",
      "script": "Explanation of this stage..."
    }
  ]
}

Ensure all SVG content is properly escaped for JSON (use \\" for quotes inside SVG).
`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt
    });
    
    console.timeEnd('⏱️ Gemini API Call');

    if (!response.text) {
      throw new Error('No response text from Gemini');
    }
    
    // Extract JSON from the response (it might be wrapped in markdown code blocks)
    let jsonText = response.text.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?$/g, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/g, '').replace(/```\n?$/g, '');
    }
    
    const processBreakdown: ProcessBreakdown = JSON.parse(jsonText);
    
    // Validate we have 5 stages
    if (processBreakdown.stages.length !== 5) {
      throw new Error('Expected 5 stages from Gemini');
    }
    
    return processBreakdown;
  } catch (error: any) {
    console.error('Error generating process SVGs:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack
    });
    throw error;
  }
}

export async function generateQuiz(processData: ProcessBreakdown): Promise<QuizData> {
  try {
    console.time('⏱️ Gemini Quiz Generation');
    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
    
    // Prepare process information for quiz generation
    const stagesInfo = processData.stages.map((stage, index) => ({
      stageNumber: stage.stageNumber,
      stageTitle: stage.stageTitle,
      script: stage.script,
      index: index
    }));
    
    const prompt = `
You are an expert educator creating an engaging, varied quiz to test understanding of: "${processData.processName}"

Here are the stages that were covered:

${stagesInfo.map(s => `
Stage ${s.stageNumber}: ${s.stageTitle}
${s.script}
`).join('\n')}

Create a quiz with 6 questions that test different aspects of understanding. Use these question types:

1. VISUAL IDENTIFICATION (1-2 questions): Reference a specific stage diagram and ask what it represents
   - Use svgReference to show the diagram
   - Ask "What stage/process does this diagram illustrate?"
   
2. CONCEPTUAL UNDERSTANDING (2 questions): Test grasp of key concepts without visual aids
   - Ask "Why does X happen?" or "What is the purpose of Y?"
   - svgReference: null
   
3. SEQUENCE/ORDER (1 question): Test understanding of the process flow
   - Ask "What happens after X?" or "Which stage comes before Y?"
   - svgReference: null or reference a specific stage
   
4. COMPARISON (1 question): Compare two different stages
   - Ask "What is the main difference between stage X and stage Y?"
   - Can reference one of the stages visually
   
5. APPLICATION/INFERENCE (1 question): Test deeper understanding
   - Ask "What would happen if X didn't occur?" or "Why is Y critical to the overall process?"
   - svgReference: null or reference relevant stage

CRITICAL GUIDELINES:
- Mix visual and text-only questions (2-3 should have svgReference with valid stage index 0-${processData.stages.length - 1})
- Make questions concise and clear
- Create plausible but distinct answer options
- Write explanations that teach, not just confirm
- Vary question phrasing to keep it interesting
- Avoid overly simple "recall only" questions - make learners think

Respond ONLY with valid JSON in this exact format:
{
  "questions": [
    {
      "question": "Question text here?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": 0,
      "explanation": "Clear explanation that teaches why this answer is correct...",
      "svgReference": null
    }
  ]
}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt
    });
    
    console.timeEnd('⏱️ Gemini Quiz Generation');

    if (!response.text) {
      throw new Error('No response text from Gemini');
    }
    
    // Extract JSON from the response
    let jsonText = response.text.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?$/g, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/g, '').replace(/```\n?$/g, '');
    }
    
    const quizData: QuizData = JSON.parse(jsonText);
    
    // Validate quiz data
    if (!quizData.questions || quizData.questions.length < 5 || quizData.questions.length > 7) {
      throw new Error('Invalid quiz data: expected 5-7 questions');
    }
    
    // Validate each question
    quizData.questions.forEach((q, index) => {
      if (!q.question || !q.options || q.options.length !== 4) {
        throw new Error(`Invalid question ${index}: missing required fields`);
      }
      if (q.correctAnswer < 0 || q.correctAnswer > 3) {
        throw new Error(`Invalid question ${index}: correctAnswer must be 0-3`);
      }
      if (q.svgReference !== null && (q.svgReference < 0 || q.svgReference >= processData.stages.length)) {
        throw new Error(`Invalid question ${index}: svgReference out of bounds`);
      }
    });
    
    console.log('✅ Quiz generated successfully:', quizData.questions.length, 'questions');
    return quizData;
  } catch (error: any) {
    console.error('Error generating quiz:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack
    });
    throw error;
  }
}
