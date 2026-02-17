const { app, BrowserWindow, globalShortcut, ipcMain } = require('electron');
const path = require('path');
const PluginManager = require('./src/plugin/PluginManager');
const ConfigManager = require('./src/config/ConfigManager');
const CommandExecutor = require('./src/executor/CommandExecutor');
const ThemeManager = require('./src/config/ThemeManager');
const AppScanner = require('./src/executor/AppScanner');

let mainWindow;
let pluginManager;
let configManager;
let commandExecutor;
let themeManager;
let appScanner;
let detachWindow = null;
let detachedPluginState = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 600,
    height: 400,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));
  mainWindow.hide();

  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

function createDetachWindow() {
  console.log('Creating detach window with plugin state:', detachedPluginState);
  
  // 关闭已存在的分离窗口
  if (detachWindow) {
    detachWindow.close();
  }
  
  // 创建新的分离窗口
  detachWindow = new BrowserWindow({
    width: 800,
    height: 600,
    title: '插件分离窗口',
    frame: true,
    resizable: true,
    maximizable: true,
    minimizable: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });
  
  // 加载分离窗口的HTML
  detachWindow.loadFile(path.join(__dirname, 'renderer', 'detach.html'));
  
  // 传递插件状态到分离窗口
  detachWindow.webContents.on('did-finish-load', () => {
    detachWindow.webContents.send('initialize-detach-window', {
      pluginState: detachedPluginState
    });
  });
  
  // 监听分离窗口关闭事件
  detachWindow.on('closed', function () {
    detachWindow = null;
    
    // 通知主窗口恢复插件状态
    if (mainWindow && detachedPluginState) {
      mainWindow.webContents.send('restore-plugin-state', detachedPluginState);
      detachedPluginState = null;
    }
  });
}

app.whenReady().then(() => {
  pluginManager = new PluginManager();
  pluginManager.loadPlugins();
  
  configManager = new ConfigManager();
  commandExecutor = new CommandExecutor();
  themeManager = new ThemeManager();
  appScanner = new AppScanner();
  
  // 先扫描应用程序，然后再创建窗口
  const apps = appScanner.scanApps();
  console.log('App scanning completed, found', apps.length, 'applications');
  
  createWindow();

  globalShortcut.register('Ctrl+Space', () => {
    if (mainWindow.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow.show();
      mainWindow.focus();
    }
  });

  // 注册窗口分离快捷键
  globalShortcut.register('Ctrl+D', () => {
    if (mainWindow.isVisible()) {
      mainWindow.webContents.send('detach-window-request');
    }
  });

  // IPC事件处理器
  ipcMain.on('hide-window', () => {
    mainWindow.hide();
  });

  ipcMain.on('execute-command', (event, command) => {
    commandExecutor.execute(command, (result) => {
      console.log('Command execution result:', result);
      event.reply('command-executed', result);
    });
  });

  ipcMain.on('get-plugins', (event) => {
    const plugins = pluginManager.getPlugins();
    event.reply('plugins-loaded', plugins);
  });

  ipcMain.on('get-plugin-commands', (event) => {
    const commands = pluginManager.getPluginCommands();
    console.log('Sending plugin commands to renderer:', commands.length);
    event.reply('plugin-commands-loaded', commands);
  });

  ipcMain.on('execute-plugin-command', (event, { pluginId, commandId, params }) => {
    const result = pluginManager.executePluginCommand(pluginId, commandId, params);
    event.reply('plugin-command-executed', { success: true, result });
  });

  ipcMain.on('execute-plugin-command-with-list', (event, { pluginId, commandId, params }) => {
    console.log('Received execute-plugin-command-with-list:', { pluginId, commandId, params });
    const result = pluginManager.executePluginCommandWithList(pluginId, commandId, params);
    console.log('Sending plugin-command-executed-with-list:', result);
    event.reply('plugin-command-executed-with-list', result);
  });

  ipcMain.on('reload-plugins', (event) => {
    pluginManager.loadPlugins();
    event.reply('plugins-reloaded', pluginManager.getPlugins());
  });

  ipcMain.on('load-commands', (event) => {
    const commands = configManager.loadCommands();
    event.reply('commands-loaded', commands);
  });

  ipcMain.on('add-command', (event, command) => {
    const newCommand = configManager.addCommand(command);
    event.reply('command-added', newCommand);
  });

  ipcMain.on('update-command', (event, { id, updates }) => {
    const updatedCommand = configManager.updateCommand(id, updates);
    event.reply('command-updated', updatedCommand);
  });

  ipcMain.on('delete-command', (event, id) => {
    const success = configManager.deleteCommand(id);
    event.reply('command-deleted', success);
  });

  ipcMain.on('get-theme', (event) => {
    const theme = themeManager.getCurrentTheme();
    const themeName = themeManager.getThemeName();
    event.reply('theme-loaded', { theme, themeName });
  });

  ipcMain.on('set-theme', (event, themeName) => {
    const success = themeManager.setTheme(themeName);
    if (success) {
      const theme = themeManager.getCurrentTheme();
      event.reply('theme-updated', { theme, themeName });
    } else {
      event.reply('theme-updated', { error: 'Invalid theme' });
    }
  });

  ipcMain.on('get-all-themes', (event) => {
    const themes = themeManager.getAllThemes();
    event.reply('themes-loaded', themes);
  });

  ipcMain.on('get-apps', (event) => {
    const apps = appScanner.getApps();
    console.log('Sending apps to renderer:', apps.length);
    event.reply('apps-loaded', apps);
  });

  ipcMain.on('search-apps', (event, query) => {
    const apps = appScanner.searchApps(query);
    console.log('Searching apps with query:', query, 'found', apps.length);
    event.reply('apps-searched', apps);
  });

  ipcMain.on('execute-app', (event, app) => {
    const success = appScanner.executeApp(app);
    event.reply('app-executed', { success });
  });

  // 处理复制到剪贴板的请求
  ipcMain.on('copy-to-clipboard', (event, text) => {
    console.log('Copying to clipboard:', text);
    try {
      const { clipboard } = require('electron');
      clipboard.writeText(text);
      console.log('Copied to clipboard successfully');
      event.reply('copy-to-clipboard-complete', { success: true });
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      event.reply('copy-to-clipboard-complete', { success: false, error: error.message });
    }
  });

  // 处理获取剪贴板内容的请求
  ipcMain.on('get-clipboard-content', (event) => {
    try {
      const { clipboard } = require('electron');
      const content = clipboard.readText();
      console.log('Retrieved clipboard content:', content);
      event.reply('clipboard-content-retrieved', { success: true, content });
    } catch (error) {
      console.error('Failed to get clipboard content:', error);
      event.reply('clipboard-content-retrieved', { success: false, error: error.message });
    }
  });

  // 处理窗口分离请求
  ipcMain.on('detach-window', (event, pluginState) => {
    console.log('Received detach-window request with plugin state:', pluginState);
    detachedPluginState = pluginState;
    
    // 创建分离窗口
    createDetachWindow();
  });

  // 处理分离窗口的插件命令执行
  ipcMain.on('execute-plugin-command-in-detach', (event, { pluginId, commandId, params }) => {
    const result = pluginManager.executePluginCommandWithList(pluginId, commandId, params);
    if (detachWindow) {
      detachWindow.webContents.send('plugin-command-executed-in-detach', result);
    }
  });

  // 处理关闭分离窗口请求
  ipcMain.on('close-detach-window', () => {
    console.log('Received close-detach-window request');
    if (detachWindow) {
      detachWindow.close();
      detachWindow = null;
      
      // 通知主窗口恢复插件状态
      if (mainWindow && detachedPluginState) {
        mainWindow.webContents.send('restore-plugin-state', detachedPluginState);
        detachedPluginState = null;
      }
    }
  });

  // 处理分离窗口的最大化请求
  ipcMain.on('maximize-detach-window', () => {
    if (detachWindow) {
      if (detachWindow.isMaximized()) {
        detachWindow.unmaximize();
      } else {
        detachWindow.maximize();
      }
    }
  });

  // 处理分离窗口的最小化请求
  ipcMain.on('minimize-detach-window', () => {
    if (detachWindow) {
      detachWindow.minimize();
    }
  });

  // 处理分离窗口的置顶请求
  ipcMain.on('toggle-always-on-top', () => {
    if (detachWindow) {
      const isAlwaysOnTop = detachWindow.isAlwaysOnTop();
      detachWindow.setAlwaysOnTop(!isAlwaysOnTop);
    }
  });

  // 处理分离窗口的状态同步
  ipcMain.on('sync-plugin-state', (event, pluginState) => {
    detachedPluginState = pluginState;
  });

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

app.on('will-quit', function () {
  // 关闭分离窗口
  if (detachWindow) {
    detachWindow.close();
  }
  
  // 注销所有全局快捷键
  globalShortcut.unregisterAll();
});