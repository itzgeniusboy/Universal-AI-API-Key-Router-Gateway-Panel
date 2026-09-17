import { ProviderId, ProviderMeta } from '../types';

export const PROVIDERS: ProviderMeta[] = [
  {
    id: 'openai',
    name: 'OpenAI',
    category: 'Flagship',
    defaultModel: 'gpt-4o',
    popularModels: ['gpt-4o', 'gpt-4o-mini', 'o1', 'o3-mini'],
    keyPrefix: 'sk-',
    docUrl: 'https://platform.openai.com/api-keys',
    color: '#10A37F',
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    category: 'Flagship',
    defaultModel: 'claude-3-7-sonnet-latest',
    popularModels: ['claude-3-7-sonnet-latest', 'claude-3-5-haiku-latest', 'claude-3-opus-latest'],
    keyPrefix: 'sk-ant-',
    docUrl: 'https://console.anthropic.com/',
    color: '#D97706',
  },
  {
    id: 'google',
    name: 'Google AI Studio',
    category: 'Flagship',
    defaultModel: 'gemini-2.5-flash',
    popularModels: ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-2.0-flash'],
    keyPrefix: 'AIzaSy',
    docUrl: 'https://aistudio.google.com/app/apikey',
    color: '#4285F4',
  },
  {
    id: 'groq',
    name: 'Groq',
    category: 'Ultra-Fast',
    defaultModel: 'llama-3.3-70b-versatile',
    popularModels: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768'],
    keyPrefix: 'gsk_',
    docUrl: 'https://console.groq.com/keys',
    color: '#F55036',
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    category: 'Reasoning',
    defaultModel: 'deepseek-chat',
    popularModels: ['deepseek-chat', 'deepseek-reasoner'],
    keyPrefix: 'sk-',
    docUrl: 'https://platform.deepseek.com/api_keys',
    color: '#1E69FF',
  },
  {
    id: 'mistral',
    name: 'Mistral AI',
    category: 'Open Weights',
    defaultModel: 'mistral-large-latest',
    popularModels: ['mistral-large-latest', 'mistral-small-latest', 'codestral-latest'],
    keyPrefix: 'mis_',
    docUrl: 'https://console.mistral.ai/api-keys',
    color: '#FD5700',
  },
  {
    id: 'xai',
    name: 'xAI (Grok)',
    category: 'Frontier',
    defaultModel: 'grok-2-latest',
    popularModels: ['grok-2-latest', 'grok-beta'],
    keyPrefix: 'xai-',
    docUrl: 'https://console.x.ai/',
    color: '#A1A1AA',
  },
  {
    id: 'cohere',
    name: 'Cohere',
    category: 'Enterprise',
    defaultModel: 'command-r-plus',
    popularModels: ['command-r-plus', 'command-r'],
    keyPrefix: 'coh-',
    docUrl: 'https://dashboard.cohere.com/api-keys',
    color: '#39594C',
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    category: 'Aggregator',
    defaultModel: 'auto',
    popularModels: ['anthropic/claude-3.5-sonnet', 'openai/gpt-4o', 'meta-llama/llama-3.3-70b'],
    keyPrefix: 'sk-or-v1-',
    docUrl: 'https://openrouter.ai/keys',
    color: '#6366F1',
  },
  {
    id: 'perplexity',
    name: 'Perplexity',
    category: 'Search & Citations',
    defaultModel: 'sonar-pro',
    popularModels: ['sonar-pro', 'sonar', 'sonar-reasoning'],
    keyPrefix: 'pplx-',
    docUrl: 'https://www.perplexity.ai/settings/api',
    color: '#14B8A6',
  },
  {
    id: 'together',
    name: 'Together AI',
    category: 'Open Source Cloud',
    defaultModel: 'meta-llama/Llama-3.3-70B-Instruct-Turbo',
    popularModels: ['meta-llama/Llama-3.3-70B-Instruct-Turbo', 'deepseek-ai/DeepSeek-V3'],
    keyPrefix: 'tog_',
    docUrl: 'https://api.together.ai/settings/api-keys',
    color: '#3B82F6',
  },
  {
    id: 'fireworks',
    name: 'Fireworks AI',
    category: 'Inference',
    defaultModel: 'accounts/fireworks/models/llama-v3p3-70b-instruct',
    popularModels: ['llama-v3p3-70b-instruct', 'deepseek-v3'],
    keyPrefix: 'fw_',
    docUrl: 'https://fireworks.ai/api-keys',
    color: '#EC4899',
  },
  {
    id: 'azure',
    name: 'Azure OpenAI',
    category: 'Enterprise Cloud',
    defaultModel: 'gpt-4o',
    popularModels: ['gpt-4o', 'gpt-4o-mini'],
    keyPrefix: 'az-',
    docUrl: 'https://portal.azure.com/',
    color: '#0078D4',
  },
  {
    id: 'bedrock',
    name: 'AWS Bedrock',
    category: 'Enterprise Cloud',
    defaultModel: 'anthropic.claude-3-5-sonnet',
    popularModels: ['anthropic.claude-3-5-sonnet', 'amazon.titan-text-express-v1'],
    keyPrefix: 'AKIA',
    docUrl: 'https://aws.amazon.com/bedrock/',
    color: '#FF9900',
  },
  {
    id: 'custom',
    name: 'Custom / OpenAI-Compatible',
    category: 'Self-Hosted & Proxies',
    defaultModel: 'default',
    popularModels: ['local-model', 'custom-v1'],
    keyPrefix: '',
    docUrl: 'https://vllm.ai/',
    color: '#8B5CF6',
  },
];

export function detectProviderFromKey(key: string): ProviderId {
  const trimmed = key.trim();
  if (trimmed.startsWith('sk-ant-')) return 'anthropic';
  if (trimmed.startsWith('AIzaSy')) return 'google';
  if (trimmed.startsWith('gsk_')) return 'groq';
  if (trimmed.startsWith('sk-or-v1-')) return 'openrouter';
  if (trimmed.startsWith('pplx-')) return 'perplexity';
  if (trimmed.startsWith('xai-')) return 'xai';
  if (trimmed.startsWith('mis_')) return 'mistral';
  if (trimmed.startsWith('coh-')) return 'cohere';
  if (trimmed.startsWith('fw_')) return 'fireworks';
  if (trimmed.startsWith('tog_')) return 'together';
  if (trimmed.startsWith('AKIA')) return 'bedrock';
  if (trimmed.startsWith('sk-')) return 'openai'; // default sk- to openai
  return 'custom';
}

export function detectProviderFromModel(modelName: string): ProviderId {
  const m = modelName.toLowerCase();
  if (m.includes('claude')) return 'anthropic';
  if (m.includes('gemini') || m.includes('palm')) return 'google';
  if (m.includes('groq') || m.includes('instant') || m.includes('versatile')) return 'groq';
  if (m.includes('deepseek')) return 'deepseek';
  if (m.includes('mistral') || m.includes('codestral') || m.includes('mixtral')) return 'mistral';
  if (m.includes('grok')) return 'xai';
  if (m.includes('command') || m.includes('embed-english')) return 'cohere';
  if (m.includes('sonar')) return 'perplexity';
  if (m.includes('gpt') || m.includes('o1') || m.includes('o3') || m.includes('dall-e')) return 'openai';
  return 'openai';
}
