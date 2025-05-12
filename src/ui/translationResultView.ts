import * as vscode from 'vscode';

/**
 * 翻译结果视图提供者
 */
export class TranslationResultView {
  private static panel: vscode.WebviewPanel | undefined;
  private static currentText: string = '';
  private static currentResult: string = '';
  private static isFromCache: boolean = false;

  /**
   * 创建或显示翻译结果视图
   * @param text 原始文本
   * @param result 翻译结果
   * @param fromCache 是否来自缓存
   */
  public static show(
    text: string,
    result: string,
    fromCache: boolean = false,
  ): void {
    this.currentText = text;
    this.currentResult = result;
    this.isFromCache = fromCache;

    if (this.panel) {
      // 如果面板已经存在，则显示并更新内容
      this.panel.reveal();
      this.updateContent();
    } else {
      // 创建新的面板
      this.panel = vscode.window.createWebviewPanel(
        'translationResult',
        '月鹿翻译结果',
        vscode.ViewColumn.Beside,
        {
          enableScripts: true,
          retainContextWhenHidden: true,
        },
      );

      // 设置HTML内容
      this.updateContent();

      // 监听面板关闭事件
      this.panel.onDidDispose(() => {
        this.panel = undefined;
      }, null);

      // 处理来自WebView的消息
      this.panel.webview.onDidReceiveMessage((message) => {
        switch (message.command) {
          case 'copy':
            vscode.env.clipboard.writeText(this.currentResult);
            vscode.window.showInformationMessage('翻译结果已复制到剪贴板');
            break;
          case 'insert':
            const editor = vscode.window.activeTextEditor;
            if (editor) {
              editor.edit((editBuilder) => {
                const selection = editor.selection;
                editBuilder.replace(selection, this.currentResult);
              });
              vscode.window.showInformationMessage('翻译结果已插入到编辑器');
            }
            break;
        }
      }, undefined);
    }
  }

  /**
   * 更新面板内容
   */
  private static updateContent(): void {
    if (!this.panel) {
      return;
    }

    this.panel.webview.html = this.getHtmlContent();
  }

  /**
   * 获取HTML内容
   */
  private static getHtmlContent(): string {
    return `<!DOCTYPE html>
    <html lang="zh-CN">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>月鹿翻译结果</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe WPC', 'Segoe UI', system-ui, 'Ubuntu', 'Droid Sans', sans-serif;
          padding: 0 20px;
          color: var(--vscode-editor-foreground);
          font-size: 14px;
          background-color: var(--vscode-editor-background);
        }
        .container {
          margin-top: 20px;
        }
        .section {
          margin-bottom: 20px;
        }
        .title {
          font-size: 16px;
          font-weight: bold;
          margin-bottom: 8px;
          color: var(--vscode-editor-foreground);
        }
        .content {
          border: 1px solid var(--vscode-panel-border);
          background-color: var(--vscode-input-background);
          padding: 10px;
          border-radius: 4px;
          white-space: pre-wrap;
          overflow-wrap: break-word;
        }
        .buttons {
          margin-top: 20px;
          display: flex;
          gap: 10px;
        }
        button {
          padding: 6px 12px;
          background-color: var(--vscode-button-background);
          color: var(--vscode-button-foreground);
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }
        button:hover {
          background-color: var(--vscode-button-hoverBackground);
        }
        .cache-badge {
          display: inline-block;
          background-color: var(--vscode-badge-background);
          color: var(--vscode-badge-foreground);
          font-size: 12px;
          padding: 2px 6px;
          border-radius: 4px;
          margin-left: 8px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="section">
          <div class="title">原文</div>
          <div class="content">${this.escapeHtml(this.currentText)}</div>
        </div>
        <div class="section">
          <div class="title">
            翻译结果
            ${
              this.isFromCache
                ? '<span class="cache-badge">来自缓存</span>'
                : ''
            }
          </div>
          <div class="content">${this.escapeHtml(this.currentResult)}</div>
        </div>
        <div class="buttons">
          <button id="copyBtn">复制结果</button>
          <button id="insertBtn">插入到编辑器</button>
        </div>
      </div>
      <script>
        const vscode = acquireVsCodeApi();
        
        document.getElementById('copyBtn').addEventListener('click', () => {
          vscode.postMessage({
            command: 'copy'
          });
        });
        
        document.getElementById('insertBtn').addEventListener('click', () => {
          vscode.postMessage({
            command: 'insert'
          });
        });
      </script>
    </body>
    </html>`;
  }

  /**
   * 转义HTML特殊字符
   */
  private static escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')
      .replace(/\n/g, '<br>');
  }
}
