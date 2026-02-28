const fs = require('fs');
const { execSync } = require('child_process');

module.exports =  {
  constructor() {
    console.debug('Path Opener plugin initialized');
  },

  executeCommand(commandId, params) {
    console.debug('========== Path Opener Plugin ==========');
    console.debug('commandId:', commandId);
    console.debug('params:', params);

    if (commandId === 'open-path') {
      return this.openPath(params);
    }

    console.debug('Unknown command:', commandId);
    return {
      success: false,
      error: 'Unknown command'
    };
  },

  openPath(params) {
    const path = params.text || params.path;
    if (!path) {
      return {
        success: false,
        error: 'No path provided'
      };
    }

    try {
      // 检查路径是否存在
      const exists = fs.existsSync(path);
      if (!exists) {
        return {
          success: false,
          error: `Path does not exist: ${path}`
        };
      }

      // 检查是文件还是文件夹
      const stat = fs.statSync(path);
      const isDirectory = stat.isDirectory();
      const isFile = stat.isFile();

      // 打开路径
      if (process.platform === 'win32') {
        // Windows
        execSync(`start "" "${path}"`);
      } else if (process.platform === 'darwin') {
        // macOS
        execSync(`open "${path}"`);
      } else {
        // Linux
        execSync(`xdg-open "${path}"`);
      }

      return {
        success: true,
        result: `Opened ${isDirectory ? 'directory' : 'file'}: ${path}`
      };
    } catch (error) {
      console.error('Error opening path:', error);
      return {
        success: false,
        error: `Failed to open path: ${error.message}`
      };
    }
  },

  destroy() {
    console.debug('Path Opener plugin destroyed');
  }
}