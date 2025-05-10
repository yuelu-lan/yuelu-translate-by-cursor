// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log(
    'Congratulations, your extension "yuelu-translate" is now active!',
  );

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
    () => {
      // 获取活动编辑器
      const editor = vscode.window.activeTextEditor;

      if (editor) {
        // 获取选中的文本
        const selection = editor.selection;
        const text = editor.document.getText(selection);

        if (text.length > 0) {
          // 暂时返回"功能开发中"
          vscode.window.showInformationMessage('功能开发中');
        } else {
          vscode.window.showWarningMessage('请先选择要翻译的文本');
        }
      }
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
}

// This method is called when your extension is deactivated
export function deactivate() {}
