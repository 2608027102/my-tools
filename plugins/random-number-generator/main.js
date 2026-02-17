module.exports = {
  init() {
    console.log('Random number generator plugin initialized');
  },

  executeCommand(commandId, params) {
    console.trace('========== Random Number Generator Plugin ==========');
    console.trace('commandId:', commandId);
    console.trace('params:', params);
    
    if (commandId === 'generate-random') {
      console.trace('Executing generate-random command');
      
      // 如果有prompt参数，使用用户输入的位数
      if (params && params.prompt) {
        const digits = parseInt(params.prompt);
        if (!isNaN(digits) && digits > 0 && digits <= 100) {
          console.trace('Generating random number with digits:', digits);
          const randomNumber = this.generateRandomNumber(digits);
          console.log(randomNumber);
          return {
            success: true,
            result: randomNumber
          };
        } else {
          return {
            success: false,
            error: '请输入1-100之间的有效数字'
          };
        }
      }
      
      // 如果有digits参数，生成对应位数的随机数
      if (params && params.digits) {
        console.trace('Generating random number with digits:', params.digits);
        const randomNumber = this.generateRandomNumber(params.digits);
        console.log(randomNumber);
        return {
          success: true,
          result: randomNumber
        };
      }
      
      // 如果有action参数，根据action执行不同的操作
      if (params && params.action) {
        if (params.action === 'custom') {
          // 返回prompt请求
          console.trace('Returning prompt request');
          return {
            type: 'prompt',
            title: '生成随机数',
            placeholder: '请输入随机数的位数 (1-100)',
            defaultValue: '10',
            params: {}
          };
        }
      }
      
      // 否则返回选项列表
      console.trace('Returning options list');
      const optionsList = [
        {
          name: '10位',
          description: '生成10位随机数',
          digits: 10
        },
        {
          name: '12位',
          description: '生成12位随机数',
          digits: 12
        },
        {
          name: '16位',
          description: '生成16位随机数',
          digits: 16
        },
        {
          name: '自定义',
          description: '输入自定义位数',
          action: 'custom'
        }
      ];
      console.trace('Options list:', optionsList);
      return optionsList;
    }
    
    console.trace('Unknown command:', commandId);
    return {
      success: false,
      error: 'Unknown command'
    };
  },

  generateRandomNumber(digits) {
    let result = '';
    const characters = '0123456789';
    const charactersLength = characters.length;
    
    for (let i = 0; i < digits; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    
    return result;
  },

  destroy() {
    console.log('Random number generator plugin destroyed');
  }
};