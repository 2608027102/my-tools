module.exports = {
  init() {
    console.log('Random number generator plugin initialized');
  },

  executeCommand(commandId, params) {
    console.log('========== Random Number Generator Plugin ==========');
    console.log('commandId:', commandId);
    console.log('params:', params);
    
    if (commandId === 'generate-random') {
      console.log('Executing generate-random command');
      
      // 如果有选择的位数参数，生成对应位数的随机数
      if (params && params.digits) {
        console.log('Generating random number with digits:', params.digits);
        const randomNumber = this.generateRandomNumber(params.digits);
        console.log('Generated random number:', randomNumber);
        return {
          success: true,
          result: randomNumber
        };
      }
      
      // 否则返回位数选项列表
      console.log('Returning digits options list');
      const optionsList = [
        {
          name: '10',
          description: '10位随机数',
          digits: 10
        },
        {
          name: '12',
          description: '12位随机数',
          digits: 12
        },
        {
          name: '16',
          description: '16位随机数',
          digits: 16
        }
      ];
      console.log('Options list:', optionsList);
      return optionsList;
    }
    
    console.log('Unknown command:', commandId);
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