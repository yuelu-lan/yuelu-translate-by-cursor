import OpenAI from 'openai';
import * as vscode from 'vscode';

export interface OpenAIConfig {
  apiKey: string;
  baseURL: string;
  model: string;
}

/**
 * 翻译缓存项
 */
interface TranslationCacheItem {
  sourceText: string;
  translatedText: string;
  timestamp: number;
}

/**
 * 翻译结果
 */
export interface TranslationResult {
  text: string;
  fromCache: boolean;
}

export class OpenAITranslator {
  private config: OpenAIConfig;
  private client: OpenAI | null = null;
  // 翻译缓存
  private translationCache: Map<string, TranslationCacheItem> = new Map();
  // 缓存有效期（毫秒），默认24小时
  private readonly CACHE_TTL = 24 * 60 * 60 * 1000;

  constructor() {
    // 从VS Code配置中获取配置信息
    const configuration = vscode.workspace.getConfiguration(
      'yuelu-translate.openai',
    );

    // 设置默认配置，特别是在本地调试时
    this.config = {
      apiKey: configuration.get<string>(
        'apiKey',
        'sk-unhnucgvfmohtdfjseyetrnioziyhchukdeaggkalzkqwydi',
      ),
      baseURL: configuration.get<string>(
        'baseURL',
        'https://api.siliconflow.cn/v1',
      ),
      model: configuration.get<string>('model', 'THUDM/GLM-4-9B-0414'),
    };

    this.initClient();
  }

  /**
   * 初始化OpenAI客户端
   */
  private initClient(): void {
    if (this.isConfigValid()) {
      this.client = new OpenAI({
        apiKey: this.config.apiKey,
        baseURL: this.config.baseURL,
      });
    } else {
      this.client = null;
    }
  }

  /**
   * 检查配置是否有效
   */
  public isConfigValid(): boolean {
    return !!this.config.apiKey;
  }

  /**
   * 检查缓存中是否有有效的翻译结果
   * @param text 要检查的文本
   * @returns 如果缓存有效返回翻译结果，否则返回null
   */
  private getCachedTranslation(text: string): string | null {
    const cacheKey = this.generateCacheKey(text);
    const cachedItem = this.translationCache.get(cacheKey);

    if (cachedItem) {
      const now = Date.now();
      // 检查缓存是否过期
      if (now - cachedItem.timestamp < this.CACHE_TTL) {
        return cachedItem.translatedText;
      } else {
        // 删除过期缓存
        this.translationCache.delete(cacheKey);
      }
    }

    return null;
  }

  /**
   * 将翻译结果存入缓存
   * @param sourceText 原文
   * @param translatedText 翻译结果
   */
  private cacheTranslation(sourceText: string, translatedText: string): void {
    const cacheKey = this.generateCacheKey(sourceText);
    this.translationCache.set(cacheKey, {
      sourceText,
      translatedText,
      timestamp: Date.now(),
    });

    // 缓存管理：如果缓存项太多，可以考虑删除最旧的项
    if (this.translationCache.size > 100) {
      const oldestKey = this.getOldestCacheKey();
      if (oldestKey) {
        this.translationCache.delete(oldestKey);
      }
    }
  }

  /**
   * 获取缓存中最旧的项的键
   */
  private getOldestCacheKey(): string | null {
    let oldestTimestamp = Infinity;
    let oldestKey: string | null = null;

    for (const [key, item] of this.translationCache.entries()) {
      if (item.timestamp < oldestTimestamp) {
        oldestTimestamp = item.timestamp;
        oldestKey = key;
      }
    }

    return oldestKey;
  }

  /**
   * 为文本生成缓存键
   * @param text 要生成键的文本
   */
  private generateCacheKey(text: string): string {
    // 简单使用文本作为键，可以考虑使用哈希函数
    return text.trim();
  }

  /**
   * 使用OpenAI API将中文翻译成英文
   * @param text 要翻译的中文文本
   * @returns 翻译结果，包含文本和是否来自缓存的信息
   */
  public async translateToEnglish(text: string): Promise<TranslationResult> {
    if (!this.isConfigValid()) {
      throw new Error('请先配置OpenAI API密钥');
    }

    // 检查缓存
    const cachedTranslation = this.getCachedTranslation(text);
    if (cachedTranslation) {
      console.log('使用缓存的翻译结果');
      return {
        text: cachedTranslation,
        fromCache: true,
      };
    }

    try {
      if (!this.client) {
        this.initClient();
      }

      if (!this.client) {
        throw new Error('无法初始化OpenAI客户端');
      }

      const completion = await this.client.chat.completions.create({
        model: this.config.model,
        messages: [
          {
            role: 'system',
            content:
              '您是一个专业的翻译助手，请将中文文本翻译成英文，保持原文的风格和意义，翻译要简洁准确。',
          },
          {
            role: 'user',
            content: `请将以下中文翻译成英文：${text}`,
          },
        ],
        temperature: 0.3,
        max_tokens: 2048,
      });

      if (completion.choices && completion.choices.length > 0) {
        const translatedText =
          completion.choices[0].message.content?.trim() || '';

        // 缓存翻译结果
        this.cacheTranslation(text, translatedText);

        return {
          text: translatedText,
          fromCache: false,
        };
      } else {
        throw new Error('翻译失败：API返回的数据格式有误');
      }
    } catch (error) {
      if (error instanceof OpenAI.APIError) {
        throw new Error(`翻译失败：${error.status} ${error.message}`);
      } else {
        const err = error as Error;
        throw new Error(`翻译失败：${err.message || '未知错误'}`);
      }
    }
  }

  /**
   * 更新配置
   */
  public updateConfig(): void {
    const configuration = vscode.workspace.getConfiguration(
      'yuelu-translate.openai',
    );
    this.config = {
      apiKey: configuration.get<string>(
        'apiKey',
        'sk-unhnucgvfmohtdfjseyetrnioziyhchukdeaggkalzkqwydi',
      ),
      baseURL: configuration.get<string>(
        'baseURL',
        'https://api.siliconflow.cn/v1',
      ),
      model: configuration.get<string>('model', 'THUDM/GLM-4-9B-0414'),
    };

    // 更新OpenAI客户端
    this.initClient();
  }

  /**
   * 清除翻译缓存
   */
  public clearCache(): void {
    this.translationCache.clear();
  }
}
