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

      try {
        // 动态导入 change-case
        const changeCase = await import('change-case');

        // 定义可用的转换选项
        interface CaseOption {
          label: string;
          transform: (s: string) => string;
        }

        const caseOptions: CaseOption[] = [
          { label: '小驼峰格式 (camelCase)', transform: changeCase.camelCase },
          {
            label: '大驼峰格式 (pascalCase)',
            transform: changeCase.pascalCase,
          },
          {
            label: '常量格式 (constantCase)',
            transform: changeCase.constantCase,
          },
          { label: '点分隔格式 (dotCase)', transform: changeCase.dotCase },
          { label: '短横线格式 (kebabCase)', transform: changeCase.kebabCase },
          { label: '下划线格式 (snakeCase)', transform: changeCase.snakeCase },
          { label: '路径格式 (pathCase)', transform: changeCase.pathCase },
          {
            label: '句子格式 (sentenceCase)',
            transform: changeCase.sentenceCase,
          },
          {
            label: '大写格式 (capitalCase)',
            transform: changeCase.capitalCase,
          },
          { label: '无格式 (noCase)', transform: changeCase.noCase },
          // kebabCase 就是 paramCase，它们是同一个函数
          { label: '参数格式 (paramCase)', transform: changeCase.kebabCase },
          { label: '火车格式 (trainCase)', transform: changeCase.trainCase },
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
