// app.js - 应用初始化入口点
(function() {
    // 确保在 DOM 完全加载后初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initApplication);
    } else {
        initApplication();
    }
    
    function initApplication() {
        console.log('开始初始化应用...');
        
        // 检查必需的元素是否存在
        const requiredElements = [
            'backgroundCanvas', 'drawingCanvas', 'previewCanvas',
            'configSelector', 'currentConfigInfo'
        ];
        
        const missingElements = [];
        requiredElements.forEach(id => {
            if (!document.getElementById(id)) {
                missingElements.push(id);
            }
        });
        
        if (missingElements.length > 0) {
            console.error('缺少必需的元素:', missingElements.join(', '));
            alert('页面加载不完整，请刷新页面重试。');
            return;
        }
        
        try {
            // 初始化应用
            CoreFunctions.initApp();
            
            // 添加窗口大小变化监听
            window.addEventListener('resize', EventHandlers.handleResize);
            
            console.log('应用初始化完成');
        } catch (error) {
            console.error('初始化失败:', error);
            alert('初始化失败: ' + error.message);
        }
    }
})();