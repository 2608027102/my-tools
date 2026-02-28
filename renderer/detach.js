// 使用DOMContentLoaded确保所有DOM元素都已加载完成
document.addEventListener('DOMContentLoaded', function() {
  window.electronAPI.log('Detach window DOM content loaded');
  
  const pluginContent = document.getElementById('pluginContent');
  let pluginState = null;
  
  // 初始化窗口控制按钮
  initWindowControls();
  
  // 监听初始化事件
  window.electronAPI.onInitializeDetachWindow((event, data) => {
    window.electronAPI.log('Initializing detach window with data: %s', JSON.stringify(data));
    pluginState = data.pluginState;
    renderPluginContent(pluginState);
  });
  
  // 监听插件命令执行结果
  window.electronAPI.onPluginCommandExecutedInDetach((event, result) => {
    window.electronAPI.log('Plugin command executed in detach window: %s', JSON.stringify(result));
    handlePluginCommandResult(result);
  });
  
  function initWindowControls() {
    // 最小化按钮
    document.getElementById('minimizeBtn').addEventListener('click', () => {
      window.electronAPI.minimizeDetachWindow();
    });
    
    // 最大化按钮
    document.getElementById('maximizeBtn').addEventListener('click', () => {
      window.electronAPI.maximizeDetachWindow();
    });
    
    // 置顶按钮
    document.getElementById('pinBtn').addEventListener('click', () => {
      window.electronAPI.toggleAlwaysOnTop();
    });
    
    // 关闭按钮
    document.getElementById('closeBtn').addEventListener('click', () => {
      // 同步插件状态
      window.electronAPI.syncPluginState(pluginState);
      // 关闭窗口
      window.electronAPI.closeDetachWindow();
    });
  }
  
  function renderPluginContent(state) {
    window.electronAPI.log('Rendering plugin content with state: %s', JSON.stringify(state));
    if (!state || !state.isRunning) {
      pluginContent.innerHTML = '<div style="text-align: center; margin-top: 50px;">无插件内容</div>';
      return;
    }
    
    switch (state.type) {
      case 'logs':
        renderPluginLogs(state.data);
        break;
      case 'result':
        renderPluginResult(state.data);
        break;
      case 'html':
        renderPluginHtml(state.data);
        break;
      default:
        pluginContent.innerHTML = '<div style="text-align: center; margin-top: 50px;">未知插件状态</div>';
    }
  }
  
  function renderPluginLogs(logs) {
    window.electronAPI.log('Rendering plugin logs: %s', JSON.stringify(logs));
    
    const logsContainer = document.createElement('div');
    logsContainer.className = 'plugin-logs';
    
    const logsHeader = document.createElement('div');
    logsHeader.className = 'plugin-logs-header';
    logsHeader.innerHTML = '<div class="plugin-logs-title">插件执行日志</div>';
    logsContainer.appendChild(logsHeader);
    
    const logsContent = document.createElement('div');
    logsContent.className = 'plugin-logs-content';
    
    logs.forEach(log => {
      const logItem = document.createElement('div');
      logItem.className = 'plugin-log-item';
      logItem.textContent = log;
      logsContent.appendChild(logItem);
    });
    
    logsContainer.appendChild(logsContent);
    pluginContent.appendChild(logsContainer);
  }
  
  function renderPluginResult(result) {
    window.electronAPI.log('Rendering plugin result: %s', JSON.stringify(result));
    
    const resultContainer = document.createElement('div');
    resultContainer.className = 'plugin-result';
    
    const resultHeader = document.createElement('div');
    resultHeader.className = 'plugin-result-header';
    resultHeader.innerHTML = '<div class="plugin-result-title">插件执行结果</div>';
    resultContainer.appendChild(resultHeader);
    
    const resultContent = document.createElement('div');
    resultContent.className = 'plugin-result-content';
    
    let resultText = '';
    if (typeof result === 'object' && result !== null) {
      if (result.success && result.result) {
        resultText = result.result;
      } else {
        resultText = JSON.stringify(result, null, 2);
      }
    } else {
      resultText = String(result);
    }
    
    const resultItem = document.createElement('div');
    resultItem.className = 'plugin-result-item';
    resultItem.textContent = resultText;
    resultContent.appendChild(resultItem);
    
    resultContainer.appendChild(resultContent);
    pluginContent.appendChild(resultContainer);
  }
  
  function renderPluginHtml(htmlData) {
    window.electronAPI.log('Rendering plugin HTML: %s', JSON.stringify(htmlData));
    
    // 使用iframe来隔离HTML内容
    const iframe = document.createElement('iframe');
    iframe.className = 'plugin-html-iframe full-height';
    iframe.style.border = 'none';
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    
    // 创建完整的HTML文档
    const htmlDoc = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>${htmlData.title || '插件内容'}</title>
        <style>
          body {
            margin: 0;
            padding: 10px;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: rgba(0, 0, 0, 0.95);
            color: white;
          }
          ${htmlData.styles || ''}
        </style>
      </head>
      <body>
        ${htmlData.content}
      </body>
      </html>
    `;
    
    // 设置iframe内容
    iframe.srcdoc = htmlDoc;
    pluginContent.appendChild(iframe);
  }
  
  function handlePluginCommandResult(result) {
    window.electronAPI.log('Handling plugin command result: %s', JSON.stringify(result));
    
    // 清空当前内容
    pluginContent.innerHTML = '';
    
    if (result.success) {
      if (result.isList && Array.isArray(result.result)) {
        // 处理列表结果
        renderPluginList(result.result);
      } else if (result.isPrompt) {
        // 处理prompt请求
        renderPluginPrompt(result.result);
      } else if (result.isHtml) {
        // 处理HTML内容
        renderPluginHtml(result.result);
        pluginState = {
          isRunning: true,
          type: 'html',
          data: result.result
        };
      } else {
        // 处理其他结果
        renderPluginResult(result.result);
        pluginState = {
          isRunning: true,
          type: 'result',
          data: result.result
        };
      }
    } else {
      // 显示错误信息
      renderPluginResult({ success: false, error: result.error });
      pluginState = {
        isRunning: true,
        type: 'result',
        data: { success: false, error: result.error }
      };
    }
  }
  
  function renderPluginList(listItems) {
    window.electronAPI.log('Rendering plugin list: %s', JSON.stringify(listItems));
    
    const listSelection = document.createElement('div');
    listSelection.className = 'list-selection';
    
    listItems.forEach((item, index) => {
      const listItem = document.createElement('div');
      listItem.className = 'list-selection-item';
      
      let subtitle = '';
      if (item.description) {
        subtitle = item.description;
      } else if (item.command) {
        subtitle = item.command;
      }
      
      listItem.innerHTML = `
        <div class="list-selection-title">${item.name}</div>
        <div class="list-selection-subtitle">${subtitle}</div>
      `;
      
      listItem.addEventListener('click', () => {
        // 执行列表项
        window.electronAPI.executePluginCommandInDetach({
          pluginId: listItems.pluginId,
          commandId: listItems.commandId,
          params: item
        });
      });
      
      listSelection.appendChild(listItem);
    });
    
    pluginContent.appendChild(listSelection);
  }
  
  function renderPluginPrompt(promptData) {
    window.electronAPI.log('Rendering plugin prompt: %s', JSON.stringify(promptData));
    
    const promptContainer = document.createElement('div');
    promptContainer.className = 'plugin-prompt';
    
    const promptHeader = document.createElement('div');
    promptHeader.className = 'plugin-prompt-header';
    promptHeader.innerHTML = `<div class="plugin-prompt-title">${promptData.title || '请输入'}</div>`;
    promptContainer.appendChild(promptHeader);
    
    const promptContent = document.createElement('div');
    promptContent.className = 'plugin-prompt-content';
    
    const inputElement = document.createElement('input');
    inputElement.type = 'text';
    inputElement.className = 'plugin-prompt-input';
    inputElement.placeholder = promptData.placeholder || '';
    inputElement.value = promptData.defaultValue || '';
    inputElement.autofocus = true;
    promptContent.appendChild(inputElement);
    
    const promptFooter = document.createElement('div');
    promptFooter.className = 'plugin-prompt-footer';
    
    const cancelButton = document.createElement('button');
    cancelButton.className = 'plugin-prompt-button cancel';
    cancelButton.textContent = '取消';
    cancelButton.addEventListener('click', () => {
      // 关闭prompt
      promptContainer.remove();
    });
    promptFooter.appendChild(cancelButton);
    
    const submitButton = document.createElement('button');
    submitButton.className = 'plugin-prompt-button submit';
    submitButton.textContent = '确认';
    submitButton.addEventListener('click', () => {
      // 提交prompt
      window.electronAPI.executePluginCommandInDetach({
        pluginId: pluginState.pluginId,
        commandId: pluginState.commandId,
        params: {
          prompt: inputElement.value,
          ...promptData.params
        }
      });
    });
    promptFooter.appendChild(submitButton);
    
    promptContainer.appendChild(promptContent);
    promptContainer.appendChild(promptFooter);
    pluginContent.appendChild(promptContainer);
    
    // 处理输入框的键盘事件
    inputElement.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        // 提交prompt
        window.electronAPI.executePluginCommandInDetach({
          pluginId: pluginState.pluginId,
          commandId: pluginState.commandId,
          params: {
            prompt: inputElement.value,
            ...promptData.params
          }
        });
      } else if (e.key === 'Escape') {
        // 关闭prompt
        promptContainer.remove();
      }
    });
  }
});