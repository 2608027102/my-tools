const fs = require('fs');
const path = require('path');

class ConfigManager {
  constructor() {
    this.configPath = path.join(__dirname, '..', '..', 'config');
    this.commandsPath = path.join(this.configPath, 'commands.json');
    this.initialize();
  }

  initialize() {
    // Create config directory if it doesn't exist
    if (!fs.existsSync(this.configPath)) {
      fs.mkdirSync(this.configPath, { recursive: true });
    }

    // Create commands.json if it doesn't exist
    if (!fs.existsSync(this.commandsPath)) {
      fs.writeFileSync(this.commandsPath, JSON.stringify([], null, 2));
    }
  }

  loadCommands() {
    try {
      const data = fs.readFileSync(this.commandsPath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error loading commands:', error);
      return [];
    }
  }

  saveCommands(commands) {
    try {
      fs.writeFileSync(this.commandsPath, JSON.stringify(commands, null, 2));
      return true;
    } catch (error) {
      console.error('Error saving commands:', error);
      return false;
    }
  }

  addCommand(command) {
    const commands = this.loadCommands();
    const newCommand = {
      id: Date.now().toString(),
      ...command
    };
    commands.push(newCommand);
    return this.saveCommands(commands) ? newCommand : null;
  }

  updateCommand(id, updates) {
    const commands = this.loadCommands();
    const index = commands.findIndex(cmd => cmd.id === id);
    if (index === -1) {
      return null;
    }
    commands[index] = { ...commands[index], ...updates };
    return this.saveCommands(commands) ? commands[index] : null;
  }

  deleteCommand(id) {
    const commands = this.loadCommands();
    const filteredCommands = commands.filter(cmd => cmd.id !== id);
    if (filteredCommands.length === commands.length) {
      return false;
    }
    return this.saveCommands(filteredCommands);
  }

  getCommandById(id) {
    const commands = this.loadCommands();
    return commands.find(cmd => cmd.id === id);
  }

  loadConfig(key) {
    const configFile = path.join(this.configPath, 'config.json');
    try {
      if (fs.existsSync(configFile)) {
        const data = fs.readFileSync(configFile, 'utf8');
        const config = JSON.parse(data);
        return key ? config[key] : config;
      }
      return null;
    } catch (error) {
      console.error('Error loading config:', error);
      return null;
    }
  }

  saveConfig(key, value) {
    const configFile = path.join(this.configPath, 'config.json');
    try {
      let config = {};
      if (fs.existsSync(configFile)) {
        const data = fs.readFileSync(configFile, 'utf8');
        config = JSON.parse(data);
      }
      config[key] = value;
      fs.writeFileSync(configFile, JSON.stringify(config, null, 2));
      return true;
    } catch (error) {
      console.error('Error saving config:', error);
      return false;
    }
  }
}

module.exports = ConfigManager;