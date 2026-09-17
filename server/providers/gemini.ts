import { AuthError, ProviderCallParams, ProviderCallResult, ProviderError, RateLimitError } from './types';

export async function callGemini(params: ProviderCallParams): Promise<ProviderCallResult> {
  const startTime = Date.now();
  let model = params.model || 'gemini-flash-latest';
  if (model === 'gemini-2.5-flash' || model === 'gemini-2.0-flash' || model === 'gemini-1.5-flash') {
    model = 'gemini-flash-latest';
  }
  if (!model.startsWith('models/')) {
    // strip prefix if any
    model = model.replace(/^models\//, '');
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${params.apiKey}`;

  // Map chat messages to Gemini contents format
  const contents = params.messages.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  const body: any = {
    contents,
    generationConfig: {
      temperature: params.temperature ?? 0.7,
      maxOutputTokens: params.max_tokens || 2048,
    },
  };

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch (netErr: any) {
    throw new ProviderError(`Google AI API network connection failed: ${netErr.message}`, 503, true);
  }

  if (response.status === 429) {
    const errBody = await response.text().catch(() => '');
    throw new RateLimitError(`Google AI Rate Limit (429): ${errBody.slice(0, 150)}`, 60);
  }

  if (response.status === 400 || response.status === 401 || response.status === 403) {
    const errBody = await response.text().catch(() => '');
    if (errBody.includes('API_KEY_INVALID') || response.status === 401 || response.status === 403) {
      throw new AuthError(`Google AI Key Invalid (${response.status}): ${errBody.slice(0, 150)}`);
    }
    throw new ProviderError(`Google AI Request Error (${response.status}): ${errBody.slice(0, 150)}`, response.status);
  }

  if (!response.ok) {
    const errBody = await response.text().catch(() => '');
    throw new ProviderError(`Google AI Error (${response.status}): ${errBody.slice(0, 150)}`, response.status, response.status >= 500);
  }

  const data = (await response.json()) as any;
  const content =
    data.candidates?.[0]?.content?.parts?.[0]?.text ||
    data.candidates?.[0]?.text ||
    '';
  const tokensUsed =
    data.usageMetadata?.totalTokenCount ||
    Math.round((JSON.stringify(params.messages).length + content.length) / 4);

  return {
    content,
    tokensUsed,
    model,
    latencyMs: Date.now() - startTime,
  };
}
