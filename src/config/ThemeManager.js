const ConfigManager = require('./ConfigManager');

class ThemeManager {
  constructor() {
    this.configManager = new ConfigManager();
    this.themes = {
      dark: {
        name: 'Dark',
        body: {
          backgroundColor: 'rgba(24, 24, 24, 0.9)',
          color: 'white'
        },
        searchBox: {
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          color: 'white',
          placeholderColor: 'rgba(255, 255, 255, 0.5)'
        },
        resultItem: {
          hoverBackgroundColor: 'rgba(255, 255, 255, 0.1)',
          activeBackgroundColor: 'rgba(255, 255, 255, 0.2)'
        },
        footer: {
          color: 'rgba(255, 255, 255, 0.5)'
        }
      },
      light: {
        name: 'Light',
        body: {
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          color: '#333'
        },
        searchBox: {
          backgroundColor: 'rgba(0, 0, 0, 0.05)',
          color: '#333',
          placeholderColor: 'rgba(0, 0, 0, 0.5)'
        },
        resultItem: {
          hoverBackgroundColor: 'rgba(0, 0, 0, 0.05)',
          activeBackgroundColor: 'rgba(0, 0, 0, 0.1)'
        },
        footer: {
          color: 'rgba(0, 0, 0, 0.5)'
        }
      }
    };
  }

  getCurrentTheme() {
    const themeName = this.configManager.loadConfig('theme') || 'dark';
    return this.themes[themeName] || this.themes.dark;
  }

  getThemeName() {
    return this.configManager.loadConfig('theme') || 'dark';
  }

  setTheme(themeName) {
    if (this.themes[themeName]) {
      this.configManager.saveConfig('theme', themeName);
      return true;
    }
    return false;
  }

  getAllThemes() {
    return Object.keys(this.themes).map(key => ({
      id: key,
      name: this.themes[key].name
    }));
  }

  getThemeStyles(themeName) {
    return this.themes[themeName] || this.themes.dark;
  }
}

module.exports = ThemeManager;