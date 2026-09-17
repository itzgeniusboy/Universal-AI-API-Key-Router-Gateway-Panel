import { callOpenAiCompatible } from './common-openai';
import { ProviderCallParams, ProviderCallResult } from './types';

export async function callGroq(params: ProviderCallParams): Promise<ProviderCallResult> {
  return callOpenAiCompatible(params, {
    providerName: 'Groq',
    defaultEndpoint: 'https://api.groq.com/openai/v1/chat/completions',
    defaultModel: 'llama-3.3-70b-versatile',
  });
}
