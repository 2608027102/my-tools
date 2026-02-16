const { exec, spawn } = require('child_process');
const { shell } = require('electron');

class CommandExecutor {
  constructor() {
    this.processes = {};
  }

  execute(command, callback) {
    console.log('Executing command:', command);

    if (command.type === 'system') {
      this.executeSystemCommand(command, callback);
    } else if (command.type === 'url') {
      this.openUrl(command, callback);
    } else if (command.type === 'script') {
      this.executeScript(command, callback);
    } else {
      callback({ success: false, error: 'Unknown command type' });
    }
  }

  executeSystemCommand(command, callback) {
    const cmd = command.command;
    const args = command.args || [];
    const options = {
      shell: true,
      cwd: command.cwd || process.cwd()
    };

    try {
      if (args.length > 0) {
        const child = spawn(cmd, args, options);
        let output = '';
        let error = '';

        child.stdout.on('data', (data) => {
          output += data.toString();
        });

        child.stderr.on('data', (data) => {
          error += data.toString();
        });

        child.on('close', (code) => {
          if (code === 0) {
            callback({ success: true, output });
          } else {
            callback({ success: false, error: error || `Command failed with code ${code}` });
          }
        });

        this.processes[command.id] = child;
      } else {
        exec(cmd, options, (error, stdout, stderr) => {
          if (error) {
            callback({ success: false, error: error.message });
          } else {
            callback({ success: true, output: stdout });
          }
        });
      }
    } catch (error) {
      callback({ success: false, error: error.message });
    }
  }

  executeScript(command, callback) {
    const script = command.script;
    const interpreter = command.interpreter || 'node';
    const options = {
      shell: true,
      cwd: command.cwd || process.cwd()
    };

    try {
      // For simplicity, we'll use exec for scripts
      exec(`${interpreter} -e "${script}"`, options, (error, stdout, stderr) => {
        if (error) {
          callback({ success: false, error: error.message });
        } else {
          callback({ success: true, output: stdout });
        }
      });
    } catch (error) {
      callback({ success: false, error: error.message });
    }
  }

  openUrl(command, callback) {
    const url = command.command;
    try {
      shell.openExternal(url).then(() => {
        callback({ success: true, output: `Opened URL: ${url}` });
      }).catch((error) => {
        callback({ success: false, error: error.message });
      });
    } catch (error) {
      callback({ success: false, error: error.message });
    }
  }

  killProcess(processId) {
    if (this.processes[processId]) {
      this.processes[processId].kill();
      delete this.processes[processId];
      return true;
    }
    return false;
  }

  killAllProcesses() {
    Object.keys(this.processes).forEach(processId => {
      this.killProcess(processId);
    });
  }
}

module.exports = CommandExecutor;