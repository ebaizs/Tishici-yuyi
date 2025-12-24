
// 在 color-palette.js 开头添加检查
if (typeof rgbToHex === 'undefined') {
    console.error('rgbToHex 未定义，请确保 utils.js 已正确加载');
    // 提供备用函数
    function rgbToHex(r, g, b) {
        return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    }
    window.rgbToHex = rgbToHex;
}

// 同样检查其他工具函数
if (typeof getCategoryClass === 'undefined') {
    console.error('getCategoryClass 未定义');
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
    window.getCategoryClass = getCategoryClass;
}

if (typeof generateRandomColor === 'undefined') {
    console.error('generateRandomColor 未定义');
    function generateRandomColor() {
        const r = Math.floor(Math.random() * 256);
        const g = Math.floor(Math.random() * 256);
        const b = Math.floor(Math.random() * 256);
        return [r, g, b];
    }
    window.generateRandomColor = generateRandomColor;
}

// color-palette.js - 语义调色板模块

const ColorPalette = {
    // 加载配置
    loadConfig(config) {
        AppState.currentConfig = config;
        
        // 获取当前配置键（从配置选择器或配置ID）
        const configKey = document.getElementById('configSelector')?.value || config.id || 'interior';
        
        // 从 furnitureData 加载设计风格、空间类型和照明风格
        if (furnitureData && furnitureData[configKey]) {
            const furnitureConfig = furnitureData[configKey];
            
            // 确保配置有必要的数组属性
            AppState.currentConfig.designStyles = furnitureConfig.designStyles || ["现代简约风格"];
            AppState.currentConfig.spaceTypes = furnitureConfig.spaceTypes || ["通用场景"];
            AppState.currentConfig.lightingStyles = furnitureConfig.lightingStyles || ["自然采光"];
            
            // 确保 furnitureData 存在
            if (!config.furnitureData) {
                config.furnitureData = furnitureConfig;
            }
        } else {
            // 如果 furnitureData 不存在，设置默认值
            console.warn(`未找到 ${configKey} 的家具数据，使用默认值`);
            AppState.currentConfig.designStyles = ["现代简约风格"];
            AppState.currentConfig.spaceTypes = ["通用场景"];
            AppState.currentConfig.lightingStyles = ["自然采光"];
        }
        
        // 使用配置特定的颜色分类
        const appState = StateManager.getState();
        appState.colorCategories = config.colorCategories || ["其它"];
        this.initColorCategories();
        
        // 更新颜色调色板
        this.initColorPalette();
        
        // 更新智能提示词生成器
        SmartPrompt.initPromptGenerator();
        
        // 更新UI显示
        document.getElementById('currentConfigInfo').textContent = `当前配置: ${config.name}`;
        
        // 重置当前颜色
        const firstColor = Object.keys(config.colorPalette)[0];
        if (firstColor) {
            appState.currentColor = firstColor;
            CanvasManager.updatePreview();
            CoreFunctions.updateUI();
        }
    },
    
 
    
    // 初始化颜色调色板
    initColorPalette() {
        const paletteContainer = document.getElementById('colorPalette');
        if (!paletteContainer || !AppState.currentConfig) {
            console.error("无法找到颜色调色板容器或配置未加载");
            
            if (paletteContainer) {
                paletteContainer.innerHTML = '<div class="hint-text">配置加载失败，请刷新页面</div>';
            }
            return;
        }
        
        paletteContainer.innerHTML = '';
        
        // 使用配置中的主分类结构
        if (AppState.currentConfig.mainCategories) {
            Object.keys(AppState.currentConfig.mainCategories).forEach(mainCategory => {
                const subCategories = AppState.currentConfig.mainCategories[mainCategory];
                
                const collapseCategory = document.createElement('div');
                collapseCategory.className = 'collapse-category';
                
                const collapseHeader = document.createElement('div');
                collapseHeader.className = 'collapse-header';
                collapseHeader.innerHTML = `
                    ${mainCategory}
                    <i class="fas fa-chevron-down"></i>
                `;
                
                const collapseContent = document.createElement('div');
                collapseContent.className = 'collapse-content';
                
                let hasColorsInCategory = false;
                
                subCategories.forEach(subCategory => {
                    const colorsInCategory = [];
                    
                    // 处理默认配置颜色
                    Object.keys(AppState.currentConfig.colorPalette).forEach(colorName => {
                        const colorInfo = AppState.currentConfig.colorPalette[colorName];
                        if (colorInfo.category === subCategory) {
                            colorsInCategory.push({
                                name: colorName,
                                info: colorInfo,
                                isCustom: false
                            });
                        }
                    });
                    
                    // 处理自定义颜色
                    Object.keys(AppState.customColors).forEach(colorName => {
                        const colorInfo = AppState.customColors[colorName];
                        if (colorInfo.category === subCategory) {
                            colorsInCategory.push({
                                name: colorName,
                                info: colorInfo,
                                isCustom: true
                            });
                        }
                    });
                    
                    if (colorsInCategory.length > 0) {
                        hasColorsInCategory = true;
                        
                        const subCategoryDiv = document.createElement('div');
                        subCategoryDiv.className = 'color-category';
                        
                        const subCategoryTitle = document.createElement('div');
                        subCategoryTitle.className = 'color-category-title';
                        
                        // 统计默认颜色和自定义颜色数量
                        const defaultCount = colorsInCategory.filter(c => !c.isCustom).length;
                        const customCount = colorsInCategory.filter(c => c.isCustom).length;
                        
                        let countText = '';
                        if (defaultCount > 0 && customCount > 0) {
                            countText = ` (默认:${defaultCount}, 自定义:${customCount})`;
                        } else if (customCount > 0) {
                            countText = ` (自定义:${customCount})`;
                        }
                        
                        subCategoryTitle.textContent = subCategory + countText;
                        subCategoryDiv.appendChild(subCategoryTitle);
                        
                        const colorGrid = document.createElement('div');
                        colorGrid.className = 'color-palette';
                        
                        colorsInCategory.forEach(item => {
                            const colorName = item.name;
                            const colorInfo = item.info;
                            const isCustom = item.isCustom;
                            const hexColor = rgbToHex(colorInfo.color[0], colorInfo.color[1], colorInfo.color[2]);
                            
                            const colorItem = document.createElement('div');
                            colorItem.className = 'color-item';
                            if (isCustom) {
                                colorItem.style.borderLeft = '3px solid #3498db';
                            }
                            
                            const appState = StateManager.getState();
                            if (colorName === appState.currentColor) {
                                colorItem.classList.add('active');
                            }
                            
                            const categoryClass = getCategoryClass(subCategory);
                            
                            colorItem.innerHTML = `
                                <div class="color-preview" style="background-color: ${hexColor};"></div>
                                <div class="color-info">
                                    <div class="color-name">
                                        ${colorName} 
                                        ${isCustom ? '<span style="color:#3498db; font-size:0.6em;">(自定义)</span>' : ''}
                                        <span class="category-tag ${categoryClass}">${subCategory}</span>
                                    </div>
                                    <div class="color-hex">${hexColor}</div>
                                </div>
                            `;
                            
                            colorItem.addEventListener('click', () => {
                                document.querySelectorAll('.color-item').forEach(item => {
                                    item.classList.remove('active');
                                });
                                colorItem.classList.add('active');
                                
                                const appState = StateManager.getState();
                                appState.currentColor = colorName;
                                CanvasManager.updatePreview();
                                CoreFunctions.updateUI();
                            });
                            
                            colorGrid.appendChild(colorItem);
                        });
                        
                        subCategoryDiv.appendChild(colorGrid);
                        collapseContent.appendChild(subCategoryDiv);
                    }
                });
                
                if (hasColorsInCategory) {
                    collapseCategory.appendChild(collapseHeader);
                    collapseCategory.appendChild(collapseContent);
                    paletteContainer.appendChild(collapseCategory);
                    
                    collapseHeader.addEventListener('click', function() {
                        this.classList.toggle('expanded');
                        collapseContent.classList.toggle('expanded');
                    });
                    
                    // 默认展开第一个大类
                    if (mainCategory === Object.keys(AppState.currentConfig.mainCategories)[0]) {
                        collapseHeader.classList.add('expanded');
                        collapseContent.classList.add('expanded');
                    }
                }
            });
        }
        
        // 如果有自定义颜色但不在任何分类中，显示自定义颜色分类
        const uncategorizedCustomColors = Object.keys(AppState.customColors).filter(colorName => {
            const colorInfo = AppState.customColors[colorName];
            return !AppState.currentConfig.mainCategories ||
                   !Object.values(AppState.currentConfig.mainCategories).flat().includes(colorInfo.category);
        });
        
        if (uncategorizedCustomColors.length > 0) {
            const customCategory = document.createElement('div');
            customCategory.className = 'collapse-category';
            
            const customHeader = document.createElement('div');
            customHeader.className = 'collapse-header';
            customHeader.innerHTML = `
                自定义颜色
                <i class="fas fa-chevron-down"></i>
            `;
            
            const customContent = document.createElement('div');
            customContent.className = 'collapse-content';
            
            const customGrid = document.createElement('div');
            customGrid.className = 'color-palette';
            
            uncategorizedCustomColors.forEach(colorName => {
                const colorInfo = AppState.customColors[colorName];
                const hexColor = rgbToHex(colorInfo.color[0], colorInfo.color[1], colorInfo.color[2]);
                
                const colorItem = document.createElement('div');
                colorItem.className = 'color-item';
                colorItem.style.borderLeft = '3px solid #3498db';
                
                const appState = StateManager.getState();
                if (colorName === appState.currentColor) {
                    colorItem.classList.add('active');
                }
                
                colorItem.innerHTML = `
                    <div class="color-preview" style="background-color: ${hexColor};"></div>
                    <div class="color-info">
                        <div class="color-name">
                            ${colorName} 
                            <span style="color:#3498db; font-size:0.6em;">(自定义)</span>
                        </div>
                        <div class="color-hex">${hexColor}</div>
                    </div>
                `;
                
                colorItem.addEventListener('click', () => {
                    document.querySelectorAll('.color-item').forEach(item => {
                        item.classList.remove('active');
                    });
                    colorItem.classList.add('active');
                    
                    const appState = StateManager.getState();
                    appState.currentColor = colorName;
                    CanvasManager.updatePreview();
                    CoreFunctions.updateUI();
                });
                
                customGrid.appendChild(colorItem);
            });
            
            customContent.appendChild(customGrid);
            customCategory.appendChild(customHeader);
            customCategory.appendChild(customContent);
            paletteContainer.appendChild(customCategory);
            
            customHeader.addEventListener('click', function() {
                this.classList.toggle('expanded');
                customContent.classList.toggle('expanded');
            });
        }
    },
    
    // 添加自定义颜色
    addCustomColor() {
        const namesInput = document.getElementById('customColorNames');
        const colorNames = namesInput.value.trim();
        const colorCategory = document.getElementById('colorCategory').value;
        
        if (!colorNames) {
            alert('请输入颜色名称');
            return;
        }
        
        if (AppState.currentConfig.colorPalette[colorNames] || AppState.customColors[colorNames]) {
            alert(`颜色名称 "${colorNames}" 已存在`);
            return;
        }
        
        // 如果用户选择了"添加新分类"，提示输入新分类名称
        let finalCategory = colorCategory;
        const appState = StateManager.getState();
        
        if (colorCategory === "add-new-category") {
            finalCategory = prompt('请输入新分类名称:');
            if (!finalCategory) return;
            
            // 将新分类添加到当前配置的分类中，并标记为自定义
            if (!appState.colorCategories.includes(finalCategory)) {
                appState.colorCategories.push(finalCategory);
                // 记录自定义分类
                if (!appState.customColorCategories) {
                    appState.customColorCategories = [];
                }
                if (!appState.customColorCategories.includes(finalCategory)) {
                    appState.customColorCategories.push(finalCategory);
                }
                this.initColorCategories();
            }
        }
        
        const randomColor = generateRandomColor();
        
        const maxId = Math.max(
            ...Object.values(AppState.currentConfig.colorPalette).map(c => c.id),
            ...Object.values(AppState.customColors).map(c => c.id)
        );
        const newId = maxId + 1;
        
        AppState.customColors[colorNames] = {
            color: randomColor,
            id: newId,
            category: finalCategory
        };
        
        // 更新全局颜色映射
        AppState.globalColorMap[colorNames] = AppState.customColors[colorNames];
        
        namesInput.value = '';
        
        this.initColorPalette();
        
        appState.currentColor = colorNames;
        CanvasManager.updatePreview();
        CoreFunctions.updateUI();
        
        alert('颜色已添加');
    },
    
    
};