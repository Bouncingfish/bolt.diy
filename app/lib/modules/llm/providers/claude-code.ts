import { BaseProvider } from '~/lib/modules/llm/base-provider';
import type { ModelInfo } from '~/lib/modules/llm/types';
import type { LanguageModelV1 } from 'ai';
import type { IProviderSetting } from '~/types/model';
import { createAnthropic } from '@ai-sdk/anthropic';

export default class ClaudeCodeProvider extends BaseProvider {
  name = 'Claude Code';
  getApiKeyLink = 'https://docs.anthropic.com/en/docs/claude-code/setup';
  labelForGetApiKey = 'Get Claude Code CLI';

  config = {
    apiTokenKey: 'CLAUDE_CODE_PATH',
  };

  staticModels: ModelInfo[] = [
    {
      name: 'claude-sonnet-4-20250514',
      label: 'Claude 4 Sonnet (via Claude Code)',
      provider: 'Claude Code',
      maxTokenAllowed: 1000000,
      maxCompletionTokens: 64000,
    },
    {
      name: 'claude-opus-4-20250514',
      label: 'Claude 4 Opus (via Claude Code)',
      provider: 'Claude Code',
      maxTokenAllowed: 200000,
      maxCompletionTokens: 32000,
    },
    {
      name: 'claude-3-5-sonnet-20241022',
      label: 'Claude 3.5 Sonnet (via Claude Code)',
      provider: 'Claude Code',
      maxTokenAllowed: 200000,
      maxCompletionTokens: 128000,
    },
    {
      name: 'claude-3-5-haiku-20241022',
      label: 'Claude 3.5 Haiku (via Claude Code)',
      provider: 'Claude Code',
      maxTokenAllowed: 200000,
      maxCompletionTokens: 128000,
    },
  ];

  getModelInstance: (options: {
    model: string;
    serverEnv: Env;
    apiKeys?: Record<string, string>;
    providerSettings?: Record<string, IProviderSetting>;
  }) => LanguageModelV1 = (options) => {
    const { model, apiKeys, providerSettings, serverEnv } = options;
    
    // For now, use your Max account via Anthropic API
    // The CLAUDE_CODE_PATH can be configured for future CLI integration
    const { apiKey } = this.getProviderBaseUrlAndKey({
      apiKeys,
      providerSettings: providerSettings?.[this.name],
      serverEnv: serverEnv as any,
      defaultBaseUrlKey: '',
      defaultApiTokenKey: 'ANTHROPIC_API_KEY',
    });

    const anthropic = createAnthropic({
      apiKey,
      headers: { 
        'anthropic-beta': 'output-128k-2025-02-19',
        'user-agent': 'bolt.diy-claude-code-provider'
      },
    });

    return anthropic(model);
  };
}