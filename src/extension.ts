// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { OpenAITranslator } from './services/openaiTranslator';
import { TranslationResultView } from './ui/translationResultView';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log(
    'Congratulations, your extension "yuelu-translate" is now active!',
  );

  // 创建OpenAI翻译器实例
  const openaiTranslator = new OpenAITranslator();

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  const disposable = vscode.commands.registerCommand(
    'yuelu-translate.helloWorld',
    () => {
      // The code you place here will be executed every time your command is executed
      // Display a message box to the user
      vscode.window.showInformationMessage('Hello World from 月鹿翻译!');
    },
  );

  // 注册翻译命令
  const translateCommand = vscode.commands.registerCommand(
    'yuelu-translate.translateToEnglish',
    async () => {
      // 获取活动编辑器
      const editor = vscode.window.activeTextEditor;

      if (editor) {
        // 获取选中的文本
        const selection = editor.selection;
        const text = editor.document.getText(selection);

        if (text.length > 0) {
          try {
            // 检查是否已配置API密钥
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

            // 显示进度条
            await vscode.window.withProgress(
              {
                location: vscode.ProgressLocation.Notification,
                title: '正在翻译...',
                cancellable: false,
              },
              async (progress) => {
                try {
                  // 调用OpenAI API进行翻译
                  const translationResult =
                    await openaiTranslator.translateToEnglish(text);

                  // 显示翻译结果
                  TranslationResultView.show(
                    text,
                    translationResult.text,
                    translationResult.fromCache,
                  );

                  // 如果结果来自缓存，显示提示
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
      // 获取当前配置
      const configuration = vscode.workspace.getConfiguration(
        'yuelu-translate.openai',
      );

      // 获取API密钥
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
        return; // 用户取消了输入
      }

      // 获取基础URL
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
        return; // 用户取消了输入
      }

      // 获取模型名称
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

      // 更新翻译器配置
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

  /**
   * 检查文本是否包含中文字符
   * @param text 要检查的文本
   * @returns 如果包含中文则返回true，否则返回false
   */
  function containsChinese(text: string): boolean {
    // Unicode范围：中文字符的Unicode编码范围
    const chineseRegex = /[\u4e00-\u9fa5]/;
    return chineseRegex.test(text);
  }

  // 注册大小写转换命令
  const changeCaseCommand = vscode.commands.registerCommand(
    'yuelu-translate.changeCase',
    async () => {
      // 获取活动编辑器
      const editor = vscode.window.activeTextEditor;

      if (!editor) {
        return;
      }

      // 获取选中的文本
      const selection = editor.selection;
      const text = editor.document.getText(selection);

      if (text.length === 0) {
        vscode.window.showWarningMessage('请先选择要转换格式的文本');
        return;
      }

      // 检查是否包含中文
      if (containsChinese(text)) {
        vscode.window.showWarningMessage(
          '选中的文本包含中文，无法进行格式转换',
        );
        return;
      }

      try {
        // 动态导入 change-case
        const changeCase = await import('change-case');

        // 定义可用的转换选项
        interface CaseOption {
          label: string;
          transform: (s: string) => string;
        }

        const exampleText = 'example text';

        const caseOptions: CaseOption[] = [
          {
            label: `${changeCase.camelCase(
              exampleText,
            )} - 小驼峰格式 (camelCase)`,
            transform: changeCase.camelCase,
          },
          {
            label: `${changeCase.pascalCase(
              exampleText,
            )} - 大驼峰格式 (pascalCase)`,
            transform: changeCase.pascalCase,
          },
          {
            label: `${changeCase.constantCase(
              exampleText,
            )} - 常量格式 (constantCase)`,
            transform: changeCase.constantCase,
          },
          {
            label: `${changeCase.dotCase(exampleText)} - 点分隔格式 (dotCase)`,
            transform: changeCase.dotCase,
          },
          {
            label: `${changeCase.kebabCase(
              exampleText,
            )} - 短横线格式 (kebabCase)`,
            transform: changeCase.kebabCase,
          },
          {
            label: `${changeCase.snakeCase(
              exampleText,
            )} - 下划线格式 (snakeCase)`,
            transform: changeCase.snakeCase,
          },
          {
            label: `${changeCase.pathCase(exampleText)} - 路径格式 (pathCase)`,
            transform: changeCase.pathCase,
          },
          {
            label: `${changeCase.sentenceCase(
              exampleText,
            )} - 句子格式 (sentenceCase)`,
            transform: changeCase.sentenceCase,
          },
          {
            label: `${changeCase.capitalCase(
              exampleText,
            )} - 大写格式 (capitalCase)`,
            transform: changeCase.capitalCase,
          },
          {
            label: `${changeCase.noCase(exampleText)} - 无格式 (noCase)`,
            transform: changeCase.noCase,
          },
          // kebabCase 就是 paramCase，它们是同一个函数
          {
            label: `${changeCase.kebabCase(
              exampleText,
            )} - 参数格式 (paramCase)`,
            transform: changeCase.kebabCase,
          },
          {
            label: `${changeCase.trainCase(
              exampleText,
            )} - 火车格式 (trainCase)`,
            transform: changeCase.trainCase,
          },
        ];

        // 显示选择框
        const selectedOption = await vscode.window.showQuickPick(caseOptions, {
          placeHolder: '请选择转换格式',
        });

        if (selectedOption) {
          // 转换文本
          const transformedText = selectedOption.transform(text);

          // 替换编辑器中选中的文本
          editor.edit((editBuilder) => {
            editBuilder.replace(selection, transformedText);
          });
        }
      } catch (error) {
        vscode.window.showErrorMessage(
          `转换格式出错: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }
    },
  );

  context.subscriptions.push(disposable);
  context.subscriptions.push(translateCommand);
  context.subscriptions.push(changeCaseCommand);
  context.subscriptions.push(configureOpenAICommand);
  context.subscriptions.push(clearCacheCommand);
}

// This method is called when your extension is deactivated
export function deactivate() {}
