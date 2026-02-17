module.exports = {
  init() {
    console.log('HTML Demo plugin initialized');
  },

  executeCommand(commandId, params) {
    console.log('========== HTML Demo Plugin ==========');
    console.log('commandId:', commandId);
    console.log('params:', params);
    
    if (commandId === 'show-html-demo') {
      console.log('Executing show-html-demo command');
      
      // 返回HTML内容
      return {
        type: 'html',
        title: 'HTML演示',
        styles: `
          body {
            background-color: rgba(0, 0, 0, 0.95);
          }
        `,
        content: `
          <div style="padding: 10px;">
            <h2>HTML演示页面</h2>
            <p>这是一个完整的HTML页面，包含CSS和JavaScript。</p>
            
            <div style="background-color: rgba(255, 255, 255, 0.1); padding: 10px; border-radius: 4px; margin: 10px 0;">
              <h3>功能演示</h3>
              <button onclick="showMessage()" style="padding: 8px 16px; background-color: #2196F3; color: white; border: none; border-radius: 4px; cursor: pointer;">点击我</button>
              <p id="message" style="margin-top: 10px; color: #4CAF50;"></p>
            </div>
            
            <div style="background-color: rgba(255, 255, 255, 0.1); padding: 10px; border-radius: 4px; margin: 10px 0;">
              <h3>动态内容</h3>
              <p>当前时间: <span id="current-time"></span></p>
            </div>
            
            <div style="background-color: rgba(255, 255, 255, 0.1); padding: 10px; border-radius: 4px; margin: 10px 0;">
              <h3>样式演示</h3>
              <ul style="list-style-type: none; padding: 0;">
                <li style="padding: 5px 0; border-bottom: 1px solid rgba(255, 255, 255, 0.1);">项目1</li>
                <li style="padding: 5px 0; border-bottom: 1px solid rgba(255, 255, 255, 0.1);">项目2</li>
                <li style="padding: 5px 0; border-bottom: 1px solid rgba(255, 255, 255, 0.1);">项目3</li>
              </ul>
            </div>
          </div>
          
          <script>
            function showMessage() {
              document.getElementById('message').textContent = '你点击了按钮！';
              setTimeout(() => {
                document.getElementById('message').textContent = '';
              }, 2000);
            }
            
            function updateTime() {
              const now = new Date();
              document.getElementById('current-time').textContent = now.toLocaleString();
            }
            
            updateTime();
            setInterval(updateTime, 1000);
          </script>
        `
      };
    }
    
    console.log('Unknown command:', commandId);
    return {
      success: false,
      error: 'Unknown command'
    };
  },

  destroy() {
    console.log('HTML Demo plugin destroyed');
  }
};