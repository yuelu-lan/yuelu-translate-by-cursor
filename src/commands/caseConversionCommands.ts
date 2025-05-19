import * as vscode from 'vscode';

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

export function registerCaseConversionCommands(
  context: vscode.ExtensionContext,
) {
  // 注册大小写转换命令
  const changeCaseCommand = vscode.commands.registerCommand(
    'yuelu-translate.changeCase',
    async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        return;
      }
      const selection = editor.selection;
      const text = editor.document.getText(selection);
      if (text.length === 0) {
        vscode.window.showWarningMessage('请先选择要转换格式的文本');
        return;
      }
      if (containsChinese(text)) {
        vscode.window.showWarningMessage(
          '选中的文本包含中文，无法进行格式转换',
        );
        return;
      }
      try {
        const changeCase = await import('change-case');
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
        const selectedOption = await vscode.window.showQuickPick(caseOptions, {
          placeHolder: '请选择转换格式',
        });
        if (selectedOption) {
          const transformedText = selectedOption.transform(text);
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
  context.subscriptions.push(changeCaseCommand);
}
