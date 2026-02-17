module.exports = {
  init() {
    console.log('Base64 Decoder plugin initialized');
  },

  executeCommand(commandId, params) {
    console.trace('========== Base64 Decoder Plugin ==========');
    console.trace('commandId:', commandId);
    console.trace('params:', params);
    
    if (commandId === 'decode-base64') {
      console.trace('Executing decode-base64 command');
      
      // 检查是否有输入参数（text或prompt）
      let inputText = null;
      if (params && params.text) {
        inputText = params.text;
      } else if (params && params.prompt) {
        inputText = params.prompt;
      }
      
      // 如果有输入参数，解码Base64
      if (inputText) {
        console.trace('Decoding Base64 text:', inputText);
        try {
          const decodedText = Buffer.from(inputText, 'base64').toString('utf8');
          console.log(decodedText);
          return {
            success: true,
            result: decodedText
          };
        } catch (error) {
          console.error('Error decoding Base64:', error);
          return {
            success: false,
            error: 'Invalid Base64 input'
          };
        }
      }
      
      // 如果没有输入参数，返回prompt请求
      console.trace('Returning prompt request');
      return {
        type: 'prompt',
        title: '解码Base64',
        placeholder: '请输入Base64编码的文本',
        defaultValue: '',
        params: {}
      };
    }
    
    console.error('Unknown command:', commandId);
    return {
      success: false,
      error: 'Unknown command'
    };
  },

  destroy() {
    console.log('Base64 Decoder plugin destroyed');
  }
};