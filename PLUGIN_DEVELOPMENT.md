# Speed Launcher 插件开发指南

## 插件系统概述

Speed Launcher 采用了高度可扩展的插件架构，允许开发者创建自定义功能模块来扩展应用能力。

### 核心特性
- **热插拔**：支持动态加载和卸载插件，无需重启应用
- **API统一**：提供简洁的插件开发接口
- **命令集成**：插件命令直接集成到主搜索界面
- **权限控制**：插件在受控环境中运行，确保系统安全
- **生命周期管理**：完整的插件初始化、执行和销毁流程
- **列表返回支持**：插件可返回列表结果，支持二级选择

## 插件目录结构

```
plugins/
├── my-plugin/
│   ├── plugin.json          # 插件配置文件
│   ├── main.js             # 插件主文件
│   └── assets/             # 资源文件（可选）
└── ...
```

## 插件配置文件 (plugin.json)

每个插件必须包含 `plugin.json` 配置文件，定义插件的基本信息和命令。

### 配置字段说明

```json
{
  "id": "my-plugin",                    // 插件唯一标识符（必需）
  "name": "我的插件",                 // 插件显示名称（必需）
  "version": "1.0.0",               // 插件版本号（必需）
  "description": "插件功能描述",        // 插件描述（可选）
  "author": "开发者名称",             // 插件作者（可选）
  "main": "main.js",                 // 插件主文件路径（可选）
  "commands": [                       // 插件命令列表（可选）
    {
      "id": "hello",                   // 命令唯一标识符（必需）
      "name": "问候",                 // 命令显示名称（必需）
      "description": "输出问候信息",    // 命令描述（可选）
      "keywords": ["hello", "hi"]       // 搜索关键词（可选）
    }
  ]
}
```

### 配置示例

#### 简单工具插件
```json
{
  "id": "calculator",
  "name": "高级计算器",
  "version": "1.0.0",
  "description": "提供高级计算功能",
  "author": "Your Name",
  "main": "main.js",
  "commands": [
    {
      "id": "calculate",
      "name": "计算",
      "description": "执行数学计算",
      "keywords": ["calc", "math", "compute"]
    }
  ]
}
```

#### 网络服务插件
```json
{
  "id": "weather-service",
  "name": "天气查询",
  "version": "2.1.0",
  "description": "查询实时天气信息",
  "author": "Weather Team",
  "main": "weather.js",
  "commands": [
    {
      "id": "get-weather",
      "name": "查询天气",
      "description": "获取指定城市的天气信息",
      "keywords": ["weather", "天气", "气温"]
    },
    {
      "id": "get-forecast",
      "name": "天气预报",
      "description": "获取未来几天的天气预报",
      "keywords": ["forecast", "预报"]
    }
  ]
}
```

#### 列表选择插件
```json
{
  "id": "file-manager",
  "name": "文件管理器",
  "version": "1.0.0",
  "description": "提供文件管理功能，支持列表选择",
  "author": "File Manager Team",
  "main": "main.js",
  "commands": [
    {
      "id": "list-files",
      "name": "列出文件",
      "description": "显示文件列表",
      "keywords": ["list", "files", "文件"]
    },
    {
      "id": "open-folder",
      "name": "打开文件夹",
      "description": "打开指定文件夹",
      "keywords": ["open", "folder", "文件夹"]
    }
  ]
}
```

## 插件主文件 (main.js)

插件主文件导出以下函数来处理插件生命周期和命令执行。

### API 接口

#### 1. 初始化函数
```javascript
module.exports = {
  init() {
    // 插件初始化时调用
    console.log('Plugin initialized');
    // 可以在这里执行初始化操作，如加载配置、建立连接等
  }
}
```

#### 2. 命令执行函数

插件可以返回两种类型的结果：
- **单个结果**：直接返回执行结果
- **列表结果**：返回数组，支持二级选择

```javascript
module.exports = {
  executeCommand(commandId, params) {
    // 执行指定的插件命令
    console.log('Executing command:', commandId, 'with params:', params);
    
    switch (commandId) {
      case 'hello':
        // 返回单个结果
        return {
          success: true,
          result: 'Hello from plugin!'
        };
      case 'list-items':
        // 返回列表结果
        return [
          { name: '项目1', value: 'item1' },
          { name: '项目2', value: 'item2' }
        ];
      case 'calculate':
        // 执行计算逻辑
        const result = performCalculation(params);
        return {
          success: true,
          result: result
        };
      default:
        return {
          success: false,
          error: 'Unknown command'
        };
    }
  }
}
```

#### 3. 销毁函数
```javascript
module.exports = {
  destroy() {
    // 插件卸载时调用
    console.log('Plugin destroyed');
    // 可以在这里执行清理操作，如关闭连接、释放资源等
  }
}
```

### 完整示例插件

#### 基础示例：问候插件
```javascript
// plugins/hello-plugin/plugin.json
{
  "id": "hello-plugin",
  "name": "问候插件",
  "version": "1.0.0",
  "description": "提供简单的问候功能",
  "author": "Developer",
  "main": "main.js",
  "commands": [
    {
      "id": "greet",
      "name": "问候",
      "description": "输出问候信息",
      "keywords": ["hello", "hi", "问候"]
    }
  ]
}

// plugins/hello-plugin/main.js
module.exports = {
  init() {
    console.log('Hello plugin initialized');
  },

  executeCommand(commandId, params) {
    if (commandId === 'greet') {
      const name = params.name || '用户';
      const message = `你好，${name}！欢迎使用 Speed Launcher。`;
      
      return {
        success: true,
        result: {
          message: message,
          timestamp: new Date().toISOString()
        }
      };
    }
    
    return {
      success: false,
      error: 'Unknown command'
    };
  },

  destroy() {
    console.log('Hello plugin destroyed');
  }
};
```

#### 高级示例：列表选择插件
```javascript
// plugins/file-manager/plugin.json
{
  "id": "file-manager",
  "name": "文件管理器",
  "version": "1.0.0",
  "description": "提供文件管理功能，支持列表选择",
  "author": "File Manager Team",
  "main": "main.js",
  "commands": [
    {
      "id": "list-files",
      "name": "列出文件",
      "description": "显示文件列表",
      "keywords": ["list", "files", "文件"]
    },
    {
      "id": "open-folder",
      "name": "打开文件夹",
      "description": "打开指定文件夹",
      "keywords": ["open", "folder", "文件夹"]
    }
  ]
}

// plugins/file-manager/main.js
const fs = require('fs');
const path = require('path');

module.exports = {
  init() {
    console.log('File manager plugin initialized');
  },

  executeCommand(commandId, params) {
    console.log('Executing command:', commandId, 'with params:', params);
    
    switch (commandId) {
      case 'list-files':
        return this.listFiles(params.path || '.');
      case 'open-folder':
        return this.openFolder(params.path || '.');
      default:
        return {
          success: false,
          error: 'Unknown command'
        };
    }
  },

  listFiles(dirPath) {
    try {
      const files = fs.readdirSync(dirPath);
      const fileList = files.map(file => {
        const fullPath = path.join(dirPath, file);
        const stats = fs.statSync(fullPath);
        
        return {
          name: file,
          path: fullPath,
          isDirectory: stats.isDirectory(),
          size: stats.size,
          modified: stats.mtime
        };
      });
      
      // 直接返回数组，系统会自动检测为列表结果
      return fileList;
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  },

  openFolder(dirPath) {
    try {
      const stats = fs.statSync(dirPath);
      if (stats.isDirectory()) {
        return {
          success: true,
          result: `已打开文件夹: ${dirPath}`
        };
      } else {
        return {
          success: false,
          error: '指定的路径不是文件夹'
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  },

  destroy() {
    console.log('File manager plugin destroyed');
  }
};
```

## 插件开发最佳实践

### 1. 错误处理
```javascript
module.exports = {
  executeCommand(commandId, params) {
    try {
      // 执行命令逻辑
      return { success: true, result: data };
    } catch (error) {
      // 捕获并返回错误信息
      return {
        success: false,
        error: error.message,
        stack: error.stack
      };
    }
  }
}
```

### 2. 参数验证
```javascript
module.exports = {
  executeCommand(commandId, params) {
    // 验证必需参数
    if (!params || !params.requiredParam) {
      return {
        success: false,
        error: 'Missing required parameter'
      };
    }
    
    // 验证参数类型
    if (typeof params.number !== 'number') {
      return {
        success: false,
        error: 'Invalid parameter type'
      };
    }
    
    // 执行命令
    return { success: true, result: data };
  }
}
```

### 3. 异步操作
```javascript
module.exports = {
  executeCommand(commandId, params) {
    // 返回 Promise 支持异步操作
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve({
          success: true,
          result: 'Async operation completed'
        });
      }, 1000);
    });
  }
}
```

### 4. 资源管理
```javascript
module.exports = {
  init() {
    // 加载插件资源
    this.loadResources();
  },

  loadResources() {
    const resourcePath = path.join(__dirname, 'assets');
    // 加载配置、模板等资源
  },

  destroy() {
    // 清理资源
    this.cleanupResources();
  }
}
```

## 插件生命周期

### 1. 加载阶段
1. **发现插件**：扫描 plugins 目录
2. **解析配置**：读取 plugin.json 文件
3. **加载模块**：动态加载 main.js 文件
4. **初始化插件**：调用 `init()` 函数
5. **注册命令**：将插件命令添加到搜索系统

### 2. 执行阶段
1. **用户搜索**：输入关键词匹配插件命令
2. **显示结果**：插件命令出现在搜索列表中
3. **用户选择**：选择并执行插件命令
4. **命令执行**：调用 `executeCommand()` 函数
5. **结果检测**：系统自动检测返回值类型
6. **直接执行**：如果返回单个结果，直接执行
7. **列表显示**：如果返回数组，显示列表选择界面
8. **二级选择**：在列表中选择具体项目执行

### 3. 卸载阶段
1. **插件移除**：从 plugins 目录删除插件
2. **清理资源**：调用 `destroy()` 函数
3. **命令注销**：从搜索系统移除插件命令

## 插件能力总结

### 当前系统支持的插件能力

#### 1. 命令扩展
- **自定义命令**：添加新的搜索命令
- **参数处理**：支持命令参数传递
- **结果返回**：返回结构化的执行结果
- **列表返回**：直接返回数组，系统自动检测并显示列表选择界面
- **错误处理**：完善的错误捕获和处理

#### 2. 搜索集成
- **关键词匹配**：通过 keywords 字段进行搜索
- **名称匹配**：支持命令名称搜索
- **描述搜索**：支持描述内容搜索
- **优先级排序**：按匹配度排序搜索结果

#### 3. 生命周期管理
- **初始化钩子**：插件加载时的初始化
- **执行钩子**：命令执行时的处理
- **销毁钩子**：插件卸载时的清理
- **状态管理**：维护插件运行状态

#### 4. 资源访问
- **文件系统**：访问本地文件和目录
- **网络请求**：发起 HTTP 请求
- **系统调用**：执行系统命令
- **配置读取**：读取插件配置文件

## 插件开发流程

### 步骤 1：创建插件目录
```bash
mkdir -p plugins/my-plugin
cd plugins/my-plugin
```

### 步骤 2：创建配置文件
```bash
# 创建 plugin.json
cat > plugin.json << 'EOF'
{
  "id": "my-plugin",
  "name": "我的插件",
  "version": "1.0.0",
  "description": "插件功能描述",
  "author": "Your Name",
  "main": "main.js",
  "commands": [
    {
      "id": "my-command",
      "name": "我的命令",
      "description": "命令描述",
      "keywords": ["keyword1", "keyword2"]
    }
  ]
}
EOF
```

### 步骤 3：实现插件逻辑
```bash
# 创建 main.js
cat > main.js << 'EOF'
module.exports = {
  init() {
    console.log('Plugin initialized');
  },

  executeCommand(commandId, params) {
    console.log('Executing:', commandId, 'with params:', params);
    
    // 实现命令逻辑
    return {
      success: true,
      result: 'Command executed successfully'
    };
  },

  destroy() {
    console.log('Plugin destroyed');
  }
};
EOF
```

### 步骤 4：测试插件
```bash
# 重启应用以加载新插件
# 在搜索框中输入关键词测试插件命令
```

## 插件调试技巧

### 1. 日志输出
```javascript
module.exports = {
  executeCommand(commandId, params) {
    console.log('[PLUGIN DEBUG] Executing command:', commandId);
    console.log('[PLUGIN DEBUG] Parameters:', JSON.stringify(params));
    
    // 执行逻辑
    const result = performOperation(params);
    
    console.log('[PLUGIN DEBUG] Result:', JSON.stringify(result));
    return result;
  }
}
```

### 2. 错误追踪
```javascript
module.exports = {
  executeCommand(commandId, params) {
    try {
      return performOperation(params);
    } catch (error) {
      console.error('[PLUGIN ERROR]', error);
      return {
        success: false,
        error: error.message,
        code: error.code,
        stack: error.stack
      };
    }
  }
}
```

### 3. 性能监控
```javascript
module.exports = {
  executeCommand(commandId, params) {
    const startTime = Date.now();
    
    // 执行命令
    const result = performOperation(params);
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log(`[PLUGIN PERF] Command executed in ${duration}ms`);
    
    return {
      ...result,
      executionTime: duration
    };
  }
}
```

## 插件安全考虑

### 1. 输入验证
```javascript
module.exports = {
  executeCommand(commandId, params) {
    // 验证输入参数
    if (params && typeof params.filepath === 'string') {
      // 防止路径遍历攻击
      const normalizedPath = path.normalize(params.filepath);
      if (normalizedPath.includes('..')) {
        return {
          success: false,
          error: 'Invalid file path'
        };
      }
    }
    
    // 执行命令
    return executeSafely(params);
  }
}
```

### 2. 权限限制
```javascript
module.exports = {
  init() {
    // 检查插件权限
    this.checkPermissions();
  },

  checkPermissions() {
    // 插件只能访问特定目录
    const allowedPaths = [
      path.join(__dirname, 'data'),
      path.join(__dirname, 'temp')
    ];
    
    // 验证访问权限
    allowedPaths.forEach(allowedPath => {
      try {
        fs.accessSync(allowedPath, fs.constants.R_OK | fs.constants.W_OK);
      } catch (error) {
        console.error('Permission check failed:', error);
      }
    });
  }
}
```

### 3. 资源限制
```javascript
module.exports = {
  init() {
    // 限制资源使用
    this.maxMemoryUsage = 100 * 1024 * 1024; // 100MB
    this.maxCpuUsage = 50; // 50% CPU
  },

  executeCommand(commandId, params) {
    // 监控资源使用
    const startUsage = this.getCurrentUsage();
    const result = performOperation(params);
    const endUsage = this.getCurrentUsage();
    
    // 检查是否超过限制
    if (endUsage.memory > this.maxMemoryUsage) {
      console.warn('Memory usage exceeded');
    }
    
    return result;
  }
}
```

## 插件示例库

### 实用工具插件
- **文本处理**：文本格式化、编码转换
- **文件操作**：文件压缩、解压、转换
- **网络工具**：HTTP 请求、API 调用
- **系统工具**：系统信息查询、进程管理

### 开发工具插件
- **代码生成**：代码片段生成、模板创建
- **测试工具**：自动化测试、性能分析
- **文档工具**：API 文档生成、代码注释
- **调试工具**：日志分析、错误追踪

### 生活工具插件
- **计算器**：科学计算、单位转换
- **日历工具**：日期计算、时间管理
- **笔记工具**：快速笔记、待办事项
- **天气查询**：实时天气、天气预报

## 插件发布流程

### 1. 版本管理
- 遵循语义化版本号（如 1.0.0, 1.1.0）
- 在 plugin.json 中正确设置版本号
- 记录版本变更日志

### 2. 文档编写
- 编写详细的 README.md 文件
- 提供安装和使用说明
- 包含示例和最佳实践

### 3. 测试验证
- 在不同环境下测试插件
- 验证所有功能正常工作
- 测试边界情况和错误处理

### 4. 分发发布
- 打包插件文件
- 提供下载链接或安装说明
- 维护插件更新和问题反馈

## 常见问题

### Q: 插件不显示在搜索结果中？
A: 检查 plugin.json 中的 commands 配置是否正确，确保 keywords 字段包含搜索关键词。

### Q: 插件命令执行失败？
A: 检查 main.js 中的 executeCommand 函数是否正确返回结果对象，确保返回 { success: true/false, result/error, isList: true/false } 格式。

### Q: 如何调试插件？
A: 在 main.js 中添加 console.log 语句，查看控制台输出。也可以使用 Chrome DevTools 进行更详细的调试。

### Q: 插件可以访问系统文件吗？
A: 可以，但建议限制访问范围，只访问插件目录下的文件，避免安全风险。

### Q: 如何更新插件？
A: 修改 plugin.json 中的版本号，更新 main.js 中的功能，然后重启应用即可。

### Q: 如何实现列表选择功能？
A: 在 executeCommand 函数中直接返回一个数组即可。系统会自动检测数组类型并显示列表选择界面，支持方向键导航和二次选择。

### Q: 列表选择功能如何工作？
A: 当插件返回数组结果时，系统会显示一个专门的列表选择界面。用户可以使用方向键上下选择，按回车执行选中的项目。系统会自动处理列表的显示和隐藏。

### Q: 如何返回单个结果？
A: 直接返回一个对象或其他非数组类型的值即可。系统会自动检测并直接执行结果。

### Q: 插件执行结果的格式要求是什么？
A: 插件可以返回以下格式：
- **数组**：系统会显示列表选择界面
- **对象**：系统会直接执行结果
- **其他类型**：系统会直接执行结果

错误处理时应返回：
```javascript
{
  success: false,
  error: '错误信息'
}
```

## 插件开发资源

### 相关文档
- [Electron 官方文档](https://www.electronjs.org/docs/)
- [Node.js 模块系统](https://nodejs.org/api/modules.html)
- [JavaScript 最佳实践](https://github.com/ryanmcdermott/clean-code-javascript)

### 开发工具
- [VS Code](https://code.visualstudio.com/) - 推荐的代码编辑器
- [Node.js 调试工具](https://nodejs.org/en/docs/guides/debugging-getting-started)
- [Electron 调试工具](https://www.electronjs.org/docs/tutorial/debugging/)

### 社区资源
- [Electron 社区](https://www.electronjs.org/community)
- [GitHub Electron 项目](https://github.com/electron/electron)
- [Stack Overflow Electron 标签](https://stackoverflow.com/questions/tagged/electron)

## 总结

Speed Launcher 的插件系统提供了强大而灵活的扩展能力，开发者可以通过简单的 JavaScript 模块创建丰富的功能插件。

### 核心优势
- **简单直观**：直接返回数组即可实现列表选择，无需复杂配置
- **自动检测**：系统智能判断返回值类型，自动切换显示模式
- **高度集成**：插件命令无缝集成到主搜索界面
- **安全可靠**：插件在受控环境中运行，确保系统安全
- **热插拔支持**：动态加载和卸载插件，无需重启应用

### 开发建议
- **返回数组**：需要二级选择时直接返回数组
- **返回对象**：单个结果时直接返回对象
- **错误处理**：统一使用 `{ success: false, error: '错误信息' }` 格式
- **性能优化**：避免在插件中执行耗时操作，保持响应速度
- **安全性**：限制文件系统访问范围，验证用户输入

遵循本指南中的最佳实践，可以开发出高质量、安全、可靠的插件，为用户提供更好的使用体验。插件系统的灵活性使得开发者可以创建从简单工具到复杂应用的各种扩展功能，极大地丰富了 Speed Launcher 的能力。