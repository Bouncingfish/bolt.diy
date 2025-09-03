import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { streamText, type StreamingOptions } from './stream-text';
import type { Message } from 'ai';
import { LLMManager } from '~/lib/modules/llm/manager';

// Mock dependencies
vi.mock('~/lib/modules/llm/manager');
vi.mock('~/lib/common/prompts/prompts', () => ({
  getSystemPrompt: vi.fn(() => 'System prompt'),
}));
vi.mock('~/utils/constants', () => ({
  DEFAULT_MODEL: 'gpt-4',
  DEFAULT_PROVIDER: { name: 'OpenAI' },
  PROVIDER_LIST: [{ name: 'OpenAI' }, { name: 'Claude Code' }],
  WORK_DIR: '/home/project',
  MODIFICATIONS_TAG_NAME: 'bolt_file_modifications',
}));

describe('Chat Message Flow - streamText', () => {
  let mockLLMManager: any;
  let mockProvider: any;
  let mockModelInstance: any;

  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks();

    // Mock model instance with streaming capabilities
    mockModelInstance = {
      doStream: vi.fn(() => Promise.resolve({
        stream: new ReadableStream({
          start(controller) {
            controller.enqueue({
              type: 'text-delta',
              textDelta: 'Hello',
            });
            controller.enqueue({
              type: 'text-delta', 
              textDelta: ' World',
            });
            controller.enqueue({
              type: 'finish',
              finishReason: 'stop',
              usage: { promptTokens: 10, completionTokens: 5 },
            });
            controller.close();
          }
        }),
      })),
      provider: 'openai',
      modelId: 'gpt-4',
    };

    // Mock provider
    mockProvider = {
      name: 'OpenAI',
      getModelInstance: vi.fn(() => mockModelInstance),
    };

    // Mock LLMManager
    mockLLMManager = {
      getProvider: vi.fn(() => mockProvider),
      getModelList: vi.fn(() => [
        {
          name: 'gpt-4',
          label: 'GPT-4',
          provider: 'OpenAI',
          maxTokenAllowed: 128000,
          maxCompletionTokens: 4096,
        }
      ]),
    };

    // Mock LLMManager.getInstance
    vi.mocked(LLMManager.getInstance).mockReturnValue(mockLLMManager);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should handle basic message flow', async () => {
    const messages: Message[] = [
      { role: 'user', content: 'Hello, how are you?' }
    ];

    const options: StreamingOptions = {
      model: 'gpt-4',
      messages,
      maxTokens: 1000,
    };

    const result = await streamText(options);

    // Verify provider was called correctly
    expect(mockLLMManager.getProvider).toHaveBeenCalledWith('OpenAI');
    expect(mockProvider.getModelInstance).toHaveBeenCalled();
    expect(mockModelInstance.doStream).toHaveBeenCalled();

    // Verify stream is returned
    expect(result).toBeDefined();
    expect(typeof result.then).toBe('function'); // It's a promise
  });

  it('should handle user message with system prompt', async () => {
    const messages: Message[] = [
      { role: 'user', content: 'Create a React component' }
    ];

    const options: StreamingOptions = {
      model: 'gpt-4', 
      messages,
      maxTokens: 2000,
    };

    await streamText(options);

    // Verify doStream was called with correct parameters
    const streamCall = mockModelInstance.doStream.mock.calls[0][0];
    expect(streamCall.prompt).toBeDefined();
    expect(streamCall.prompt.some((p: any) => p.role === 'system')).toBe(true);
  });

  it('should handle streaming response correctly', async () => {
    const messages: Message[] = [
      { role: 'user', content: 'Write a simple function' }
    ];

    const options: StreamingOptions = {
      model: 'gpt-4',
      messages,
    };

    const streamPromise = streamText(options);
    
    // Verify the stream was initiated
    expect(streamPromise).toBeDefined();
    await expect(streamPromise).resolves.toBeDefined();
  });

  it('should handle provider errors gracefully', async () => {
    // Mock provider to throw an error
    mockLLMManager.getProvider.mockReturnValue(null);

    const messages: Message[] = [
      { role: 'user', content: 'Test message' }
    ];

    const options: StreamingOptions = {
      model: 'invalid-model',
      messages,
    };

    await expect(streamText(options)).rejects.toThrow();
  });

  it('should handle empty message list', async () => {
    const messages: Message[] = [];

    const options: StreamingOptions = {
      model: 'gpt-4',
      messages,
    };

    const result = await streamText(options);
    expect(result).toBeDefined();
  });

  it('should respect token limits', async () => {
    const messages: Message[] = [
      { role: 'user', content: 'Generate a very long response' }
    ];

    const options: StreamingOptions = {
      model: 'gpt-4',
      messages,
      maxTokens: 100, // Low limit
    };

    await streamText(options);

    // Verify the model was called with token limits
    const streamCall = mockModelInstance.doStream.mock.calls[0][0];
    expect(streamCall.maxTokens).toBeDefined();
  });

  it('should handle conversation context', async () => {
    const messages: Message[] = [
      { role: 'user', content: 'Hello' },
      { role: 'assistant', content: 'Hi there!' },
      { role: 'user', content: 'How can you help me?' }
    ];

    const options: StreamingOptions = {
      model: 'gpt-4',
      messages,
    };

    await streamText(options);

    // Verify all messages were included in the prompt
    const streamCall = mockModelInstance.doStream.mock.calls[0][0];
    expect(streamCall.prompt.filter((p: any) => p.role === 'user')).toHaveLength(2);
    expect(streamCall.prompt.filter((p: any) => p.role === 'assistant')).toHaveLength(1);
  });
});