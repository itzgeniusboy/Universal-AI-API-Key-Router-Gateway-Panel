import { AuthError, ProviderCallParams, ProviderCallResult, ProviderError, RateLimitError } from './types';

export async function callAnthropic(params: ProviderCallParams): Promise<ProviderCallResult> {
  const startTime = Date.now();
  const url = 'https://api.anthropic.com/v1/messages';

  // Extract system messages if any
  const systemMessages = params.messages.filter((m) => m.role === 'system').map((m) => m.content).join('\n\n');
  const userMessages = params.messages
    .filter((m) => m.role !== 'system')
    .map((m) => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: m.content,
    }));

  if (userMessages.length === 0) {
    userMessages.push({ role: 'user', content: 'Hello' });
  }

  const body: any = {
    model: params.model || 'claude-3-5-sonnet-20241022',
    max_tokens: params.max_tokens || 2048,
    messages: userMessages,
  };
  if (systemMessages) body.system = systemMessages;
  if (params.temperature !== undefined) body.temperature = params.temperature;
  if (params.stream) body.stream = true;

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': params.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
    });
  } catch (netErr: any) {
    throw new ProviderError(`Anthropic network connection failed: ${netErr.message}`, 503, true);
  }

  if (response.status === 429) {
    const retryAfter = Number(response.headers.get('retry-after')) || 60;
    const errBody = await response.text().catch(() => '');
    throw new RateLimitError(`Anthropic Rate Limit (429): ${errBody.slice(0, 150)}`, retryAfter);
  }

  if (response.status === 401 || response.status === 403) {
    const errBody = await response.text().catch(() => '');
    throw new AuthError(`Anthropic Auth Error (${response.status}): ${errBody.slice(0, 150)}`);
  }

  if (!response.ok) {
    const errBody = await response.text().catch(() => '');
    throw new ProviderError(`Anthropic Error (${response.status}): ${errBody.slice(0, 150)}`, response.status, response.status >= 500);
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
  const content = data.content?.[0]?.text || '';
  const tokensUsed = (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0);

  return {
    content,
    tokensUsed,
    model: data.model || params.model,
    latencyMs: Date.now() - startTime,
  };
}
