import type { ProviderId } from '../../src/types';
import { callAnthropic } from './anthropic';
import { callAzure } from './azure';
import { callBedrock } from './bedrock';
import { callCohere } from './cohere';
import { callCustom } from './custom';
import { callDeepSeek } from './deepseek';
import { callFireworks } from './fireworks';
import { callGemini } from './gemini';
import { callGroq } from './groq';
import { callMistral } from './mistral';
import { callOpenAi } from './openai';
import { callOpenRouter } from './openrouter';
import { callPerplexity } from './perplexity';
import { callTogether } from './together';
import {
  AuthError,
  ProviderError,
  RateLimitError,
} from './types';
import type {
  ProviderCallParams,
  ProviderCallResult,
} from './types';
import { callXAi } from './xai';

export {
  AuthError,
  ProviderError,
  RateLimitError,
};
export type {
  ProviderCallParams,
  ProviderCallResult,
};

export async function executeProviderCall(
  provider: ProviderId,
  params: ProviderCallParams
): Promise<ProviderCallResult> {
  switch (provider) {
    case 'openai':
      return callOpenAi(params);
    case 'anthropic':
      return callAnthropic(params);
    case 'google':
      return callGemini(params);
    case 'groq':
      return callGroq(params);
    case 'deepseek':
      return callDeepSeek(params);
    case 'mistral':
      return callMistral(params);
    case 'xai':
      return callXAi(params);
    case 'cohere':
      return callCohere(params);
    case 'openrouter':
      return callOpenRouter(params);
    case 'perplexity':
      return callPerplexity(params);
    case 'together':
      return callTogether(params);
    case 'fireworks':
      return callFireworks(params);
    case 'azure':
      return callAzure(params);
    case 'bedrock':
      return callBedrock(params);
    case 'custom':
    default:
      return callCustom(params);
  }
}
