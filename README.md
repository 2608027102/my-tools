# Speed Launcher

一款类似 uTools 的快速启动工具，支持应用程序检索、快捷命令执行和插件扩展。

## 功能特性

### 核心功能
- **快速启动**：通过全局快捷键（默认 `Ctrl+Space`）快速唤起搜索框
- **应用程序检索**：自动扫描系统中的应用程序，支持快速搜索和启动
- **快捷命令**：自定义系统命令、脚本和URL快捷方式
- **插件系统**：高度可扩展的插件架构，支持第三方插件
- **主题切换**：支持深色和浅色主题，用户可自定义

### 技术特点
- **跨平台支持**：兼容 Windows、macOS 和 Linux 系统
- **安全可靠**：使用 Electron 的安全架构，保护用户数据
- **高性能**：毫秒级搜索响应，快速启动应用
- **易于扩展**：简洁的插件 API，方便开发者创建插件

## 安装方法

### 前置要求
- Node.js (建议 v14 或更高版本)
- npm 或 cnpm 包管理器

### 安装步骤
1. 克隆或下载项目到本地
2. 安装依赖：
   ```bash
   npm install
   # 或使用 cnpm
   cnpm install
   ```

3. 启动应用：
   ```bash
   npm start
   ```

### 构建安装包
```bash
npm run build
```

构建完成后，安装包将输出到 `dist` 目录，支持：
- Windows: `.exe` 安装程序和便携版
- macOS: `.dmg` 磁盘映像
- Linux: `.AppImage` 和 `.deb` 包

## 使用方法

### 基本操作
1. **唤起搜索框**：按下 `Ctrl+Space` 全局快捷键
2. **搜索应用**：输入应用程序名称、命令或插件关键词
3. **执行项目**：按回车键或点击搜索结果
4. **隐藏窗口**：再次按下 `Ctrl+Space` 或 `Escape` 键

### 搜索功能
- **模糊匹配**：支持部分匹配和拼音首字母搜索
- **多类型搜索**：同时搜索应用程序、命令和插件
- **实时过滤**：输入即时显示匹配结果
- **键盘导航**：使用方向键选择，回车执行

### 应用程序管理
- **自动扫描**：启动时自动扫描系统应用程序
- **智能检索**：支持按名称和路径搜索
- **快速启动**：直接启动系统中的任何应用程序

### 快捷命令
支持三种类型的快捷命令：

1. **系统命令**：
   ```json
   {
     "name": "打开记事本",
     "command": "notepad",
     "type": "system"
   }
   ```

2. **URL 打开**：
   ```json
   {
     "name": "打开 GitHub",
     "command": "https://github.com",
     "type": "url"
   }
   ```

3. **脚本执行**：
   ```json
   {
     "name": "运行脚本",
     "script": "console.log('Hello')",
     "interpreter": "node",
     "type": "script"
   }
   ```

## 插件开发

### 插件结构
插件目录位于 `plugins/` 文件夹，每个插件需要包含：

```
my-plugin/
├── plugin.json      # 插件配置文件
├── main.js         # 插件主文件
└── assets/         # 资源文件（可选）
```

### 插件配置 (plugin.json)
```json
{
  "id": "my-plugin",
  "name": "我的插件",
  "version": "1.0.0",
  "description": "插件描述",
  "author": "作者名称",
  "main": "main.js",
  "commands": [
    {
      "id": "hello",
      "name": "问候",
      "description": "输出问候信息",
      "keywords": ["hello", "hi"]
    }
  ]
}
```

### 插件主文件 (main.js)
```javascript
module.exports = {
  // 插件初始化
  init() {
    console.log('插件已加载');
  },

  // 执行命令
  executeCommand(commandId, params) {
    if (commandId === 'hello') {
      return {
        success: true,
        result: 'Hello from plugin!'
      };
    }
  },

  // 插件卸载
  destroy() {
    console.log('插件已卸载');
  }
};
```

### 插件 API
- `init()`：插件初始化时调用
- `executeCommand(commandId, params)`：执行插件命令
- `destroy()`：插件卸载时调用

## 配置文件

### 应用配置
配置文件位于 `config/` 目录：

- `config.json`：用户配置（主题、快捷键等）
- `commands.json`：自定义命令配置

### 主题配置
支持的主题：
- **dark**：深色主题（默认）
- **light**：浅色主题

主题配置存储在 `config.json` 中：
```json
{
  "theme": "dark"
}
```

## 项目结构

```
speed-launcher/
├── main.js              # 主进程入口
├── preload.js           # 预加载脚本
├── package.json         # 项目配置
├── renderer/            # 渲染进程
│   └── index.html       # 主界面
├── src/                 # 核心代码
│   ├── config/          # 配置管理
│   │   ├── ConfigManager.js
│   │   └── ThemeManager.js
│   ├── executor/        # 命令执行
│   │   ├── CommandExecutor.js
│   │   └── AppScanner.js
│   └── plugin/          # 插件系统
│       └── PluginManager.js
├── plugins/             # 插件目录
├── config/              # 配置文件目录
└── dist/               # 构建输出目录
```

## 技术栈

- **框架**：Electron
- **前端**：HTML5 + CSS3 + JavaScript
- **后端**：Node.js
- **构建工具**：Electron Builder

## 开发计划

### 已完成功能
- [x] 项目初始化和基础架构
- [x] 全局快捷键和窗口管理
- [x] 快速启动搜索界面
- [x] 插件系统 API 和加载机制
- [x] 快捷命令管理模块
- [x] 主题系统和用户配置
- [x] 应用程序扫描和检索

### 未来规划
- [ ] 插件市场和在线插件安装
- [ ] 命令历史记录和智能推荐
- [ ] 多语言支持
- [ ] 数据同步和云备份
- [ ] 更多主题和自定义样式
- [ ] 性能优化和内存管理

## 常见问题

### Q: 如何修改全局快捷键？
A: 目前快捷键为 `Ctrl+Space`，可以在 `main.js` 文件中修改快捷键注册代码。

### Q: 应用程序扫描速度慢怎么办？
A: 首次扫描可能需要几秒钟，后续启动会使用缓存。可以通过修改扫描深度来调整速度。

### Q: 如何添加自定义命令？
A: 编辑 `config/commands.json` 文件，添加新的命令配置，重启应用后生效。

### Q: 插件不工作怎么办？
A: 检查插件配置文件格式是否正确，确保 `main.js` 文件实现了必需的 API 方法。

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request！

## 联系方式

如有问题或建议，请通过 GitHub Issues 联系。