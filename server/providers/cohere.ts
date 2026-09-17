import { AuthError, ProviderCallParams, ProviderCallResult, ProviderError, RateLimitError } from './types';

export async function callCohere(params: ProviderCallParams): Promise<ProviderCallResult> {
  const startTime = Date.now();
  const url = 'https://api.cohere.com/v2/chat';

  const body: any = {
    model: params.model || 'command-r-plus-08-2024',
    messages: params.messages.map((m) => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: m.content,
    })),
  };
  if (params.temperature !== undefined) body.temperature = params.temperature;

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${params.apiKey}`,
      },
      body: JSON.stringify(body),
    });
  } catch (netErr: any) {
    throw new ProviderError(`Cohere connection failed: ${netErr.message}`, 503, true);
  }

  if (response.status === 429) {
    const retryAfter = Number(response.headers.get('retry-after')) || 60;
    const errBody = await response.text().catch(() => '');
    throw new RateLimitError(`Cohere Rate Limit (429): ${errBody.slice(0, 150)}`, retryAfter);
  }

  if (response.status === 401 || response.status === 403) {
    const errBody = await response.text().catch(() => '');
    throw new AuthError(`Cohere Auth Error (${response.status}): ${errBody.slice(0, 150)}`);
  }

  if (!response.ok) {
    const errBody = await response.text().catch(() => '');
    throw new ProviderError(`Cohere Error (${response.status}): ${errBody.slice(0, 150)}`, response.status, response.status >= 500);
  }

  const data = (await response.json()) as any;
  const content = data.message?.content?.[0]?.text || '';
  const tokensUsed = (data.usage?.tokens?.input_tokens || 0) + (data.usage?.tokens?.output_tokens || 0) || Math.round(content.length / 4);

  return {
    content,
    tokensUsed,
    model: params.model || 'command-r-plus',
    latencyMs: Date.now() - startTime,
  };
}
