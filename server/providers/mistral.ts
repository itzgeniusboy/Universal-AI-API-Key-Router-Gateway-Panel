import { callOpenAiCompatible } from './common-openai';
import { ProviderCallParams, ProviderCallResult } from './types';

export async function callMistral(params: ProviderCallParams): Promise<ProviderCallResult> {
  return callOpenAiCompatible(params, {
    providerName: 'Mistral',
    defaultEndpoint: 'https://api.mistral.ai/v1/chat/completions',
    defaultModel: 'mistral-large-latest',
  });
}
