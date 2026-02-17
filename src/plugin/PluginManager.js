const fs = require('fs');
const path = require('path');

class PluginManager {
  constructor() {
    this.plugins = [];
    this.pluginPath = path.join(__dirname, '..', '..', 'plugins');
    this.initialize();
  }

  initialize() {
    if (!fs.existsSync(this.pluginPath)) {
      fs.mkdirSync(this.pluginPath, { recursive: true });
    }
  }

  loadPlugins() {
    try {
      const pluginDirs = fs.readdirSync(this.pluginPath);
      this.plugins = [];

      pluginDirs.forEach(dir => {
        const pluginDir = path.join(this.pluginPath, dir);
        if (fs.statSync(pluginDir).isDirectory()) {
          const pluginConfigPath = path.join(pluginDir, 'plugin.json');
          if (fs.existsSync(pluginConfigPath)) {
            try {
              const config = JSON.parse(fs.readFileSync(pluginConfigPath, 'utf8'));
              const plugin = {
                id: config.id,
                name: config.name,
                version: config.version,
                description: config.description,
                author: config.author,
                main: config.main ? path.join(pluginDir, config.main) : null,
                commands: config.commands || [],
                dir: pluginDir
              };
              
              if (plugin.main && fs.existsSync(plugin.main)) {
                try {
                  const pluginModule = require(plugin.main);
                  plugin.module = pluginModule;
                } catch (error) {
                  console.error(`Error loading plugin ${plugin.name}:`, error);
                }
              }
              
              this.plugins.push(plugin);
            } catch (error) {
              console.error(`Error parsing plugin config for ${dir}:`, error);
            }
          }
        }
      });

      console.log(`Loaded ${this.plugins.length} plugins`);
      return this.plugins;
    } catch (error) {
      console.error('Error loading plugins:', error);
      return [];
    }
  }

  getPlugins() {
    return this.plugins;
  }

  getPluginById(id) {
    return this.plugins.find(plugin => plugin.id === id);
  }

  getPluginCommands() {
    let commands = [];
    this.plugins.forEach(plugin => {
      if (plugin.commands && Array.isArray(plugin.commands)) {
        plugin.commands.forEach(cmd => {
          commands.push({
            ...cmd,
            pluginId: plugin.id,
            pluginName: plugin.name
          });
        });
      }
    });
    return commands;
  }

  executePluginCommand(pluginId, commandId, params) {
    const plugin = this.getPluginById(pluginId);
    if (!plugin) {
      console.error(`Plugin ${pluginId} not found`);
      return null;
    }

    const command = plugin.commands.find(cmd => cmd.id === commandId);
    if (!command) {
      console.error(`Command ${commandId} not found in plugin ${pluginId}`);
      return null;
    }

    if (plugin.module && plugin.module.executeCommand) {
      try {
        return plugin.module.executeCommand(commandId, params);
      } catch (error) {
        console.error(`Error executing command ${commandId} in plugin ${pluginId}:`, error);
        return null;
      }
    }

    return null;
  }

  executePluginCommandWithList(pluginId, commandId, params) {
    console.log('========== PluginManager.executePluginCommandWithList ==========');
    console.log('pluginId:', pluginId);
    console.log('commandId:', commandId);
    console.log('params:', params);
    
    const plugin = this.getPluginById(pluginId);
    if (!plugin) {
      console.error(`Plugin ${pluginId} not found`);
      return {
        success: false,
        error: 'Plugin not found'
      };
    }
    
    console.log('Found plugin:', plugin.name);

    const command = plugin.commands.find(cmd => cmd.id === commandId);
    if (!command) {
      console.error(`Command ${commandId} not found in plugin ${pluginId}`);
      return {
        success: false,
        error: 'Command not found'
      };
    }
    
    console.log('Found command:', command.name);

    if (plugin.module && plugin.module.executeCommand) {
      try {
        console.log('Executing plugin command:', commandId);
        
        // 捕获插件的console.log输出
        const originalConsoleLog = console.log;
        const pluginLogs = [];
        
        console.log = function(...args) {
          pluginLogs.push(args.join(' '));
          originalConsoleLog.apply(console, args);
        };
        
        // 检查是否有prompt参数
        if (params && params.prompt) {
          console.log('Processing prompt:', params.prompt);
          // 这里可以添加对prompt的处理逻辑
        }
        
        const result = plugin.module.executeCommand(commandId, params);
        
        // 恢复原始console.log
        console.log = originalConsoleLog;
        
        console.log('Plugin returned result:', result);
        console.log('Result type:', typeof result);
        console.log('Is array:', Array.isArray(result));
        console.log('Plugin logs:', pluginLogs);
        
        // Check if result contains a prompt request
        if (result && typeof result === 'object' && !Array.isArray(result) && result.type === 'prompt') {
          console.log('Returning prompt request');
          return {
            success: true,
            result: result,
            isPrompt: true,
            logs: pluginLogs
          };
        }
        
        // Check if result contains a list
        if (result && Array.isArray(result)) {
          console.log('Returning list result');
          return {
            success: true,
            result: result,
            isList: true,
            logs: pluginLogs
          };
        }
        
        // Check if result contains a single item
        if (result && typeof result === 'object' && !Array.isArray(result)) {
          console.log('Returning object result');
          return {
            success: true,
            result: result,
            isList: false,
            logs: pluginLogs
          };
        }
        
        // Default fallback
        if (result) {
          console.log('Returning other result');
          return {
            success: true,
            result: result,
            isList: false,
            logs: pluginLogs
          };
        }
        
        return {
          success: false,
          error: 'No result returned',
          logs: pluginLogs
        };
      } catch (error) {
        // 恢复原始console.log
        console.log = originalConsoleLog;
        
        console.error(`Error executing command ${commandId} in plugin ${pluginId}:`, error);
        return {
          success: false,
          error: error.message,
          logs: pluginLogs
        };
      }
    }

    console.log('Plugin module not found');
    return {
      success: false,
      error: 'Plugin module not found'
    };
  }

  reloadPlugins() {
    this.plugins = [];
    return this.loadPlugins();
  }
}

module.exports = PluginManager;