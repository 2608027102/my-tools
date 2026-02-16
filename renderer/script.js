// 使用DOMContentLoaded确保所有DOM元素都已加载完成
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOMContentLoaded event fired');
  
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
    
    resultItem.innerHTML = `
      <div class="result-title">${item.name}</div>
      <div class="result-subtitle">${subtitle}</div>
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

function filterCommands(query) {
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
  
  return fuzzySearch(allItems, query);
}

function fuzzySearch(items, query) {
  const lowerQuery = query.toLowerCase();
  const results = [];
  
  items.forEach(item => {
    const score = calculateMatchScore(item, lowerQuery);
    if (score > 0) {
      results.push({ ...item, score });
    }
  });
  
  results.sort((a, b) => b.score - a.score);
  return results;
}

function calculateMatchScore(item, query) {
  let score = 0;
  const itemName = item.name.toLowerCase();
  
  if (itemName === query) {
    score += 100;
  } else if (itemName.startsWith(query)) {
    score += 80;
  } else if (itemName.includes(query)) {
    score += 60;
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
    item.keywords.forEach(keyword => {
      if (keyword.toLowerCase() === query) {
        score += 90;
      } else if (keyword.toLowerCase().startsWith(query)) {
        score += 70;
      } else if (keyword.toLowerCase().includes(query)) {
        score += 50;
      }
    });
  }
  
  return score;
}

function executeCommand(item) {
  console.log('========== Executing command ==========');
  console.log('Item:', item);
  console.log('Item type:', item.type);
  console.log('Item pluginId:', item.pluginId);
  
  if (item.type === 'plugin' && item.pluginId) {
    console.log('Executing plugin command:', item.name);
    // 总是调用showPluginListSelection来处理插件命令
    showPluginListSelection(item);
  } else if (item.type === 'application') {
    console.log('Executing application:', item.name);
    window.electronAPI.executeApp(item);
    window.electronAPI.hideWindow();
  } else {
    console.log('Executing regular command:', item.name);
    window.electronAPI.executeCommand(item);
    window.electronAPI.hideWindow();
  }
}

function showPluginListSelection(plugin) {
  console.log('========== Showing plugin list selection ==========');
  console.log('Plugin:', plugin);
  console.log('Plugin name:', plugin.name);
  console.log('Plugin ID:', plugin.id);
  console.log('Plugin pluginId:', plugin.pluginId);
  
  // 临时保存当前插件信息，用于处理返回结果
  currentPluginInfo = plugin;
  console.log('Saved currentPluginInfo:', currentPluginInfo);
  
  console.log('Sending executePluginCommandWithList');
  window.electronAPI.executePluginCommandWithList({
    pluginId: plugin.pluginId,
    commandId: plugin.id,
    params: {}
  });
  console.log('executePluginCommandWithList sent');
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
  console.log('Executing plugin list item:', item);
  
  window.electronAPI.executePluginCommand({
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
  console.log('Showing plugin logs:', logs);
  
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
}

function closePluginLogs() {
  const existingLogs = document.querySelector('.plugin-logs');
  if (existingLogs) {
    existingLogs.remove();
  }
}

function copyLogsToClipboard(button) {
  console.log('Copying logs to clipboard');
  try {
    const logsContent = button.closest('.plugin-logs').querySelector('.plugin-logs-content');
    console.log('Found logs content:', logsContent);
    
    const logsData = logsContent.dataset.logs;
    console.log('Logs data:', logsData);
    
    const logs = JSON.parse(logsData);
    console.log('Parsed logs:', logs);
    
    const logsText = logs.join('\n');
    console.log('Logs text to copy:', logsText);
    
    // 使用 Electron API 复制到剪贴板
    if (window.electronAPI && window.electronAPI.copyToClipboard) {
      console.log('Using Electron copyToClipboard API');
      
      // 保存按钮引用，用于回调
      const currentButton = button;
      
      // 监听复制完成事件
      window.electronAPI.onCopyToClipboardComplete((event, result) => {
        console.log('Copy to clipboard complete:', result);
        if (result.success) {
          currentButton.textContent = '已复制!';
          setTimeout(() => {
            currentButton.textContent = '复制日志';
          }, 1000);
        } else {
          console.error('Failed to copy to clipboard:', result.error);
          currentButton.textContent = '复制失败';
          setTimeout(() => {
            currentButton.textContent = '复制日志';
          }, 1000);
        }
      });
      
      // 发送复制请求
      window.electronAPI.copyToClipboard(logsText);
    } else {
      console.error('Electron copyToClipboard API not available');
      button.textContent = '复制失败';
      setTimeout(() => {
        button.textContent = '复制日志';
      }, 1000);
    }
  } catch (error) {
    console.error('Error in copyLogsToClipboard:', error);
    button.textContent = '复制失败';
    setTimeout(() => {
      button.textContent = '复制日志';
    }, 1000);
  }
}

function showPluginResult(result) {
  console.log('Showing plugin result:', result);
  
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
}

function closePluginResult() {
  const existingResult = document.querySelector('.plugin-result');
  if (existingResult) {
    existingResult.remove();
  }
}

function copyResultToClipboard(button) {
  console.log('Copying result to clipboard');
  try {
    const resultContent = button.closest('.plugin-result').querySelector('.plugin-result-content');
    console.log('Found result content:', resultContent);
    
    const resultData = resultContent.dataset.result;
    console.log('Result data:', resultData);
    
    const result = JSON.parse(resultData);
    console.log('Parsed result:', result);
    
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
    
    console.log('Result text to copy:', resultText);
    
    // 使用 Electron API 复制到剪贴板
    if (window.electronAPI && window.electronAPI.copyToClipboard) {
      console.log('Using Electron copyToClipboard API');
      
      // 保存按钮引用，用于回调
      const currentButton = button;
      
      // 监听复制完成事件
      window.electronAPI.onCopyToClipboardComplete((event, result) => {
        console.log('Copy to clipboard complete:', result);
        if (result.success) {
          currentButton.textContent = '已复制!';
          setTimeout(() => {
            currentButton.textContent = '复制结果';
          }, 1000);
        } else {
          console.error('Failed to copy to clipboard:', result.error);
          currentButton.textContent = '复制失败';
          setTimeout(() => {
            currentButton.textContent = '复制结果';
          }, 1000);
        }
      });
      
      // 发送复制请求
      window.electronAPI.copyToClipboard(resultText);
    } else {
      console.error('Electron copyToClipboard API not available');
      button.textContent = '复制失败';
      setTimeout(() => {
        button.textContent = '复制结果';
      }, 1000);
    }
  } catch (error) {
    console.error('Error in copyResultToClipboard:', error);
    button.textContent = '复制失败';
    setTimeout(() => {
      button.textContent = '复制结果';
    }, 1000);
  }
}

function updateActiveIndex(direction) {
  const filtered = filterCommands(searchInput.value);
  if (filtered.length === 0) return;
  
  activeIndex += direction;
  if (activeIndex < 0) activeIndex = filtered.length - 1;
  if (activeIndex >= filtered.length) activeIndex = 0;
  
  renderResults(filtered);
}

function updatePluginListIndex(direction) {
  if (!currentPluginList) return;
  
  pluginListActiveIndex += direction;
  if (pluginListActiveIndex < 0) pluginListActiveIndex = currentPluginList.length - 1;
  if (pluginListActiveIndex >= currentPluginList.length) pluginListActiveIndex = 0;
  
  renderPluginListSelection(currentPluginList);
}

searchInput.addEventListener('input', () => {
  activeIndex = -1;
  closePluginListSelection();
  const filtered = filterCommands(searchInput.value);
  renderResults(filtered);
});

searchInput.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    if (currentPluginList) {
      updatePluginListIndex(1);
    } else {
      updateActiveIndex(1);
    }
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    if (currentPluginList) {
      updatePluginListIndex(-1);
    } else {
      updateActiveIndex(-1);
    }
  } else if (e.key === 'Enter') {
    e.preventDefault();
    const filtered = filterCommands(searchInput.value);
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
  } else if (e.key === 'Escape') {
    if (currentPluginList) {
      closePluginListSelection();
    } else {
      window.electronAPI.hideWindow();
    }
  }
});

window.addEventListener('focus', () => {
  searchInput.focus();
});

// 确保electronAPI已经初始化
console.log('Checking electronAPI:', window.electronAPI);
console.log('Checking onPluginCommandExecutedWithList:', typeof window.electronAPI.onPluginCommandExecutedWithList);

window.electronAPI.onCommandExecuted((event, result) => {
  console.log('Command executed:', result);
});

window.electronAPI.onPluginCommandExecuted((event, result) => {
  console.log('========== Plugin command executed ==========');
  console.log('Result:', result);
  console.log('Result type:', typeof result);
  
  // 显示插件日志
  if (result.logs && result.logs.length > 0) {
    showPluginLogs(result.logs);
  } else {
    // 显示执行结果
    showPluginResult(result.result);
  }
});

// 重新绑定插件命令执行结果监听器
if (window.electronAPI && window.electronAPI.onPluginCommandExecutedWithList) {
  console.log('Binding onPluginCommandExecutedWithList listener');
  window.electronAPI.onPluginCommandExecutedWithList((event, result) => {
    console.log('========== Plugin command executed with list ==========');
    console.log('Event:', event);
    console.log('Result:', result);
    console.log('Result type:', typeof result);
    
    if (result) {
      console.log('Result success:', result.success);
      console.log('Result isList:', result.isList);
      console.log('Result result:', result.result);
      console.log('Result logs:', result.logs);
      
      if (result.success && result.isList && Array.isArray(result.result)) {
        console.log('Showing list selection');
        currentPluginList = result.result;
        // 保存插件信息到列表中
        if (currentPluginInfo) {
          console.log('Saving plugin info to list');
          currentPluginList.pluginId = currentPluginInfo.pluginId;
          currentPluginList.commandId = currentPluginInfo.id;
        }
        console.log('Rendering plugin list selection');
        renderPluginListSelection(currentPluginList);
      } else if (result.success) {
        console.log('Single result, showing result');
        // 显示插件日志
        if (result.logs && result.logs.length > 0) {
          showPluginLogs(result.logs);
        } else {
          // 如果是单个结果，显示结果而不是隐藏窗口
          closePluginListSelection();
          showPluginResult(result.result);
        }
      } else {
        console.log('Command failed:', result.error);
        // 显示插件日志
        if (result.logs && result.logs.length > 0) {
          showPluginLogs(result.logs);
        } else {
          // 显示错误信息
          showPluginResult({ success: false, error: result.error });
        }
      }
    } else {
      console.log('Result is null or undefined');
    }
  });
  console.log('onPluginCommandExecutedWithList listener bound');
} else {
  console.error('window.electronAPI or onPluginCommandExecutedWithList is not available');
}

function loadPluginCommands() {
  window.electronAPI.getPluginCommands();
}

window.electronAPI.onPluginCommandsLoaded((event, loadedCommands) => {
  pluginCommands = loadedCommands;
  console.log('Plugin commands loaded:', pluginCommands.length);
  if (searchInput.value) {
    const filtered = filterCommands(searchInput.value);
    renderResults(filtered);
  }
});

function loadApps() {
  window.electronAPI.getApps();
}

window.electronAPI.onAppsLoaded((event, loadedApps) => {
  apps = loadedApps;
  console.log('Applications loaded:', apps.length);
  if (searchInput.value) {
    const filtered = filterCommands(searchInput.value);
    renderResults(filtered);
  }
});

function loadCommands() {
  window.electronAPI.loadCommands();
}

window.electronAPI.onCommandsLoaded((event, loadedCommands) => {
  commands = loadedCommands;
  console.log('Commands loaded:', commands.length);
  if (searchInput.value) {
    const filtered = filterCommands(searchInput.value);
    renderResults(filtered);
  }
});

function loadTheme() {
  window.electronAPI.getTheme();
}

window.electronAPI.onThemeLoaded((event, { theme, themeName }) => {
  console.log('Theme loaded:', themeName);
  applyTheme(theme);
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

