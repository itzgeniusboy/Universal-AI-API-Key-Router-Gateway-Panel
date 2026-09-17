import { AuthError, ProviderCallParams, ProviderCallResult, ProviderError, RateLimitError } from './types';

export async function callBedrock(params: ProviderCallParams): Promise<ProviderCallResult> {
  const startTime = Date.now();
  // Bedrock via custom gateway/proxy endpoint or standard Bedrock runtime invocation
  const endpoint = params.customBaseUrl || 'https://bedrock-runtime.us-east-1.amazonaws.com/model/invoke';

  const body: any = {
    model: params.model || 'anthropic.claude-3-5-sonnet-20241022-v2:0',
    messages: params.messages,
  };

  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: params.customAuthHeader ? params.customAuthHeader.replace('${KEY}', params.apiKey) : `Bearer ${params.apiKey}`,
      },
      body: JSON.stringify(body),
    });
  } catch (netErr: any) {
    throw new ProviderError(`AWS Bedrock connection failed: ${netErr.message}`, 503, true);
  }

  if (response.status === 429) {
    throw new RateLimitError(`AWS Bedrock Throttling (429)`, 60);
  }
  if (response.status === 401 || response.status === 403) {
    throw new AuthError(`AWS Bedrock Auth Error (${response.status})`);
  }
  if (!response.ok) {
    const errBody = await response.text().catch(() => '');
    throw new ProviderError(`AWS Bedrock Error (${response.status}): ${errBody.slice(0, 150)}`, response.status, response.status >= 500);
  }

  const data = (await response.json()) as any;
  const content = data.content?.[0]?.text || data.choices?.[0]?.message?.content || data.output?.text || '';
  const tokensUsed = data.usage?.total_tokens || 100;

  return {
    content,
    tokensUsed,
    model: params.model || 'bedrock-model',
    latencyMs: Date.now() - startTime,
  };
}
