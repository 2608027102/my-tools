const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const logger = require('../utils/logger');

class AppScanner {
  constructor() {
    this.apps = [];
    this.platform = process.platform;
  }

  scanApps() {
    this.apps = [];
    
    switch (this.platform) {
      case 'win32':
        this.scanWindowsApps();
        break;
      case 'darwin':
        this.scanMacApps();
        break;
      case 'linux':
        this.scanLinuxApps();
        break;
      default:
        logger.log('Unsupported platform: %s', this.platform);
    }

    logger.log(`Scanned ${this.apps.length} applications`);
    return this.apps;
  }

  scanWindowsApps() {
    // Scan start menu directories
    const appDirs = [
      process.env.LOCALAPPDATA + '\\Microsoft\\Windows\\Start Menu\\Programs',
      process.env.PROGRAMDATA + '\\Microsoft\\Windows\\Start Menu\\Programs'
    ];

    appDirs.forEach(dir => {
      if (fs.existsSync(dir)) {
        this.scanDirectory(dir);
      }
    });

    // Enhanced registry scanning
    this.scanRegistry();
    
    // Add common Windows system apps
    this.addSystemApps();
  }

  addSystemApps() {
    const systemApps = [
      { name: 'Notepad', path: 'notepad.exe', type: 'system' },
      { name: 'Calculator', path: 'calc.exe', type: 'system' },
      { name: 'Command Prompt', path: 'cmd.exe', type: 'system' },
      { name: 'PowerShell', path: 'powershell.exe', type: 'system' },
      { name: 'Task Manager', path: 'taskmgr.exe', type: 'system' },
      { name: 'Control Panel', path: 'control.exe', type: 'system' },
      { name: 'System Settings', path: 'ms-settings:', type: 'system' },
      { name: 'File Explorer', path: 'explorer.exe', type: 'system' },
      { name: 'Paint', path: 'mspaint.exe', type: 'system' },
      { name: 'Registry Editor', path: 'regedit.exe', type: 'system' }
    ];

    systemApps.forEach(app => {
      if (!this.apps.some(existing => existing.name === app.name)) {
        this.apps.push({
          id: `win-sys-${app.name.toLowerCase().replace(/\s+/g, '-')}`,
          name: app.name,
          path: app.path,
          type: 'application',
          platform: 'windows'
        });
      }
    });
  }

  scanRegistry() {
    try {
      const output = execSync('reg query "HKLM\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall" /s', { encoding: 'utf8' });
      this.parseRegistryOutput(output, 'HKLM');
    } catch (error) {
      logger.error('Error scanning Windows registry (HKLM):', error);
    }

    try {
      const userOutput = execSync('reg query "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall" /s', { encoding: 'utf8' });
      this.parseRegistryOutput(userOutput, 'HKCU');
    } catch (error) {
      logger.error('Error scanning Windows registry (HKCU):', error);
    }
  }

  parseRegistryOutput(output, source) {
    if (!output) return;
    
    const lines = output.split('\r\n');
    let currentAppName = null;
    let currentAppPath = null;
    let currentAppVersion = null;
    
    lines.forEach(line => {
      line = line.trim();
      if (!line) return;
      
      // Check for registry keys
      if (line.startsWith('HKEY_')) {
        // Save previous app if exists
        if (currentAppName) {
          this.addAppFromRegistry(currentAppName, currentAppPath, currentAppVersion, source);
        }
        currentAppName = null;
        currentAppPath = null;
        currentAppVersion = null;
        return;
      }
      
      // Parse DisplayName
      if (line.includes('DisplayName')) {
        const match = line.match(/DisplayName\s+REG_SZ\s+(.+)/);
        if (match) {
          currentAppName = match[1].trim();
        }
      }
      
      // Parse DisplayVersion
      if (line.includes('DisplayVersion')) {
        const match = line.match(/DisplayVersion\s+REG_SZ\s+(.+)/);
        if (match) {
          currentAppVersion = match[1].trim();
        }
      }
      
      // Parse InstallLocation
      if (line.includes('InstallLocation')) {
        const match = line.match(/InstallLocation\s+REG_SZ\s+(.+)/);
        if (match) {
          currentAppPath = match[1].trim();
        }
      }
      
      // Parse DisplayIcon (might contain executable path)
      if (line.includes('DisplayIcon')) {
        const match = line.match(/DisplayIcon\s+REG_SZ\s+(.+)/);
        if (match && !currentAppPath) {
          currentAppPath = match[1].trim();
        }
      }
    });
    
    // Add the last app
    if (currentAppName) {
      this.addAppFromRegistry(currentAppName, currentAppPath, currentAppVersion, source);
    }
  }

  addAppFromRegistry(appName, appPath, appVersion, source) {
    if (!appName) return;

    if (appPath) {
      try {
        const stat = fs.statSync(appPath);
        if (!stat.isFile()) {
          logger.debug(`Registry app path is not a file: ${appPath}`);
          return;
        }
      } catch (error) {
        return;
      }
    }
    
    // Check for duplicates
    if (!this.apps.some(existing => existing.name === appName)) {
      this.apps.push({
        id: `win-${source}-${appName.toLowerCase().replace(/\s+/g, '-')}`,
        name: appName,
        version: appVersion || 'Unknown',
        path: appPath,
        type: 'application',
        platform: 'windows'
      });
    }
  }

  // Directories to skip during scanning
  skipDirectory(dirPath) {
    const skipDirs = [
      'WindowsApps',
      'Windows Defender',
      'Windows NT',
      'Windows Security',
      'System32',
      'SysWOW64',
      'Common Files',
      'Internet Explorer',
      'Windows Mail',
      'Windows Media Player',
      'Windows Photo Viewer',
      'Windows Sidebar',
      'Windows Speech Recognition',
      'Windows Sync Center',
      'Windows System Assessment Tool',
      'Windows Update',
      'Microsoft.NET',
      'Reference Assemblies',
      'PackageManagement',
      'WindowsPowerShell',
      'Windows Kits',
      'MSBuild',
      'dotnet',
      'node_modules',
      'bin',
      'lib',
      'src',
      'obj',
      '.git',
      '.vscode',
      '.idea',
      'build',
      'dist',
      'logs',
      'temp',
      'tmp'
    ];

    const dirName = path.basename(dirPath).toLowerCase();
    return skipDirs.some(skipDir => dirName.includes(skipDir.toLowerCase()));
  }

  scanMacApps() {
    const appDir = '/Applications';
    if (fs.existsSync(appDir)) {
      const files = fs.readdirSync(appDir);
      files.forEach(file => {
        if (file.endsWith('.app')) {
          this.apps.push({
            id: `mac-app-${file.toLowerCase().replace(/\s+/g, '-')}`,
            name: file.replace('.app', ''),
            path: path.join(appDir, file),
            type: 'application',
            platform: 'macos'
          });
        }
      });
    }
  }

  scanLinuxApps() {
    const appDirs = [
      '/usr/share/applications',
      path.join(process.env.HOME, '.local', 'share', 'applications')
    ];

    appDirs.forEach(dir => {
      if (fs.existsSync(dir)) {
        const files = fs.readdirSync(dir);
        files.forEach(file => {
          if (file.endsWith('.desktop')) {
            this.parseDesktopFile(path.join(dir, file));
          }
        });
      }
    });
  }

  scanDirectory(dir, depth = 0) {
    if (depth > 3) return;

    try {
      const files = fs.readdirSync(dir);
      files.forEach(file => {
        const fullPath = path.join(dir, file);
        
        if (this.skipDirectory(fullPath)) {
          return;
        }
        
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          if (!file.startsWith('.')) {
            this.scanDirectory(fullPath, depth + 1);
          }
        } else if (stat.isFile()) {
          if (this.platform === 'win32' && (file.endsWith('.exe') || file.endsWith('.lnk'))) {
            this.apps.push({
              id: `win-exe-${file.toLowerCase().replace(/\s+/g, '-')}`,
              name: file.replace(/\.(exe|lnk)$/i, ''),
              path: fullPath,
              type: 'application',
              platform: 'windows'
            });
          } else if ((this.platform === 'darwin' || this.platform === 'linux') && stat.mode & 0o111) {
            this.apps.push({
              id: `${this.platform}-exec-${file.toLowerCase().replace(/\s+/g, '-')}`,
              name: file,
              path: fullPath,
              type: 'application',
              platform: this.platform
            });
          }
        }
      });
    } catch (error) {
      if (error.code !== 'EACCES' && error.code !== 'EPERM' && error.code !== 'ENOENT') {
        logger.error('Error scanning directory:', error);
      }
    }
  }

  parseDesktopFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');
      let name = '';
      let exec = '';

      lines.forEach(line => {
        if (line.startsWith('Name=')) {
          name = line.substring(5);
        } else if (line.startsWith('Exec=')) {
          exec = line.substring(5).replace(/ %./g, '');
        }
      });

      if (name && exec) {
        this.apps.push({
          id: `linux-app-${name.toLowerCase().replace(/\s+/g, '-')}`,
          name: name,
          path: exec,
          type: 'application',
          platform: 'linux'
        });
      }
    } catch (error) {
      logger.error('Error parsing desktop file:', error);
    }
  }

  getApps() {
    return this.apps;
  }

  searchApps(query) {
    if (!query) return this.apps;
    
    const lowerQuery = query.toLowerCase();
    return this.apps.filter(app => 
      app.name.toLowerCase().includes(lowerQuery) ||
      (app.path && app.path.toLowerCase().includes(lowerQuery))
    );
  }

  executeApp(app) {
    if (!app.path) {
      logger.error('No path specified for app: %s', app.name);
      return false;
    }

    try {
      if (this.platform === 'win32') {
        execSync(`start "" "${app.path}"`, { shell: true });
      } else if (this.platform === 'darwin') {
        execSync(`open "${app.path}"`, { shell: true });
      } else if (this.platform === 'linux') {
        execSync(app.path, { shell: true, detached: true });
      }
      return true;
    } catch (error) {
      logger.error('Error executing app:', error);
      return false;
    }
  }
}

module.exports = AppScanner;