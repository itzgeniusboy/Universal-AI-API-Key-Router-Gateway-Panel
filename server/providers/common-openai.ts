import { AuthError, ProviderCallParams, ProviderCallResult, ProviderError, RateLimitError } from './types';

export interface OpenAiCompatibleOptions {
  providerName: string;
  defaultEndpoint: string;
  defaultModel: string;
  customAuthPrefix?: string; // default "Bearer"
}

export async function callOpenAiCompatible(
  params: ProviderCallParams,
  options: OpenAiCompatibleOptions
): Promise<ProviderCallResult> {
  const startTime = Date.now();
  const endpoint = params.customBaseUrl || options.defaultEndpoint;
  const authPrefix = options.customAuthPrefix !== undefined ? options.customAuthPrefix : 'Bearer ';
  const authHeaderValue = params.customAuthHeader
    ? params.customAuthHeader.replace('${KEY}', params.apiKey)
    : `${authPrefix}${params.apiKey}`.trim();

  const body: any = {
    model: params.model || options.defaultModel,
    messages: params.messages,
    temperature: params.temperature ?? 0.7,
  };
  if (params.max_tokens) body.max_tokens = params.max_tokens;
  if (params.stream) body.stream = true;

  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeaderValue,
      },
      body: JSON.stringify(body),
    });
  } catch (netErr: any) {
    throw new ProviderError(`${options.providerName} connection failed: ${netErr.message}`, 503, true);
  }

  if (response.status === 429) {
    const retryAfter = Number(response.headers.get('retry-after')) || 60;
    const errBody = await response.text().catch(() => '');
    throw new RateLimitError(`${options.providerName} Rate Limit (429): ${errBody.slice(0, 150)}`, retryAfter);
  }

  if (response.status === 401 || response.status === 403) {
    const errBody = await response.text().catch(() => '');
    throw new AuthError(`${options.providerName} Auth Error (${response.status}): ${errBody.slice(0, 150)}`);
  }

  if (!response.ok) {
    const errBody = await response.text().catch(() => '');
    throw new ProviderError(
      `${options.providerName} Error (${response.status}): ${errBody.slice(0, 150)}`,
      response.status,
      response.status >= 500
    );
  }

  if (params.stream) {
    return {
      content: '',
      tokensUsed: 0,
      model: params.model || options.defaultModel,
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
    model: data.model || params.model || options.defaultModel,
    latencyMs: Date.now() - startTime,
  };
}
