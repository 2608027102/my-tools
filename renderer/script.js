// 使用DOMContentLoaded确保所有DOM元素都已加载完成
document.addEventListener('DOMContentLoaded', function() {
  window.electronAPI.log('DOMContentLoaded event fired');
  
  const searchInput = document.getElementById('searchInput');
  const results = document.getElementById('results');
  let activeIndex = -1;
  let commands = [];
  let pluginCommands = [];
  let apps = [];
  let currentPluginList = null;
  let currentPluginListElement = null;
  let pluginListActiveIndex = -1;
  let currentPluginInfo = null;
  let currentPluginPrompt = null;
  // 插件运行状态持久化
  let pluginState = {
    isRunning: false,
    type: null, // 'logs' 或 'result'
    data: null
  };
  // ESC键按下次数，用于实现多段操作
  let escPressCount = 0;

function renderResults(filteredItems) {
  results.innerHTML = '';
  filteredItems.forEach((item, index) => {
    const resultItem = document.createElement('div');
    resultItem.className = `result-item ${index === activeIndex ? 'active' : ''}`;
    resultItem.dataset.index = index;
    
    let subtitle = item.type;
    if (item.type === 'application') {
      if (item.version) {
        subtitle += ` - ${item.version}`;
      } else if (item.path) {
        const pathParts = item.path.split('\\');
        subtitle += ` - ${pathParts[pathParts.length - 1]}`;
      }
    } else if (item.type === 'plugin' && item.pluginName) {
      subtitle += ` - ${item.pluginName}`;
    } else if (item.type === 'system' && item.command) {
      subtitle += ` - ${item.command}`;
    }
    
    const iconHtml = item.icon ? `<img class="result-icon" src="${item.icon}" alt="${item.name} icon" />` : '';
    
    resultItem.innerHTML = `
      <div class="result-icon-container">${iconHtml}</div>
      <div class="result-content">
        <div class="result-title">${item.name}</div>
        <div class="result-subtitle">${subtitle}</div>
      </div>
    `;
    
    resultItem.addEventListener('click', () => executeCommand(item));
    resultItem.addEventListener('mouseenter', () => showItemDetails(item, resultItem));
    resultItem.addEventListener('mouseleave', () => hideItemDetails(resultItem));
    results.appendChild(resultItem);
  });
}

function showItemDetails(item, element) {
  const existingDetails = element.querySelector('.result-details');
  if (existingDetails) {
    existingDetails.remove();
  }
  
  const details = document.createElement('div');
  details.className = 'result-details';
  
  let detailsHTML = '';
  
  if (item.path) {
    detailsHTML += `
      <div class="result-details-row">
        <span class="result-details-label">路径:</span>
        <span class="result-details-value">${item.path}</span>
      </div>
    `;
  }
  
  if (item.version) {
    detailsHTML += `
      <div class="result-details-row">
        <span class="result-details-label">版本:</span>
        <span class="result-details-value">${item.version}</span>
      </div>
    `;
  }
  
  if (item.type === 'plugin' && item.pluginName) {
    detailsHTML += `
      <div class="result-details-row">
        <span class="result-details-label">插件:</span>
        <span class="result-details-value">${item.pluginName}</span>
      </div>
    `;
  }
  
  if (item.command) {
    detailsHTML += `
      <div class="result-details-row">
        <span class="result-details-label">命令:</span>
        <span class="result-details-value">${item.command}</span>
      </div>
    `;
  }
  
  if (item.description) {
    detailsHTML += `
      <div class="result-details-row">
        <span class="result-details-label">描述:</span>
        <span class="result-details-value">${item.description}</span>
      </div>
    `;
  }
  
  if (item.platform) {
    detailsHTML += `
      <div class="result-details-row">
        <span class="result-details-label">平台:</span>
        <span class="result-details-value">${item.platform}</span>
      </div>
    `;
  }
  
  details.innerHTML = detailsHTML;
  element.appendChild(details);
}

function hideItemDetails(element) {
  const details = element.querySelector('.result-details');
  if (details) {
    details.remove();
  }
}

async function filterCommands(query) {
  let allItems = [...commands];
  
  pluginCommands.forEach(cmd => {
    allItems.push({
      ...cmd,
      type: 'plugin'
    });
  });
  
  apps.forEach(app => {
    allItems.push({
      ...app,
      type: 'application'
    });
  });
  
  if (!query) return allItems;
  
  return await fuzzySearch(allItems, query);
}

async function fuzzySearch(items, query) {
  const lowerQuery = query.toLowerCase();
  const results = [];
  
  for (const item of items) {
    let score = 0;
    
    // 检查插件命令是否有自定义匹配类型
    if (item.type === 'plugin' && item.matchType) {
      switch (item.matchType) {
        case 'regex':
          // 使用插件注册的正则表达式进行匹配
          if (item.matchPattern) {
            try {
              const regex = new RegExp(item.matchPattern, 'i');
              if (regex.test(query)) {
                score = 100; // 正则匹配给予最高分数
              }
            } catch (error) {
              window.electronAPI.error('Invalid regex pattern in plugin:', error);
              // 正则错误时回退到默认匹配
              score = await calculateMatchScore(item, lowerQuery);
            }
          }
          break;
        case 'exact':
          // 精确匹配
          if (item.name.toLowerCase() === lowerQuery || 
              (item.keywords && Array.isArray(item.keywords) && item.keywords.some(keyword => keyword.toLowerCase() === lowerQuery))) {
            score = 90;
          }
          break;
        default:
          // 默认使用模糊匹配
          score = await calculateMatchScore(item, lowerQuery);
      }
    } else {
      // 检查是否为用户输入的正则表达式模式（以/开头和结尾）
      let isUserRegex = false;
      let userRegex = null;
      if (query.startsWith('/') && query.endsWith('/')) {
        try {
          const regexPattern = query.substring(1, query.length - 1);
          userRegex = new RegExp(regexPattern, 'i');
          isUserRegex = true;
        } catch (error) {
          window.electronAPI.error('Invalid regex pattern:', error);
          isUserRegex = false;
        }
      }
      
      if (isUserRegex && userRegex) {
        // 使用用户输入的正则表达式匹配
        if (userRegex.test(item.name) || 
            (item.command && userRegex.test(item.command)) || 
            (item.description && userRegex.test(item.description)) || 
            (item.path && userRegex.test(item.path)) || 
            (item.keywords && Array.isArray(item.keywords) && item.keywords.some(keyword => userRegex.test(keyword)))) {
          score = 100; // 正则匹配给予最高分数
        }
      } else {
        // 使用原有模糊匹配
        score = await calculateMatchScore(item, lowerQuery);
      }
    }
    
    if (score > 0) {
      results.push({ ...item, score });
    }
  }
  
  results.sort((a, b) => b.score - a.score);
  return results;
}

// 将中文转换为拼音
function getPinyin(text) {
  if (!text) return '';
  return window.electronAPI.getPinyin(text);
}

// 将中文转换为拼音首字母
function getPinyinFirstLetter(text) {
  if (!text) return '';
  return window.electronAPI.getPinyinFirstLetter(text);
}

async function calculateMatchScore(item, query) {
  let score = 0;
  const itemName = item.name.toLowerCase();
  
  if (itemName === query) {
    score += 100;
  } else if (itemName.startsWith(query)) {
    score += 80;
  } else if (itemName.includes(query)) {
    score += 60;
  }
  
  // 拼音匹配
  const itemNamePinyin = (await getPinyin(item.name)).toLowerCase();
  const itemNamePinyinFirstLetter = (await getPinyinFirstLetter(item.name)).toLowerCase();
  
  if (itemNamePinyin === query) {
    score += 90;
  } else if (itemNamePinyin.startsWith(query)) {
    score += 70;
  } else if (itemNamePinyin.includes(query)) {
    score += 50;
  }
  
  // 拼音首字母匹配
  if (itemNamePinyinFirstLetter === query) {
    score += 85;
  } else if (itemNamePinyinFirstLetter.startsWith(query)) {
    score += 65;
  } else if (itemNamePinyinFirstLetter.includes(query)) {
    score += 45;
  }
  
  if (item.command && item.command.toLowerCase().includes(query)) {
    score += 40;
  }
  
  if (item.description && item.description.toLowerCase().includes(query)) {
    score += 30;
  }
  
  if (item.path && item.path.toLowerCase().includes(query)) {
    score += 30;
  }
  
  if (item.keywords && Array.isArray(item.keywords)) {
    for (const keyword of item.keywords) {
      if (keyword.toLowerCase() === query) {
        score += 90;
      } else if (keyword.toLowerCase().startsWith(query)) {
        score += 70;
      } else if (keyword.toLowerCase().includes(query)) {
        score += 50;
      }
      
      // 关键词拼音匹配
      const keywordPinyin = (await getPinyin(keyword)).toLowerCase();
      const keywordPinyinFirstLetter = (await getPinyinFirstLetter(keyword)).toLowerCase();
      
      if (keywordPinyin === query) {
        score += 80;
      } else if (keywordPinyin.startsWith(query)) {
        score += 60;
      } else if (keywordPinyin.includes(query)) {
        score += 40;
      }
      
      if (keywordPinyinFirstLetter === query) {
        score += 75;
      } else if (keywordPinyinFirstLetter.startsWith(query)) {
        score += 55;
      } else if (keywordPinyinFirstLetter.includes(query)) {
        score += 35;
      }
    }
  }
  
  return score;
}

function executeCommand(item) {
  window.electronAPI.log('========== Executing command ==========');
  window.electronAPI.log('Item: %s', JSON.stringify(item));
  window.electronAPI.log('Item type: %s', item.type);
  window.electronAPI.log('Item pluginId: %s', item.pluginId);
  
  // 清除之前的插件状态和UI元素
  pluginState = {
    isRunning: false,
    type: null,
    data: null
  };
  closePluginResult();
  closePluginLogs();
  closePluginHtml();
  closePluginPrompt();
  closePluginListSelection();
  
  if (item.type === 'plugin' && item.pluginId) {
    window.electronAPI.log('Executing plugin command: %s', item.name);
    // 总是调用showPluginListSelection来处理插件命令
    showPluginListSelection(item);
  } else if (item.type === 'application') {
    window.electronAPI.log('Executing application: %s', item.name);
    window.electronAPI.executeApp(item);
    window.electronAPI.hideWindow();
  } else {
    window.electronAPI.log('Executing regular command: %s', item.name);
    window.electronAPI.executeCommand(item);
    window.electronAPI.hideWindow();
  }
}

function showPluginListSelection(plugin) {
  window.electronAPI.log('========== Showing plugin list selection ==========');
  window.electronAPI.log('Plugin: %s', JSON.stringify(plugin));
  window.electronAPI.log('Plugin name: %s', plugin.name);
  window.electronAPI.log('Plugin ID: %s', plugin.id);
  window.electronAPI.log('Plugin pluginId: %s', plugin.pluginId);
  
  // 清空results容器，隐藏其他备选插件
  results.innerHTML = '';
  
  // 临时保存当前插件信息，用于处理返回结果
  currentPluginInfo = plugin;
  window.electronAPI.log('Saved currentPluginInfo: %s', JSON.stringify(currentPluginInfo));
  
  // 获取用户输入的文本
  const userInput = searchInput.value;
  window.electronAPI.log('User input: %s', userInput);
  
  window.electronAPI.log('Sending executePluginCommandWithList');
  window.electronAPI.executePluginCommandWithList({
    pluginId: plugin.pluginId,
    commandId: plugin.id,
    params: {
      text: userInput
    }
  });
  window.electronAPI.log('executePluginCommandWithList sent');
}

function renderPluginListSelection(listItems) {
  const existingList = document.querySelector('.list-selection');
  if (existingList) {
    existingList.remove();
  }
  
  const listSelection = document.createElement('div');
  listSelection.className = 'list-selection';
  
  listItems.forEach((item, index) => {
    const listItem = document.createElement('div');
    listItem.className = `list-selection-item ${index === pluginListActiveIndex ? 'selected' : ''}`;
    
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
    
    listItem.addEventListener('click', () => executePluginListItem(item));
    listSelection.appendChild(listItem);
  });
  
  results.appendChild(listSelection);
  currentPluginListElement = listSelection;
}

function executePluginListItem(item) {
  window.electronAPI.log('Executing plugin list item: %s', JSON.stringify(item));
  
  window.electronAPI.executePluginCommandWithList({
    pluginId: currentPluginList.pluginId,
    commandId: currentPluginList.commandId,
    params: item
  });
  
  // 关闭列表选择界面
  closePluginListSelection();
}

function closePluginListSelection() {
  const existingList = document.querySelector('.list-selection');
  if (existingList) {
    existingList.remove();
  }
  currentPluginList = null;
  currentPluginListElement = null;
  pluginListActiveIndex = -1;
}

function showPluginLogs(logs) {
  window.electronAPI.log('Showing plugin logs: %s', JSON.stringify(logs));
  
  // 清空results容器，隐藏其他备选插件
  results.innerHTML = '';
  
  // 清除现有日志显示
  closePluginLogs();
  
  const logsContainer = document.createElement('div');
  logsContainer.className = 'plugin-logs';
  
  const logsHeader = document.createElement('div');
  logsHeader.className = 'plugin-logs-header';
  
  const titleDiv = document.createElement('div');
  titleDiv.className = 'plugin-logs-title';
  titleDiv.textContent = '插件执行日志';
  logsHeader.appendChild(titleDiv);
  
  const copyButton = document.createElement('button');
  copyButton.className = 'copy-logs-btn';
  copyButton.textContent = '复制日志';
  copyButton.addEventListener('click', function() {
    copyLogsToClipboard(this);
  });
  logsHeader.appendChild(copyButton);
  
  logsContainer.appendChild(logsHeader);
  
  const logsContent = document.createElement('div');
  logsContent.className = 'plugin-logs-content';
  logsContent.dataset.logs = JSON.stringify(logs);
  
  logs.forEach(log => {
    const logItem = document.createElement('div');
    logItem.className = 'plugin-log-item';
    logItem.textContent = log;
    logsContent.appendChild(logItem);
  });
  
  logsContainer.appendChild(logsContent);
  results.appendChild(logsContainer);
  
  // 更新插件状态
  pluginState = {
    isRunning: true,
    type: 'logs',
    data: logs
  };
  window.electronAPI.log('Plugin state updated: %s', JSON.stringify(pluginState));
}

function closePluginLogs() {
  const existingLogs = document.querySelector('.plugin-logs');
  if (existingLogs) {
    existingLogs.remove();
  }
}

function copyLogsToClipboard(button) {
  window.electronAPI.log('Copying logs to clipboard');
  try {
    const logsContent = button.closest('.plugin-logs').querySelector('.plugin-logs-content');
    window.electronAPI.log('Found logs content: element exists');
    
    const logsData = logsContent.dataset.logs;
    window.electronAPI.log('Logs data: %s', logsData);
    
    const logs = JSON.parse(logsData);
    window.electronAPI.log('Parsed logs: %s', JSON.stringify(logs));
    
    const logsText = logs.join('\n');
    window.electronAPI.log('Logs text to copy: %s', logsText);
    
    // 使用 Electron API 复制到剪贴板
    if (window.electronAPI && window.electronAPI.copyToClipboard) {
      window.electronAPI.log('Using Electron copyToClipboard API');
      
      // 保存按钮引用，用于回调
      const currentButton = button;
      
      // 监听复制完成事件
      window.electronAPI.onCopyToClipboardComplete((event, result) => {
        window.electronAPI.log('Copy to clipboard complete: %s', JSON.stringify(result));
        if (result.success) {
          currentButton.textContent = '已复制!';
          setTimeout(() => {
            currentButton.textContent = '复制日志';
          }, 1000);
        } else {
          window.electronAPI.error('Failed to copy to clipboard:', result.error);
          currentButton.textContent = '复制失败';
          setTimeout(() => {
            currentButton.textContent = '复制日志';
          }, 1000);
        }
      });
      
      // 发送复制请求
      window.electronAPI.copyToClipboard(logsText);
    } else {
      window.electronAPI.error('Electron copyToClipboard API not available');
      button.textContent = '复制失败';
      setTimeout(() => {
        button.textContent = '复制日志';
      }, 1000);
    }
  } catch (error) {
    window.electronAPI.error('Error in copyLogsToClipboard:', error);
    button.textContent = '复制失败';
    setTimeout(() => {
      button.textContent = '复制日志';
    }, 1000);
  }
}

function showPluginResult(result) {
  window.electronAPI.log('Showing plugin result: %s', JSON.stringify(result));
  
  // 清空results容器，隐藏其他备选插件
  results.innerHTML = '';
  
  // 清除现有结果显示
  closePluginResult();
  
  const resultContainer = document.createElement('div');
  resultContainer.className = 'plugin-result';
  
  const resultHeader = document.createElement('div');
  resultHeader.className = 'plugin-result-header';
  
  const titleDiv = document.createElement('div');
  titleDiv.className = 'plugin-result-title';
  titleDiv.textContent = '插件执行结果';
  resultHeader.appendChild(titleDiv);
  
  const copyButton = document.createElement('button');
  copyButton.className = 'copy-result-btn';
  copyButton.textContent = '复制结果';
  copyButton.addEventListener('click', function() {
    copyResultToClipboard(this);
  });
  resultHeader.appendChild(copyButton);
  
  resultContainer.appendChild(resultHeader);
  
  const resultContent = document.createElement('div');
  resultContent.className = 'plugin-result-content';
  resultContent.dataset.result = JSON.stringify(result);
  
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
  results.appendChild(resultContainer);
  
  // 更新插件状态
  pluginState = {
    isRunning: true,
    type: 'result',
    data: result
  };
  window.electronAPI.log('Plugin state updated: %s', JSON.stringify(pluginState));
}

function closePluginResult() {
  const existingResult = document.querySelector('.plugin-result');
  if (existingResult) {
    existingResult.remove();
  }
}

function copyResultToClipboard(button) {
  window.electronAPI.log('Copying result to clipboard');
  try {
    const resultContent = button.closest('.plugin-result').querySelector('.plugin-result-content');
    window.electronAPI.log('Found result content: element exists');
    
    const resultData = resultContent.dataset.result;
    window.electronAPI.log('Result data: %s', resultData);
    
    const result = JSON.parse(resultData);
    window.electronAPI.log('Parsed result: %s', JSON.stringify(result));
    
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
    
    window.electronAPI.log('Result text to copy: %s', resultText);
    
    // 使用 Electron API 复制到剪贴板
    if (window.electronAPI && window.electronAPI.copyToClipboard) {
      window.electronAPI.log('Using Electron copyToClipboard API');
      
      // 保存按钮引用，用于回调
      const currentButton = button;
      
      // 监听复制完成事件
      window.electronAPI.onCopyToClipboardComplete((event, result) => {
        window.electronAPI.log('Copy to clipboard complete: %s', JSON.stringify(result));
        if (result.success) {
          currentButton.textContent = '已复制!';
          setTimeout(() => {
            currentButton.textContent = '复制结果';
          }, 1000);
        } else {
          window.electronAPI.error('Failed to copy to clipboard:', result.error);
          currentButton.textContent = '复制失败';
          setTimeout(() => {
            currentButton.textContent = '复制结果';
          }, 1000);
        }
      });
      
      // 发送复制请求
      window.electronAPI.copyToClipboard(resultText);
    } else {
      window.electronAPI.error('Electron copyToClipboard API not available');
      button.textContent = '复制失败';
      setTimeout(() => {
        button.textContent = '复制结果';
      }, 1000);
    }
  } catch (error) {
    window.electronAPI.error('Error in copyResultToClipboard:', error);
    button.textContent = '复制失败';
    setTimeout(() => {
      button.textContent = '复制结果';
    }, 1000);
  }
}

async function updateActiveIndex(direction) {
  const filtered = await filterCommands(searchInput.value);
  if (filtered.length === 0) return;
  
  activeIndex += direction;
  if (activeIndex < 0) activeIndex = filtered.length - 1;
  if (activeIndex >= filtered.length) activeIndex = 0;
  
  renderResults(filtered);
  
  // 自动滚动到选中的项目
  const activeElement = document.querySelector('.result-item.active');
  if (activeElement) {
    activeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

function updatePluginListIndex(direction) {
  if (!currentPluginList) return;
  
  pluginListActiveIndex += direction;
  if (pluginListActiveIndex < 0) pluginListActiveIndex = currentPluginList.length - 1;
  if (pluginListActiveIndex >= currentPluginList.length) pluginListActiveIndex = 0;
  
  renderPluginListSelection(currentPluginList);
  
  // 自动滚动到选中的项目
  const activeElement = document.querySelector('.list-selection-item.selected');
  if (activeElement) {
    activeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

searchInput.addEventListener('input', async () => {
  activeIndex = -1;
  closePluginListSelection();
  const filtered = await filterCommands(searchInput.value);
  renderResults(filtered);
});

searchInput.addEventListener('keydown', async (e) => {
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    if (currentPluginList) {
      updatePluginListIndex(1);
    } else {
      await updateActiveIndex(1);
    }
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    if (currentPluginList) {
      updatePluginListIndex(-1);
    } else {
      await updateActiveIndex(-1);
    }
  } else if (e.key === 'Enter') {
    e.preventDefault();
    const filtered = await filterCommands(searchInput.value);
    if (currentPluginList) {
      if (pluginListActiveIndex >= 0 && pluginListActiveIndex < currentPluginList.length) {
        executePluginListItem(currentPluginList[pluginListActiveIndex]);
      } else if (currentPluginList.length > 0) {
        executePluginListItem(currentPluginList[0]);
      }
    } else {
      if (activeIndex >= 0 && activeIndex < filtered.length) {
        executeCommand(filtered[activeIndex]);
      } else if (filtered.length > 0) {
        executeCommand(filtered[0]);
      }
    }
  }
});

// 为整个窗口添加ESC按键监听
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (currentPluginList) {
      closePluginListSelection();
    } else if (currentPluginPrompt) {
      closePluginPrompt();
    } else {
      // 按下ESC按键时，根据按下次数执行不同操作
      if (pluginState.isRunning) {
        // 第一次按ESC：退出插件
        window.electronAPI.log('ESC pressed, count: %d', escPressCount);
        pluginState = {
          isRunning: false,
          type: null,
          data: null
        };
        window.electronAPI.log('Plugin state cleared: %s', JSON.stringify(pluginState));
        // 清除插件结果、日志和HTML显示
        closePluginResult();
        closePluginLogs();
        closePluginHtml();
        escPressCount = 1;
      } else if (escPressCount === 1 || searchInput.value.trim() !== '') {
        // 第二次按ESC或输入框有内容：清除输入框内容
        window.electronAPI.log('ESC pressed again, clearing input');
        searchInput.value = '';
        // 重新渲染结果
        (async () => {
          const filtered = await filterCommands(searchInput.value);
          renderResults(filtered);
        })();
        escPressCount = 2;
      } else if (escPressCount === 2 || searchInput.value.trim() === '') {
        // 第三次按ESC或输入框为空：隐藏输入框
        window.electronAPI.log('ESC pressed third time, hiding window');
        window.electronAPI.hideWindow();
        escPressCount = 0;
      } else {
        // 默认：隐藏窗口
        window.electronAPI.hideWindow();
        escPressCount = 0;
      }
    }
  }
});

window.addEventListener('focus', () => {
  searchInput.focus();
  // 每次窗口获得焦点时，重置ESC按键计数
  escPressCount = 0;
  window.electronAPI.log('ESC press count reset to 0');
  
  // 如果插件处于运行状态，恢复显示插件结果界面
  if (pluginState.isRunning) {
    window.electronAPI.log('Restoring plugin state: %s', JSON.stringify(pluginState));
    if (pluginState.type === 'logs') {
      showPluginLogs(pluginState.data);
    } else if (pluginState.type === 'result') {
      showPluginResult(pluginState.data);
    } else if (pluginState.type === 'html') {
      renderPluginHtml(pluginState.data);
    }
  }
});

// 监听窗口显示事件，只有在窗口显示时才获取剪切板内容
window.electronAPI.onWindowShown(() => {
  window.electronAPI.log('Window shown, getting clipboard content');
  window.electronAPI.getClipboardContent();
});

// 确保electronAPI已经初始化
window.electronAPI.log('Checking electronAPI: object exists');
window.electronAPI.log('Checking onPluginCommandExecutedWithList: %s', typeof window.electronAPI.onPluginCommandExecutedWithList);

// 监听窗口分离请求
window.electronAPI.onDetachWindowRequest(() => {
  window.electronAPI.log('Detach window request received');
  if (pluginState.isRunning) {
    // 发送插件状态到主进程，请求创建分离窗口
    window.electronAPI.detachWindow(pluginState);
    // 清除当前插件状态
    pluginState = {
      isRunning: false,
      type: null,
      data: null
    };
    // 清除当前插件内容
    closePluginResult();
    closePluginLogs();
    closePluginHtml();
    closePluginPrompt();
    closePluginListSelection();
  }
});

// 监听恢复插件状态
window.electronAPI.onRestorePluginState((event, state) => {
  window.electronAPI.log('Restore plugin state received: %s', JSON.stringify(state));
  pluginState = state;
  if (pluginState.isRunning) {
    if (pluginState.type === 'logs') {
      showPluginLogs(pluginState.data);
    } else if (pluginState.type === 'result') {
      showPluginResult(pluginState.data);
    } else if (pluginState.type === 'html') {
      renderPluginHtml(pluginState.data);
    }
  }
});

window.electronAPI.onCommandExecuted((event, result) => {
  window.electronAPI.log('Command executed: %s', JSON.stringify(result));
});

window.electronAPI.onPluginCommandExecuted((event, result) => {
  window.electronAPI.log('========== Plugin command executed ==========');
  window.electronAPI.log('Result: %s', JSON.stringify(result));
  window.electronAPI.log('Result type: %s', typeof result);
  
  // 检查是否是prompt请求
  if (result.result && typeof result.result === 'object' && result.result.type === 'prompt') {
    window.electronAPI.log('Showing plugin prompt');
    renderPluginPrompt(result.result);
  } else if (result.logs && result.logs.length > 0) {
    // 显示插件日志
    showPluginLogs(result.logs);
  } else {
    // 显示执行结果
    showPluginResult(result.result);
  }
});

function renderPluginPrompt(promptData) {
  window.electronAPI.log('Rendering plugin prompt: %s', JSON.stringify(promptData));
  
  // 清空results容器，隐藏其他备选插件
  results.innerHTML = '';
  
  const existingPrompt = document.querySelector('.plugin-prompt');
  if (existingPrompt) {
    existingPrompt.remove();
  }
  
  const promptContainer = document.createElement('div');
  promptContainer.className = 'plugin-prompt';
  
  const promptHeader = document.createElement('div');
  promptHeader.className = 'plugin-prompt-header';
  
  const titleDiv = document.createElement('div');
  titleDiv.className = 'plugin-prompt-title';
  titleDiv.textContent = promptData.title || '请输入';
  promptHeader.appendChild(titleDiv);
  
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
    closePluginPrompt();
  });
  promptFooter.appendChild(cancelButton);
  
  const submitButton = document.createElement('button');
  submitButton.className = 'plugin-prompt-button submit';
  submitButton.textContent = '确认';
  submitButton.addEventListener('click', () => {
    submitPluginPrompt(inputElement.value);
  });
  promptFooter.appendChild(submitButton);
  
  promptContainer.appendChild(promptContent);
  promptContainer.appendChild(promptFooter);
  results.appendChild(promptContainer);
  
  // 保存当前prompt信息
  currentPluginPrompt = {
    data: promptData,
    inputElement: inputElement
  };
  
  // 处理输入框的键盘事件
  inputElement.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      submitPluginPrompt(inputElement.value);
    } else if (e.key === 'Escape') {
      closePluginPrompt();
    }
  });
}

function submitPluginPrompt(value) {
  window.electronAPI.log('Submitting plugin prompt: %s', value);
  
  if (currentPluginInfo) {
    window.electronAPI.executePluginCommandWithList({
      pluginId: currentPluginInfo.pluginId,
      commandId: currentPluginInfo.id,
      params: {
        prompt: value,
        ...currentPluginPrompt.data.params
      }
    });
  }
  
  closePluginPrompt();
}

function closePluginPrompt() {
  const existingPrompt = document.querySelector('.plugin-prompt');
  if (existingPrompt) {
    existingPrompt.remove();
  }
  currentPluginPrompt = null;
}

function renderPluginHtml(htmlData) {
  window.electronAPI.log('Rendering plugin HTML: %s', JSON.stringify(htmlData));
  
  // 清空整个results容器，隐藏其他备选插件
  results.innerHTML = '';
  
  const htmlContainer = document.createElement('div');
  htmlContainer.className = 'plugin-html full-width';
  
  const htmlHeader = document.createElement('div');
  htmlHeader.className = 'plugin-html-header';
  
  const titleDiv = document.createElement('div');
  titleDiv.className = 'plugin-html-title';
  titleDiv.textContent = htmlData.title || '插件内容';
  htmlHeader.appendChild(titleDiv);
  
  htmlContainer.appendChild(htmlHeader);
  
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
          background-color: transparent;
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
  htmlContainer.appendChild(iframe);
  
  results.appendChild(htmlContainer);
  
  // 更新插件状态
  pluginState = {
    isRunning: true,
    type: 'html',
    data: htmlData
  };
  window.electronAPI.log('Plugin state updated: %s', JSON.stringify(pluginState));
}

function closePluginHtml() {
  const existingHtml = document.querySelector('.plugin-html');
  if (existingHtml) {
    existingHtml.remove();
  }
}

// 重新绑定插件命令执行结果监听器
if (window.electronAPI && window.electronAPI.onPluginCommandExecutedWithList) {
  window.electronAPI.log('Binding onPluginCommandExecutedWithList listener');
  window.electronAPI.onPluginCommandExecutedWithList((event, result) => {
    window.electronAPI.log('========== Plugin command executed with list ==========');
    window.electronAPI.log('Event: event object');
    window.electronAPI.log('Result: %s', JSON.stringify(result));
    window.electronAPI.log('Result type: %s', typeof result);
    
    if (result) {
      window.electronAPI.log('Result success: %s', result.success);
      window.electronAPI.log('Result isList: %s', result.isList);
      window.electronAPI.log('Result isPrompt: %s', result.isPrompt);
      window.electronAPI.log('Result result: %s', JSON.stringify(result.result));
      window.electronAPI.log('Result logs: %s', JSON.stringify(result.logs));
      
      if (result.success && result.isPrompt) {
        window.electronAPI.log('Showing plugin prompt');
        renderPluginPrompt(result.result);
      } else if (result.success && result.isHtml) {
        window.electronAPI.log('Showing plugin HTML');
        renderPluginHtml(result.result);
      } else if (result.success && result.isList && Array.isArray(result.result)) {
        window.electronAPI.log('Showing list selection');
        currentPluginList = result.result;
        // 保存插件信息到列表中
        if (currentPluginInfo) {
          window.electronAPI.log('Saving plugin info to list');
          currentPluginList.pluginId = currentPluginInfo.pluginId;
          currentPluginList.commandId = currentPluginInfo.id;
        }
        window.electronAPI.log('Rendering plugin list selection');
        renderPluginListSelection(currentPluginList);
      } else if (result.success) {
        window.electronAPI.log('Single result, showing result');
        // 显示插件日志
        if (result.logs && result.logs.length > 0) {
          showPluginLogs(result.logs);
        } else {
          // 如果是单个结果，显示结果而不是隐藏窗口
          closePluginListSelection();
          showPluginResult(result.result);
        }
      } else {
        window.electronAPI.log('Command failed: %s', result.error);
        // 显示插件日志
        if (result.logs && result.logs.length > 0) {
          showPluginLogs(result.logs);
        } else {
          // 显示错误信息
          showPluginResult({ success: false, error: result.error });
        }
      }
    } else {
      window.electronAPI.log('Result is null or undefined');
    }
  });
  window.electronAPI.log('onPluginCommandExecutedWithList listener bound');
} else {
  window.electronAPI.error('window.electronAPI or onPluginCommandExecutedWithList is not available');
}

function loadPluginCommands() {
  window.electronAPI.getPluginCommands();
}

window.electronAPI.onPluginCommandsLoaded(async (event, loadedCommands) => {
  pluginCommands = loadedCommands;
  window.electronAPI.log('Plugin commands loaded: %s', pluginCommands.length);
  if (searchInput.value) {
    const filtered = await filterCommands(searchInput.value);
    renderResults(filtered);
  }
});

function loadApps() {
  window.electronAPI.getApps();
}

window.electronAPI.onAppsLoaded(async (event, loadedApps) => {
  apps = loadedApps;
  window.electronAPI.log('Applications loaded: %s', apps.length);
  if (searchInput.value) {
    const filtered = await filterCommands(searchInput.value);
    renderResults(filtered);
  }
});

function loadCommands() {
  window.electronAPI.loadCommands();
}

window.electronAPI.onCommandsLoaded(async (event, loadedCommands) => {
  commands = loadedCommands;
  window.electronAPI.log('Commands loaded: %s', commands.length);
  if (searchInput.value) {
    const filtered = await filterCommands(searchInput.value);
    renderResults(filtered);
  }
});

function loadTheme() {
  window.electronAPI.getTheme();
}

window.electronAPI.onThemeLoaded((event, { theme, themeName }) => {
  window.electronAPI.log('Theme loaded: %s', themeName);
  applyTheme(theme);
});

// 获取剪切板内容并填充到输入栏
window.electronAPI.onClipboardContentRetrieved(async (event, result) => {
  window.electronAPI.log('Clipboard content retrieved: %s', JSON.stringify(result));
  // 只有当插件不处于运行状态时，才将剪切板内容填充到输入栏并执行搜索
  if (result.success && result.content && !pluginState.isRunning) {
    searchInput.value = result.content;
    // 如果有内容，自动执行搜索
    const filtered = await filterCommands(result.content);
    renderResults(filtered);
  }
});

function applyTheme(theme) {
  if (!theme) return;
  
  const body = document.body;
  const searchBox = document.getElementById('searchInput');
  const footer = document.querySelector('.footer');
  
  body.style.backgroundColor = theme.body.backgroundColor;
  body.style.color = theme.body.color;
  
  if (searchBox) {
    searchBox.style.backgroundColor = theme.searchBox.backgroundColor;
    searchBox.style.color = theme.searchBox.color;
    searchBox.style.setProperty('--placeholder-color', theme.searchBox.placeholderColor);
  }
  
  if (footer) {
    footer.style.color = theme.footer.color;
  }
  
  const style = document.createElement('style');
  style.innerHTML = `
    .result-item:hover {
      background-color: ${theme.resultItem.hoverBackgroundColor};
    }
    .result-item.active {
      background-color: ${theme.resultItem.activeBackgroundColor};
    }
  `;
  
  const existingStyle = document.getElementById('theme-style');
  if (existingStyle) {
    existingStyle.remove();
  }
  
  style.id = 'theme-style';
  document.head.appendChild(style);
}

loadCommands();
loadApps();
loadPluginCommands();
loadTheme();
});

