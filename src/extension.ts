// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as dotenv from 'dotenv';
import * as vscode from 'vscode';
import { OpenAITranslator } from './services/openaiTranslator';
// import { TranslationResultView } from './ui/translationResultView'; // No longer directly used here
import { registerCaseConversionCommands } from './commands/caseConversionCommands';
import { registerTranslationCommands } from './commands/translationCommands';

if (process.env.NODE_ENV === 'development') {
  dotenv.config();
}

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

  // 注册翻译相关命令
  registerTranslationCommands(context, openaiTranslator);

  // 注册大小写转换相关命令
  registerCaseConversionCommands(context);
}

// This method is called when your extension is deactivated
export function deactivate() {}
