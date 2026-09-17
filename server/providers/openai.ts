import { AuthError, ProviderCallParams, ProviderCallResult, ProviderError, RateLimitError } from './types';

export async function callOpenAi(params: ProviderCallParams): Promise<ProviderCallResult> {
  const startTime = Date.now();
  const url = 'https://api.openai.com/v1/chat/completions';

  const body: any = {
    model: params.model || 'gpt-4o',
    messages: params.messages,
    temperature: params.temperature ?? 0.7,
  };
  if (params.max_tokens) body.max_tokens = params.max_tokens;
  if (params.stream) body.stream = true;

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
    throw new ProviderError(`OpenAI network connection failed: ${netErr.message}`, 503, true);
  }

  if (response.status === 429) {
    const retryAfter = Number(response.headers.get('retry-after')) || 60;
    const errBody = await response.text().catch(() => '');
    throw new RateLimitError(`OpenAI Rate Limit (429): ${errBody.slice(0, 150)}`, retryAfter);
  }

  if (response.status === 401 || response.status === 403) {
    const errBody = await response.text().catch(() => '');
    throw new AuthError(`OpenAI Authentication Failed (${response.status}): ${errBody.slice(0, 150)}`);
  }

  if (!response.ok) {
    const errBody = await response.text().catch(() => '');
    const isRetryable = response.status >= 500;
    throw new ProviderError(`OpenAI Error (${response.status}): ${errBody.slice(0, 150)}`, response.status, isRetryable);
  }

  if (params.stream) {
    return {
      content: '',
      tokensUsed: 0,
      model: params.model,
      latencyMs: Date.now() - startTime,
      streamResponse: response.body,
    };
  }

  const data = (await response.json()) as any;
  const content = data.choices?.[0]?.message?.content || '';
  const tokensUsed = data.usage?.total_tokens || Math.round(content.length / 4);

  return {
    content,
    tokensUsed,
    model: data.model || params.model,
    latencyMs: Date.now() - startTime,
  };
}
