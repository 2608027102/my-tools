const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

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
                icon: config.icon || 'data:image/png;base64,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',
                dir: pluginDir
              };
              
              if (plugin.main && fs.existsSync(plugin.main)) {
                try {
                  const pluginModule = require(plugin.main);
                  plugin.module = pluginModule;
                } catch (error) {
                  logger.error(`Error loading plugin ${plugin.name}:`, error);
                }
              }
              
              this.plugins.push(plugin);
            } catch (error) {
              logger.error(`Error parsing plugin config for ${dir}:`, error);
            }
          }
        }
      });

      logger.log(`Loaded ${this.plugins.length} plugins`);
      return this.plugins;
    } catch (error) {
      logger.error('Error loading plugins:', error);
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
            pluginName: plugin.name,
            icon: plugin.icon
          });
        });
      }
    });
    return commands;
  }

  executePluginCommand(pluginId, commandId, params) {
    const plugin = this.getPluginById(pluginId);
    if (!plugin) {
      logger.error(`Plugin ${pluginId} not found`);
      return null;
    }

    const command = plugin.commands.find(cmd => cmd.id === commandId);
    if (!command) {
      logger.error(`Command ${commandId} not found in plugin ${pluginId}`);
      return null;
    }

    if (plugin.module && plugin.module.executeCommand) {
      try {
        return plugin.module.executeCommand(commandId, params);
      } catch (error) {
        logger.error(`Error executing command ${commandId} in plugin ${pluginId}:`, error);
        return null;
      }
    }

    return null;
  }

  executePluginCommandWithList(pluginId, commandId, params) {
    logger.log('========== PluginManager.executePluginCommandWithList ==========');
    logger.log('pluginId: %s', pluginId);
    logger.log('commandId: %s', commandId);
    logger.log('params: %s', params);
    
    const plugin = this.getPluginById(pluginId);
    if (!plugin) {
      logger.error(`Plugin ${pluginId} not found`);
      return {
        success: false,
        error: 'Plugin not found'
      };
    }
    
    logger.log('Found plugin: %s', plugin.name);

    const command = plugin.commands.find(cmd => cmd.id === commandId);
    if (!command) {
      logger.error(`Command ${commandId} not found in plugin ${pluginId}`);
      return {
        success: false,
        error: 'Command not found'
      };
    }
    
    logger.log('Found command: %s', command.name);

    if (plugin.module && plugin.module.executeCommand) {
      try {
        logger.log('Executing plugin command: %s', commandId);
        
        // 捕获插件的console.log输出
        const originalConsoleLog = console.log;
        const pluginLogs = [];
        
        console.log = function(...args) {
          pluginLogs.push(args.join(' '));
          originalConsoleLog.apply(console, args);
        };
        
        // 检查是否有prompt参数
        if (params && params.prompt) {
          console.log('Processing prompt: %s', params.prompt);
          // 这里可以添加对prompt的处理逻辑
        }
        
        const result = plugin.module.executeCommand(commandId, params);
        
        // 恢复原始console.log
        console.log = originalConsoleLog;
        
        logger.log('Plugin returned result: %s', result);
        logger.log('Result type: %s', typeof result);
        logger.log('Is array: %s', Array.isArray(result));
        logger.log('Plugin logs: %s', pluginLogs);
        
        // Check if result contains a prompt request
        if (result && typeof result === 'object' && !Array.isArray(result) && result.type === 'prompt') {
          logger.log('Returning prompt request');
          return {
            success: true,
            result: result,
            isPrompt: true,
            logs: pluginLogs
          };
        }
        
        // Check if result contains HTML content
        if (result && typeof result === 'object' && !Array.isArray(result) && result.type === 'html') {
          logger.log('Returning HTML content');
          return {
            success: true,
            result: result,
            isHtml: true,
            logs: pluginLogs
          };
        }
        
        // Check if result contains a list
        if (result && Array.isArray(result)) {
          logger.log('Returning list result');
          return {
            success: true,
            result: result,
            isList: true,
            logs: pluginLogs
          };
        }
        
        // Check if result contains a single item
        if (result && typeof result === 'object' && !Array.isArray(result)) {
          logger.log('Returning object result');
          // 检查是否是错误对象
          if (result.success === false) {
            return {
              success: false,
              error: result.error || 'Unknown error',
              logs: pluginLogs
            };
          }
          return {
            success: true,
            result: result,
            isList: false,
            logs: pluginLogs
          };
        }
        
        // Default fallback
        if (result) {
          logger.log('Returning other result');
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
        
        logger.error(`Error executing command ${commandId} in plugin ${pluginId}:`, error);
        return {
          success: false,
          error: error.message,
          logs: pluginLogs
        };
      }
    }

    logger.log('Plugin module not found');
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