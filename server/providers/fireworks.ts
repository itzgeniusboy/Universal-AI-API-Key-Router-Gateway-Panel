import { callOpenAiCompatible } from './common-openai';
import { ProviderCallParams, ProviderCallResult } from './types';

export async function callFireworks(params: ProviderCallParams): Promise<ProviderCallResult> {
  return callOpenAiCompatible(params, {
    providerName: 'Fireworks AI',
    defaultEndpoint: 'https://api.fireworks.ai/inference/v1/chat/completions',
    defaultModel: 'accounts/fireworks/models/llama-v3p3-70b-instruct',
  });
}
