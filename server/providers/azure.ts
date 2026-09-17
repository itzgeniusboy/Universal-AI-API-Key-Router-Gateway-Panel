import { AuthError, ProviderCallParams, ProviderCallResult, ProviderError, RateLimitError } from './types';

export async function callAzure(params: ProviderCallParams): Promise<ProviderCallResult> {
  const startTime = Date.now();
  const endpoint = params.customBaseUrl || 'https://models.inference.ai.azure.com/chat/completions';

  const body: any = {
    model: params.model || 'gpt-4o',
    messages: params.messages,
    temperature: params.temperature ?? 0.7,
  };
  if (params.max_tokens) body.max_tokens = params.max_tokens;

  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': params.apiKey,
        Authorization: `Bearer ${params.apiKey}`,
      },
      body: JSON.stringify(body),
    });
  } catch (netErr: any) {
    throw new ProviderError(`Azure OpenAI connection failed: ${netErr.message}`, 503, true);
  }

  if (response.status === 429) {
    const retryAfter = Number(response.headers.get('retry-after')) || 60;
    const errBody = await response.text().catch(() => '');
    throw new RateLimitError(`Azure Rate Limit (429): ${errBody.slice(0, 150)}`, retryAfter);
  }

  if (response.status === 401 || response.status === 403) {
    const errBody = await response.text().catch(() => '');
    throw new AuthError(`Azure Auth Error (${response.status}): ${errBody.slice(0, 150)}`);
  }

  if (!response.ok) {
    const errBody = await response.text().catch(() => '');
    throw new ProviderError(`Azure Error (${response.status}): ${errBody.slice(0, 150)}`, response.status, response.status >= 500);
  }

  const data = (await response.json()) as any;
  const content = data.choices?.[0]?.message?.content || '';
  const tokensUsed = data.usage?.total_tokens || Math.round(content.length / 4);

  return {
    content,
    tokensUsed,
    model: data.model || params.model || 'azure-gpt-4o',
    latencyMs: Date.now() - startTime,
  };
}
