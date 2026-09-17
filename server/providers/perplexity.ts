import { callOpenAiCompatible } from './common-openai';
import { ProviderCallParams, ProviderCallResult } from './types';

export async function callPerplexity(params: ProviderCallParams): Promise<ProviderCallResult> {
  return callOpenAiCompatible(params, {
    providerName: 'Perplexity',
    defaultEndpoint: 'https://api.perplexity.ai/chat/completions',
    defaultModel: 'sonar-pro',
  });
}
