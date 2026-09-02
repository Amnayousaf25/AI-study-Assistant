import { GEMINI_API_KEY, GEMINI_MODEL, GEMINI_MODEL_FALLBACKS, GeminiRequestError } from '../context/ChatContext';
import {
  QuizQuestion,
  StudySubject,
  QuizDifficulty,
  SummaryResult,
  SummaryLength,
  AssignmentSolution,
  PresentationDeck,
  PresentationSlide,
} from '../types/study';

async function sendGeminiParts(
  parts: any[],
  outerSignal?: AbortSignal,
  timeoutMs: number = 60000
): Promise<string> {
  if (!GEMINI_API_KEY?.trim()) {
    throw new GeminiRequestError('configuration');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  if (outerSignal) {
    outerSignal.addEventListener('abort', () => controller.abort());
  }

  const requestBody = JSON.stringify({
    contents: [
      {
        role: 'user',
        parts,
      },
    ],
  });

  let lastError: any = null;

  try {
    for (const modelName of GEMINI_MODEL_FALLBACKS) {
      try {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${GEMINI_API_KEY}`;
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: requestBody,
          signal: controller.signal,
        });

        if (response.status === 404) {
          continue;
        }

        if (!response.ok) {
          throw new GeminiRequestError('http', response.status);
        }

        const data = await response.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) return text;
        throw new GeminiRequestError('empty-response');
      } catch (err: any) {
        if (err?.name === 'AbortError' || controller.signal.aborted) {
          throw new GeminiRequestError('timeout');
        }
        if (err instanceof GeminiRequestError && err.kind === 'http' && err.status !== 404) {
          throw err;
        }
        lastError = err;
      }
    }
  } finally {
    clearTimeout(timeoutId);
  }

  if (lastError instanceof GeminiRequestError) throw lastError;
  throw new GeminiRequestError('network');
}

function cleanJsonText(raw: string): string {
  let cleaned = raw.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }

  // Extract content between first { or [ and last } or ]
  const firstBrace = cleaned.search(/[\{\[]/);
  const lastBrace = Math.max(cleaned.lastIndexOf('}'), cleaned.lastIndexOf(']'));
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.slice(firstBrace, lastBrace + 1);
  }

  return cleaned.trim();
}

/**
 * Generates interactive study MCQs with 4 options, answer key, and step-by-step explanations.
 */
export async function generateQuiz(
  topic: string,
  difficulty: QuizDifficulty = 'Medium',
  count: number = 5
): Promise<QuizQuestion[]> {
  const prompt = `Generate a ${count}-question multiple choice quiz on the topic "${topic}" (${difficulty} difficulty).
Return ONLY a valid JSON array of objects with NO markdown formatting or commentary:
[
  {
    "id": "q1",
    "question": "Clear question text",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswerIndex": 0,
    "explanation": "Concise step-by-step explanation"
  }
]`;

  const raw = await sendGeminiParts([{ text: prompt }], undefined, 60000);
  const cleaned = cleanJsonText(raw);

  try {
    const parsed = JSON.parse(cleaned);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      throw new Error('AI returned an invalid quiz format. Please try again.');
    }

    return parsed.map((item, idx) => {
      const opts =
        Array.isArray(item.options) && item.options.length === 4
          ? item.options.map((o: any) => String(o || ''))
          : ['Option A', 'Option B', 'Option C', 'Option D'];

      const correctIdx =
        typeof item.correctAnswerIndex === 'number' && item.correctAnswerIndex >= 0 && item.correctAnswerIndex <= 3
          ? item.correctAnswerIndex
          : typeof item.correctAnswer === 'number' && item.correctAnswer >= 0 && item.correctAnswer <= 3
          ? item.correctAnswer
          : 0;

      return {
        id: String(item.id || `q_${Date.now()}_${idx}`),
        question: String(item.question || `Question ${idx + 1}`),
        options: opts,
        correctAnswerIndex: correctIdx,
        explanation: String(item.explanation || 'Refer to subject core principles.'),
      };
    });
  } catch (err: any) {
    console.error('Quiz parsing error:', err, 'Raw response:', raw);
    throw new Error('AI returned an invalid quiz format. Please try again.');
  }
}

/**
 * Generates structured study summaries and exam revision takeaways.
 */
export async function generateSummary(
  content: string,
  length: SummaryLength = 'medium',
  subject?: string,
  base64Data?: string,
  mimeType: string = 'application/pdf',
  docName?: string
): Promise<SummaryResult> {
  const parts: any[] = [];

  const textContext = content?.trim() || docName || subject || 'Study Topic';
  const prompt = `You are an expert university academic advisor and study summarizer in ${subject || 'Academic Studies'}.
Summarize the following material (${docName || 'study material'}) with ${length} detail level.
Content / Topic: "${textContext.slice(0, 6000)}"

You MUST return ONLY a valid raw JSON object with NO surrounding markdown or extra text.
Schema:
{
  "title": "Concise Descriptive Topic Title",
  "mainConcept": "A comprehensive explanation of the core concept and governing principles.",
  "keyPoints": [
    "Key takeaway point 1",
    "Key takeaway point 2",
    "Key takeaway point 3"
  ],
  "importantTerms": [
    { "term": "Term 1", "definition": "Precise academic definition" }
  ],
  "quickRevision": "A high-impact 2-3 sentence revision summary ideal for rapid exam cramming."
}`;

  parts.push({ text: prompt });

  if (base64Data && (!content || content.trim().length < 50)) {
    parts.unshift({
      inlineData: {
        mimeType: mimeType || 'application/pdf',
        data: base64Data,
      },
    });
  }

  let raw = '';
  try {
    raw = await sendGeminiParts(parts);
  } catch (err) {
    console.warn('Multimodal summary request failed, retrying text prompt:', err);
    raw = await sendGeminiParts([{ text: prompt }]);
  }

  const cleaned = cleanJsonText(raw);

  try {
    const parsed = JSON.parse(cleaned);
    return {
      title: parsed.title || `${subject || 'Study'} Summary`,
      mainConcept: parsed.mainConcept || 'Core concept overview and key principles.',
      keyPoints: Array.isArray(parsed.keyPoints) && parsed.keyPoints.length > 0 ? parsed.keyPoints : ['Key concept takeaway overview.'],
      importantTerms: Array.isArray(parsed.importantTerms) ? parsed.importantTerms : [],
      quickRevision: parsed.quickRevision || 'Review key principles for exam preparation.',
      subject,
    };
  } catch (err) {
    console.error('Summary parse error:', err, 'Raw:', raw);
    return {
      title: `${subject || 'Study'} Summary`,
      mainConcept: raw || 'Comprehensive overview generated by AI Tutor.',
      keyPoints: ['Core topic overview and key takeaways.'],
      importantTerms: [],
      quickRevision: 'Review key formulas and principles for your exam.',
      subject,
    };
  }
}

/**
 * Solves academic textbook problems, math derivations, coding questions, and assignment problems step-by-step.
 */
export async function solveAssignment(
  questionText: string,
  subject: string = 'General',
  imageBase64?: string,
  mimeType: string = 'image/jpeg'
): Promise<AssignmentSolution> {
  const parts: any[] = [];

  if (imageBase64) {
    parts.push({
      inlineData: {
        mimeType: mimeType || 'image/jpeg',
        data: imageBase64,
      },
    });
  }

  const prompt = `You are a top university tutor in ${subject}.
Analyze and solve this academic question/assignment problem with rigorous step-by-step logic.
Question / Context: "${questionText}"

You MUST return ONLY a valid raw JSON object with NO surrounding markdown or commentary.
Schema:
{
  "title": "Short descriptive title of the problem",
  "stepByStepSolution": [
    {
      "stepNumber": 1,
      "title": "Identify Given Data & Governing Formulas",
      "explanation": "Detailed explanation of step 1."
    },
    {
      "stepNumber": 2,
      "title": "Calculations & Derivations",
      "explanation": "Detailed mathematical/logical working."
    },
    {
      "stepNumber": 3,
      "title": "Verification & Result",
      "explanation": "Final steps leading to solution."
    }
  ],
  "finalAnswer": "Explicit boxed final answer or key output.",
  "simpleExplanation": "A friendly, intuitive explanation explaining the intuition behind the result as if explaining to a classmate."
}`;

  parts.push({ text: prompt });

  const raw = await sendGeminiParts(parts);
  const cleaned = cleanJsonText(raw);

  try {
    const parsed = JSON.parse(cleaned);
    return {
      id: `sol_${Date.now()}`,
      title: parsed.title || `${subject} Problem Solution`,
      subject,
      question: questionText,
      stepByStepSolution: Array.isArray(parsed.stepByStepSolution) ? parsed.stepByStepSolution : [
        { stepNumber: 1, title: 'Step-by-Step Solution', explanation: raw }
      ],
      finalAnswer: parsed.finalAnswer || 'See step-by-step solution above.',
      simpleExplanation: parsed.simpleExplanation || 'Intuitive conceptual summary.',
      timestamp: Date.now(),
    };
  } catch (err) {
    console.error('Assignment parse error:', err, 'Raw:', raw);
    return {
      id: `sol_${Date.now()}`,
      title: `${subject} Problem Solution`,
      subject,
      question: questionText,
      stepByStepSolution: [{ stepNumber: 1, title: 'Solution', explanation: raw }],
      finalAnswer: 'Detailed working generated above.',
      simpleExplanation: 'Review the step-by-step calculation.',
      timestamp: Date.now(),
    };
  }
}

/**
 * Generates structured academic presentation slide decks.
 */
export async function generatePresentation(
  subject: string,
  topic: string,
  slideCount: number = 6,
  detailLevel: string = 'Standard'
): Promise<PresentationDeck> {
  const prompt = `You are a university lecturer and academic slide deck creator in ${subject}.
Create a presentation slide deck with exactly ${slideCount} slides on the topic "${topic}".
Target detail level: ${detailLevel}.

You MUST return ONLY a valid raw JSON object with NO surrounding markdown.
Schema:
{
  "title": "Comprehensive Presentation Title",
  "slides": [
    {
      "slideNumber": 1,
      "title": "Title & Overview",
      "bulletPoints": [
        "Introduction to topic",
        "Key goals of this session",
        "Scope & significance"
      ],
      "speakerNotes": "Good morning everyone. Today we will explore...",
      "visualSuggestion": "Diagram of core system architecture."
    }
  ]
}

Ensure:
- Exactly ${slideCount} structured slides covering: Title/Intro, Core Concept 1, Core Concept 2, Practical Examples/Case Studies, Analysis, and Conclusion/References.
- Each slide has 3-5 concise bullet points and realistic speaker notes.`;

  const raw = await sendGeminiParts([{ text: prompt }]);
  const cleaned = cleanJsonText(raw);

  try {
    const parsed = JSON.parse(cleaned);
    const slides: PresentationSlide[] = Array.isArray(parsed.slides)
      ? parsed.slides.map((s: any, idx: number) => ({
          slideNumber: s.slideNumber || idx + 1,
          title: s.title || `Slide ${idx + 1}`,
          bulletPoints: Array.isArray(s.bulletPoints) ? s.bulletPoints : ['Key concept outline'],
          speakerNotes: s.speakerNotes || 'Speaker notes for discussion.',
          visualSuggestion: s.visualSuggestion || 'Conceptual flowchart or diagram.',
        }))
      : [];

    return {
      id: `deck_${Date.now()}`,
      title: parsed.title || `${subject}: ${topic}`,
      subject,
      topic,
      slideCount: slides.length || slideCount,
      slides,
      timestamp: Date.now(),
    };
  } catch (err) {
    console.warn('Presentation JSON parse fallback triggered:', err);
    const rawLines = raw.split('\n');
    const fallbackSlides: PresentationSlide[] = [];
    let currentSlideTitle = 'Course Overview';
    let currentBullets: string[] = [];
    let slideIdx = 1;

    for (const line of rawLines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('#') || trimmed.toLowerCase().startsWith('slide')) {
        if (currentBullets.length > 0) {
          fallbackSlides.push({
            slideNumber: slideIdx++,
            title: currentSlideTitle,
            bulletPoints: currentBullets,
            speakerNotes: `Key discussion points for ${currentSlideTitle}.`,
            visualSuggestion: 'Conceptual diagram or chart.',
          });
          currentBullets = [];
        }
        currentSlideTitle = trimmed.replace(/^#+\s*/, '').replace(/^slide\s*\d*[:\-.]*\s*/i, '') || `Slide ${slideIdx}`;
      } else if (trimmed.startsWith('-') || trimmed.startsWith('*') || trimmed.startsWith('•')) {
        currentBullets.push(trimmed.replace(/^[-*•]\s*/, ''));
      }
    }

    if (currentBullets.length > 0) {
      fallbackSlides.push({
        slideNumber: slideIdx,
        title: currentSlideTitle,
        bulletPoints: currentBullets,
        speakerNotes: `Summary of ${currentSlideTitle}.`,
        visualSuggestion: 'Overview graphic.',
      });
    }

    if (fallbackSlides.length === 0) {
      fallbackSlides.push({
        slideNumber: 1,
        title: `${subject}: ${topic}`,
        bulletPoints: [
          'Comprehensive course overview',
          'Core governing principles and theory',
          'Exam preparation and key takeaways',
        ],
        speakerNotes: 'Introduction to this study module.',
        visualSuggestion: 'Architecture diagram.',
      });
    }

    return {
      id: `deck_${Date.now()}`,
      title: `${subject}: ${topic}`,
      subject,
      topic,
      slideCount: fallbackSlides.length,
      slides: fallbackSlides,
      timestamp: Date.now(),
    };
  }
}

/**
 * Answers questions about an uploaded study document or PDF.
 */
export async function askDocumentQuestion(
  documentContext: string,
  question: string,
  base64Data?: string,
  mimeType: string = 'application/pdf'
): Promise<string> {
  const parts: any[] = [];
  const prompt = `You are a dedicated university tutor. Answer the student's question accurately based on the document content.
Document context: "${(documentContext || '').slice(0, 5000)}"

Student Question: "${question}"

Provide a clear, accurate, and pedagogical explanation. Use bullet points or steps where appropriate.`;

  parts.push({ text: prompt });

  if (base64Data && (!documentContext || documentContext.length < 50)) {
    parts.unshift({
      inlineData: {
        mimeType: mimeType || 'application/pdf',
        data: base64Data,
      },
    });
  }

  try {
    return await sendGeminiParts(parts);
  } catch (err) {
    console.warn('Multimodal Ask Doc failed, retrying text prompt:', err);
    return await sendGeminiParts([{ text: prompt }]);
  }
}
