import { callOpenAiCompatible } from './common-openai';
import { ProviderCallParams, ProviderCallResult } from './types';

export async function callCustom(params: ProviderCallParams): Promise<ProviderCallResult> {
  const endpoint = params.customBaseUrl || 'http://localhost:11434/v1/chat/completions';
  return callOpenAiCompatible(params, {
    providerName: 'Custom OpenAI-Compatible Provider',
    defaultEndpoint: endpoint,
    defaultModel: params.model || 'default-model',
  });
}
