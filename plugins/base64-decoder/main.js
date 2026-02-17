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
      
      // 如果有选择的文本参数，解码Base64
      if (params && params.text) {
        console.trace('Decoding Base64 text:', params.text);
        try {
          const decodedText = Buffer.from(params.text, 'base64').toString('utf8');
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