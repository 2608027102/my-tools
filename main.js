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

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

app.on('will-quit', function () {
  globalShortcut.unregisterAll();
});