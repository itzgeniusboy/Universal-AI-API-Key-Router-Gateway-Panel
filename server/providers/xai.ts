import { callOpenAiCompatible } from './common-openai';
import { ProviderCallParams, ProviderCallResult } from './types';

export async function callXAi(params: ProviderCallParams): Promise<ProviderCallResult> {
  return callOpenAiCompatible(params, {
    providerName: 'xAI',
    defaultEndpoint: 'https://api.x.ai/v1/chat/completions',
    defaultModel: 'grok-2-latest',
  });
}
