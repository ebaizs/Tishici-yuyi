// 工具函数

// RGB转十六进制
function rgbToHex(r, g, b) {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

// 获取分类CSS类名
function getCategoryClass(category) {
    if (category.includes("建筑")) return 'category-architecture';
    if (category.includes("景观")) return 'category-landscape';
    if (category.includes("结构")) return 'category-structure';
    if (category.includes("照明") || category.includes("灯具")) return 'category-lighting';
    if (category.includes("家具")) return 'category-furniture';
    if (category.includes("材料")) return 'category-material';
    if (category.includes("环境")) return 'category-environment';
    if (category.includes("细部") || category.includes("装饰")) return 'category-detail';
    if (category.includes("自然")) return 'category-nature';
    if (category.includes("人物")) return 'category-character';
    if (category.includes("艺术") || category.includes("绘画")) return 'category-art';
    return 'category-other';
}

// 生成随机颜色
function generateRandomColor() {
    const r = Math.floor(Math.random() * 256);
    const g = Math.floor(Math.random() * 256);
    const b = Math.floor(Math.random() * 256);
    return [r, g, b];
}

// 从智能提示词中提取元素名称
function extractElementsFromSmartPrompt(smartPrompt) {
    const elements = [];
    
    // 匹配中文元素名称（排除风格描述等）
    const elementRegex = /[，,]\s*([\u4e00-\u9fa5]{2,10})(?=[，,])/g;
    let match;
    
    // 第一遍：提取明显的元素名称
    while ((match = elementRegex.exec(smartPrompt)) !== null) {
        const element = match[1].trim();
        // 排除常见的风格词和描述词
        if (!isStyleWord(element) && element.length >= 2) {
            elements.push(element);
        }
    }
    
    // 第二遍：处理以元素列表开头的智能提示词
    const startElementsMatch = smartPrompt.match(/^构图协调[，,]\s*([^，,]+(?:[，,][^，,]+)*)(?=，)/);
    if (startElementsMatch) {
        const elementList = startElementsMatch[1];
        const elementArray = elementList.split(/[，,]/).map(el => el.trim());
        elementArray.forEach(element => {
            if (!isStyleWord(element) && element.length >= 2 && !elements.includes(element)) {
                elements.push(element);
            }
        });
    }
    
    return elements;
}




// 显示临时消息
function showTemporaryMessage(message) {
    // 创建临时消息元素
    const messageEl = document.createElement('div');
    messageEl.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0,0,0,0.8);
        color: white;
        padding: 10px 20px;
        border-radius: 5px;
        z-index: 10000;
        font-size: 14px;
        pointer-events: none;
    `;
    messageEl.textContent = message;
    
    document.body.appendChild(messageEl);
    
    // 2秒后移除消息
    setTimeout(() => {
        document.body.removeChild(messageEl);
    }, 2000);
}


// 使用localStorage存储次数
function checkUsageLimit() {
  const count = localStorage.getItem('launchCount') || 0;
  if (parseInt(count) >= 1000) {
    alert('使用次数已达上限');
    window.close();
    return false;
  }
  localStorage.setItem('launchCount', parseInt(count) + 1);
  return true;
}

// 在页面加载时调用
if (!checkUsageLimit()) {
  window.close();
}
