import Groq from 'groq-sdk';

const MODEL = 'meta-llama/llama-4-scout-17b-16e-instruct';

/**
 * Analyze a screenshot using Groq Llama Scout vision model.
 * Returns structured bug report text extracted from the image.
 */
export async function analyzeScreenshot(
    apiKey: string,
    base64Image: string,
    mimeType: string,
    additionalNotes: string
): Promise<string> {
    const groq = new Groq({ apiKey });

    const systemPrompt = `You are an expert QA engineer with 15 years of experience. 
Analyze the provided screenshot of a software application and generate a detailed bug report.
Your response MUST follow this exact structure:

**Summary:** A concise one-line summary of the bug.

**Steps to Reproduce:**
1. Step 1
2. Step 2
...

**Expected Result:** What should happen.

**Actual Result:** What actually happens (based on the screenshot).

**Severity:** Critical / High / Medium / Low

**Additional Details:** Any extra observations from the screenshot.`;

    const userContent: Array<{ type: string; image_url?: { url: string }; text?: string }> = [
        {
            type: 'image_url',
            image_url: {
                url: `data:${mimeType};base64,${base64Image}`,
            },
        },
        {
            type: 'text',
            text: additionalNotes
                ? `Analyze this screenshot and generate a bug report. Additional context from the reporter: "${additionalNotes}"`
                : 'Analyze this screenshot and generate a detailed bug report.',
        },
    ];

    const response = await groq.chat.completions.create({
        model: MODEL,
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userContent },
        ],
        temperature: 0.3,
        max_tokens: 2048,
    });

    const text = response.choices?.[0]?.message?.content;
    if (!text) {
        throw new Error('No response received from Groq model');
    }
    return text;
}

/**
 * Quick test to validate the Groq API key.
 */
export async function testGroqConnection(apiKey: string): Promise<{ success: boolean; message: string }> {
    try {
        const groq = new Groq({ apiKey });
        const response = await groq.chat.completions.create({
            model: MODEL,
            messages: [{ role: 'user', content: 'Say "Connection successful" in exactly two words.' }],
            max_tokens: 10,
        });
        return { success: true, message: 'Groq connection successful!' };
    } catch (error: any) {
        return {
            success: false,
            message: `Groq connection failed: ${error?.message || 'Unknown error'}`,
        };
    }
}

