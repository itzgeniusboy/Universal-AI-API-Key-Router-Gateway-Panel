import { callOpenAiCompatible } from './common-openai';
import { ProviderCallParams, ProviderCallResult } from './types';

export async function callOpenRouter(params: ProviderCallParams): Promise<ProviderCallResult> {
  return callOpenAiCompatible(params, {
    providerName: 'OpenRouter',
    defaultEndpoint: 'https://openrouter.ai/api/v1/chat/completions',
    defaultModel: 'openai/gpt-4o',
  });
}
