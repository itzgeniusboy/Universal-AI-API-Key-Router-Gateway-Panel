import type { ProviderId } from '../../src/types';

export const DEFAULT_PROVIDER_MODELS: Record<ProviderId, string> = {
  openai: 'gpt-4o',
  anthropic: 'claude-3-7-sonnet-latest',
  google: 'gemini-flash-latest',
  groq: 'llama-3.3-70b-versatile',
  deepseek: 'deepseek-chat',
  mistral: 'mistral-large-latest',
  xai: 'grok-2-latest',
  cohere: 'command-r-plus',
  openrouter: 'openai/gpt-4o',
  perplexity: 'sonar-pro',
  together: 'meta-llama/Llama-3.3-70B-Instruct-Turbo',
  fireworks: 'accounts/fireworks/models/llama-v3p3-70b-instruct',
  azure: 'gpt-4o',
  bedrock: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
  custom: 'custom-model',
};

export function detectProviderFromModel(modelName: string): ProviderId {
  const m = modelName.toLowerCase();
  if (m.includes('gemini')) return 'google';
  if (m.includes('claude')) return 'anthropic';
  if (m.includes('gpt-') || m.startsWith('o1') || m.startsWith('o3') || m.includes('chatgpt')) return 'openai';
  if (m.includes('deepseek')) return 'deepseek';
  if (m.includes('grok')) return 'xai';
  if (m.includes('mistral') || m.includes('codestral') || m.includes('mixtral')) return 'mistral';
  if (m.includes('sonar') || m.includes('pplx')) return 'perplexity';
  if (m.includes('command')) return 'cohere';
  if (m.includes('groq') || m.includes('llama')) return 'groq';
  if (m.includes('together')) return 'together';
  if (m.includes('fireworks')) return 'fireworks';
  return 'openai';
}
