import * as vscode from 'vscode';
import { OpenAITranslator } from '../services/openaiTranslator';
import { TranslationResultView } from '../ui/translationResultView';

export function registerTranslationCommands(
  context: vscode.ExtensionContext,
  openaiTranslator: OpenAITranslator,
) {
  // 注册翻译命令
  const translateCommand = vscode.commands.registerCommand(
    'yuelu-translate.translateToEnglish',
    async () => {
      const editor = vscode.window.activeTextEditor;
      if (editor) {
        const selection = editor.selection;
        const text = editor.document.getText(selection);
        if (text.length > 0) {
          try {
            if (!openaiTranslator.isConfigValid()) {
              const result = await vscode.window.showWarningMessage(
                '请先配置OpenAI API密钥',
                '立即配置',
              );
              if (result === '立即配置') {
                vscode.commands.executeCommand(
                  'yuelu-translate.configureOpenAI',
                );
              }
              return;
            }
            await vscode.window.withProgress(
              {
                location: vscode.ProgressLocation.Notification,
                title: '正在翻译...',
                cancellable: false,
              },
              async (progress) => {
                try {
                  const translationResult =
                    await openaiTranslator.translateToEnglish(text);
                  TranslationResultView.show(
                    text,
                    translationResult.text,
                    translationResult.fromCache,
                  );
                  if (translationResult.fromCache) {
                    progress.report({ message: '从缓存中获取翻译结果' });
                  }
                } catch (error) {
                  if (error instanceof Error) {
                    vscode.window.showErrorMessage(error.message);
                  } else {
                    vscode.window.showErrorMessage('翻译过程中发生未知错误');
                  }
                }
              },
            );
          } catch (error) {
            if (error instanceof Error) {
              vscode.window.showErrorMessage(error.message);
            } else {
              vscode.window.showErrorMessage('翻译过程中发生未知错误');
            }
          }
        } else {
          vscode.window.showWarningMessage('请先选择要翻译的文本');
        }
      }
    },
  );

  // 注册配置OpenAI命令
  const configureOpenAICommand = vscode.commands.registerCommand(
    'yuelu-translate.configureOpenAI',
    async () => {
      const configuration = vscode.workspace.getConfiguration(
        'yuelu-translate.openai',
      );
      const apiKey = await vscode.window.showInputBox({
        prompt: '请输入OpenAI API密钥',
        password: true,
        value: configuration.get<string>('apiKey', ''),
      });
      if (apiKey !== undefined) {
        await configuration.update(
          'apiKey',
          apiKey,
          vscode.ConfigurationTarget.Global,
        );
      } else {
        return;
      }
      const baseURL = await vscode.window.showInputBox({
        prompt: '请输入OpenAI API基础URL',
        value: configuration.get<string>('baseURL', ''),
      });
      if (baseURL !== undefined) {
        await configuration.update(
          'baseURL',
          baseURL,
          vscode.ConfigurationTarget.Global,
        );
      } else {
        return;
      }
      const currentModel = configuration.get<string>('model', '');
      const model = await vscode.window.showInputBox({
        prompt: '请输入模型名称',
        value: currentModel,
        placeHolder: '例如: THUDM/GLM-4-9B-0414, gpt-3.5-turbo, gpt-4-turbo 等',
      });
      if (model !== undefined) {
        await configuration.update(
          'model',
          model,
          vscode.ConfigurationTarget.Global,
        );
      }
      openaiTranslator.updateConfig();
      vscode.window.showInformationMessage('OpenAI配置已更新');
    },
  );

  // 注册清除翻译缓存命令
  const clearCacheCommand = vscode.commands.registerCommand(
    'yuelu-translate.clearTranslationCache',
    () => {
      openaiTranslator.clearCache();
      vscode.window.showInformationMessage('翻译缓存已清除');
    },
  );

  context.subscriptions.push(translateCommand);
  context.subscriptions.push(configureOpenAICommand);
  context.subscriptions.push(clearCacheCommand);
}
