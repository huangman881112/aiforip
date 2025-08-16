// 重定向控制台输出到文件
(function() {
    const originalConsoleLog = console.log;
    const originalConsoleError = console.error;

    console.log = function(message) {
        originalConsoleLog.apply(console, arguments);
        
        // 将日志发送到服务器或保存到本地存储
        try {
            // 简单地将日志存储在localStorage中
            const logs = JSON.parse(localStorage.getItem('consoleLogs') || '[]');
            logs.push({
                type: 'log',
                message: message,
                timestamp: new Date().toISOString()
            });
            localStorage.setItem('consoleLogs', JSON.stringify(logs));
        } catch (e) {
            originalConsoleError('无法保存日志:', e);
        }
    };

    console.error = function(message) {
        originalConsoleError.apply(console, arguments);
        
        try {
            const logs = JSON.parse(localStorage.getItem('consoleLogs') || '[]');
            logs.push({
                type: 'error',
                message: message,
                timestamp: new Date().toISOString()
            });
            localStorage.setItem('consoleLogs', JSON.stringify(logs));
        } catch (e) {
            originalConsoleError('无法保存错误日志:', e);
        }
    };
})();