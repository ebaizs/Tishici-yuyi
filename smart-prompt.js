// smart-prompt.js - 智能提示词模块
const SmartPrompt = {
    // 为所有复选框添加事件监听
    initFurnitureOptions() {
        const furnitureOptions = document.getElementById('furnitureOptions');
        if (!furnitureOptions || !furnitureOptionsData) return;

        furnitureOptions.innerHTML = '';

        // 按分类显示
        furnitureOptionsData.forEach(category => {
            const categoryDiv = document.createElement('div');
            categoryDiv.className = 'category-section';

            const categoryTitle = document.createElement('div');
            categoryTitle.className = 'category-section-title';
            categoryTitle.textContent = category.name;
            categoryTitle.style.color = category.color;
            categoryDiv.appendChild(categoryTitle);

            const checkboxGroup = document.createElement('div');
            checkboxGroup.className = 'checkbox-group';

            category.items.forEach(item => {
                const label = document.createElement('label');
                label.innerHTML = `<input type="checkbox" value="${item}">${item}`;
                checkboxGroup.appendChild(label);
            });

            categoryDiv.appendChild(checkboxGroup);
            furnitureOptions.appendChild(categoryDiv);
        });

        // 为所有复选框添加事件监听
        const allCheckboxes = furnitureOptions.querySelectorAll('input[type="checkbox"]');
        allCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => this.generateSmartPrompt());
        });
    },

    // 初始化其他要求选项
    initOtherRequirements() {
        const otherRequirements = document.getElementById('otherRequirements');
        if (!otherRequirements || !otherRequirementsData) return;

        otherRequirements.innerHTML = '';

        // 必选选项
        const requiredSection = document.createElement('div');
        requiredSection.className = 'category-section';

        const requiredTitle = document.createElement('div');
        requiredTitle.className = 'category-section-title';
        requiredTitle.textContent = '必选选项';
        requiredTitle.style.color = '#e74c3c';
        requiredSection.appendChild(requiredTitle);

        const requiredDiv = document.createElement('div');
        requiredDiv.className = 'checkbox-group';

        otherRequirementsData.required.forEach(item => {
            const label = document.createElement('label');
            label.innerHTML = `<input type="checkbox" name="otherRequired" value="${item}" checked>${item}`;
            requiredDiv.appendChild(label);
        });

        requiredSection.appendChild(requiredDiv);
        otherRequirements.appendChild(requiredSection);

        // 可选选项
        const optionalSection = document.createElement('div');
        optionalSection.className = 'category-section';

        const optionalTitle = document.createElement('div');
        optionalTitle.className = 'category-section-title';
        optionalTitle.textContent = '可选选项';
        optionalTitle.style.color = '#e74c3c';
        optionalSection.appendChild(optionalTitle);

        const optionalDiv = document.createElement('div');
        optionalDiv.className = 'checkbox-group';

        otherRequirementsData.optional.forEach(item => {
            const label = document.createElement('label');
            label.innerHTML = `<input type="checkbox" name="otherOptional" value="${item}">${item}`;
            optionalDiv.appendChild(label);
        });

        optionalSection.appendChild(optionalDiv);
        otherRequirements.appendChild(optionalSection);

        // 为所有复选框添加事件监听
        const allCheckboxes = otherRequirements.querySelectorAll('input[type="checkbox"]');
        allCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => this.generateSmartPrompt());
        });
    },

    // 生成智能提示词
    generateSmartPrompt() {
        const spaceType = document.getElementById('spaceType').value;
        const designStyle = document.getElementById('designStyle').value;
        const lightingStyle = document.getElementById('lightingStyle').value;
        const additionalPrompt = document.getElementById('additionalPrompt').value.trim();

        const useSpaceType = document.getElementById('spaceTypeCheckbox').checked;
        const useDesignStyle = document.getElementById('designStyleCheckbox').checked;
        const useLightingStyle = document.getElementById('lightingStyleCheckbox').checked;

        // 按顺序收集各部分的元素

        // 1. 空间元素（必要元素）
        const requiredItems = Array.from(
            document.querySelectorAll('#furnitureOptions .category-section:first-child input:checked')
        ).map(i => i.value);

        // 2. 空间元素（可选元素）
        const optionalItems = Array.from(
            document.querySelectorAll('#furnitureOptions .category-section:last-child input:checked')
        ).map(i => i.value);

        // 3. 附加说明
        const additionalItems = additionalPrompt ? [additionalPrompt] : [];

        // 4. 可选选项
        const otherOptionalItems = Array.from(
            document.querySelectorAll('input[name="otherOptional"]:checked')
        ).map(i => i.value);

        // 5. 必选选项
        const otherRequiredItems = Array.from(
            document.querySelectorAll('input[name="otherRequired"]:checked')
        ).map(i => i.value);

        let prompt = "构图协调，"; // 修复：在"构图协调"后面直接加上逗号

        // 收集所有项目的数组
        const allItems = [];

        // 添加空间类型（如果选中）
        if (useSpaceType && spaceType) {
            allItems.push(spaceType);
        }

        // 添加设计风格（如果选中）
        if (useDesignStyle && designStyle) {
            allItems.push(designStyle);
        }

        // 添加照明风格（如果选中）
        if (useLightingStyle && lightingStyle) {
            allItems.push(lightingStyle);
        }

        // 按顺序添加各部分
        allItems.push(...requiredItems);
        allItems.push(...optionalItems);
        allItems.push(...additionalItems);
        allItems.push(...otherOptionalItems);
        allItems.push(...otherRequiredItems);

        // 过滤掉空值并去重
        const filteredItems = [...new Set(allItems.filter(item => item && item.trim()))];

        // 构建最终的提示词
        if (filteredItems.length > 0) {
            prompt += filteredItems.join('，');
        }

        // 确保末尾添加基础质量描述
        if (prompt.length > 0 && !prompt.endsWith('，')) {
            prompt += '，';
        }
        prompt += "真实的照片，摄影作品，高画质，专业摄影风格，质感真实，细节丰富";

        // 清理多余的逗号
        prompt = prompt.replace(/，，/g, '，').replace(/^，/, '').replace(/，$/, '');

        document.getElementById('smartPromptOutput').value = prompt;

        // 保存配置状态
        const appState = StateManager.getState();
        appState.promptConfig = {
            spaceType: spaceType,
            designStyle: designStyle,
            lightingStyle: lightingStyle,
            requiredItems: requiredItems,
            optionalItems: optionalItems,
            otherRequired: otherRequiredItems,
            otherOptional: otherOptionalItems,
            additionalPrompt: additionalPrompt,
            useSpaceType: useSpaceType,
            useDesignStyle: useDesignStyle,
            useLightingStyle: useLightingStyle
        };
    },

    // 应用智能提示词
    applySmartPrompt() {
        const appState = StateManager.getState();

        // 保存当前状态到历史
        CanvasManager.saveDrawingState();

        // 保存原始提示词和智能提示词状态
        if (!appState.appliedSmartPrompt) {
            appState.originalPrompt = document.getElementById('promptOutput').value;
            appState.originalSmartPrompt = document.getElementById('smartPromptOutput').value;
            appState.originalPromptConfig = JSON.parse(JSON.stringify(appState.promptConfig));
            appState.appliedSmartPrompt = true;
        }

        const smartPrompt = document.getElementById('smartPromptOutput').value;
        if (!smartPrompt) {
            alert('请先生成提示词');
            return;
        }

        const currentPrompt = document.getElementById('promptOutput').value;

        // 提取颜色部分
        let colorPart = "";
        const lines = currentPrompt.split('\n');
        if (lines.length > 0 && (lines[0].includes("#") || lines[0].includes("通用设计"))) {
            colorPart = lines[0];
        }

        // 合并提示词
        let newPrompt = colorPart;
        if (smartPrompt) {
            newPrompt += "\n" + smartPrompt;
        }

        document.getElementById('promptOutput').value = newPrompt;

        // 更新操作状态
        StateManager.updateOperationState('applySmartPrompt');

        alert('提示词已应用到标注系统');
    },

    // 撤回智能提示词
    revertSmartPrompt() {
        const appState = StateManager.getState();

        // 检查是否可以撤回
        if (!StateManager.canRevert()) {
            alert('当前状态不能撤回');
            return;
        }

        // 保存当前状态到历史
        CanvasManager.saveDrawingState();

        // 恢复左侧提示词
        document.getElementById('promptOutput').value = appState.originalPrompt;

        // 恢复右侧智能提示词
        if (appState.originalSmartPrompt) {
            document.getElementById('smartPromptOutput').value = appState.originalSmartPrompt;
        }

        // 恢复配置状态
        if (appState.originalPromptConfig) {
            appState.promptConfig = appState.originalPromptConfig;

            // 恢复下拉菜单选择
            document.getElementById('spaceType').value = appState.originalPromptConfig.spaceType;
            document.getElementById('designStyle').value = appState.originalPromptConfig.designStyle;
            document.getElementById('lightingStyle').value = appState.originalPromptConfig.lightingStyle;
            document.getElementById('additionalPrompt').value = appState.originalPromptConfig.additionalPrompt;

            // 恢复复选框状态
            document.getElementById('spaceTypeCheckbox').checked = appState.originalPromptConfig.useSpaceType;
            document.getElementById('designStyleCheckbox').checked = appState.originalPromptConfig.useDesignStyle;
            document.getElementById('lightingStyleCheckbox').checked = appState.originalPromptConfig.useLightingStyle;

            // 恢复其它要求选项
            const requiredCheckboxes = document.querySelectorAll('input[name="otherRequired"]');
            const optionalCheckboxes = document.querySelectorAll('input[name="otherOptional"]');

            requiredCheckboxes.forEach(checkbox => {
                checkbox.checked = appState.originalPromptConfig.otherRequired.includes(checkbox.value);
            });

            optionalCheckboxes.forEach(checkbox => {
                checkbox.checked = appState.originalPromptConfig.otherOptional.includes(checkbox.value);
            });

            // 恢复家具选项
            this.updateFurnitureOptions();
            const checkboxes = document.querySelectorAll('#furnitureOptions input[type="checkbox"]');
            checkboxes.forEach(checkbox => {
                checkbox.checked = appState.originalPromptConfig.furniture.includes(checkbox.value);
            });
        }

        // 重置应用状态
        appState.appliedSmartPrompt = false;

        // 更新操作状态
        StateManager.updateOperationState('revertSmartPrompt');

        alert('已撤回智能提示词，所有设置已恢复');
    },

    // 复制智能提示词
    copySmartPrompt() {
        const smartPromptText = document.getElementById('smartPromptOutput');
        smartPromptText.select();
        try {
            document.execCommand('copy');
            alert('智能提示词已复制到剪贴板');
        } catch (err) {
            console.error('复制失败:', err);
            alert('复制失败，请手动选择并复制文本');
        }
    },

    // 更新家具选项（用于恢复状态）
    updateFurnitureOptions() {
        // 这里需要根据实际情况实现更新家具选项的逻辑
        // 由于原始代码中没有这个方法，我添加了一个占位实现
        console.log('更新家具选项');
    },

    // 清除提示词中的颜色语义名和颜色位置信息
    clearPromptColors() {
        const promptTextarea = document.getElementById('promptOutput');
        if (!promptTextarea) return;

        let currentPrompt = promptTextarea.value;

        // 清除颜色位置信息
        currentPrompt = currentPrompt.replace(/#[a-fA-F0-9]{6}颜色为[^，,]+的位置/g, '');

        // 清除颜色语义名
        currentPrompt = currentPrompt.replace(/，\s*([^#，,\n]+)(?=，#[a-fA-F0-9]{6}颜色为)/g, '');

        // 清理多余的逗号
        currentPrompt = currentPrompt.replace(/，，/g, '，').replace(/，\s*，/g, '，');
        currentPrompt = currentPrompt.replace(/^，/, '').replace(/，$/, '');

        // 如果只剩下基础提示词，保留它
        const basePrompts = ["空置空间", "真实的照片", "摄影作品", "高画质", "专业摄影风格", "质感真实", "细节丰富"];
        let hasBaseContent = false;

        basePrompts.forEach(prompt => {
            if (currentPrompt.includes(prompt)) {
                hasBaseContent = true;
            }
        });

        if (!hasBaseContent && currentPrompt.trim()) {
            currentPrompt = "真实的照片，摄影作品，高画质，专业摄影风格，质感真实，细节丰富";
        } else if (currentPrompt.trim() === "" || currentPrompt.trim() === "，") {
            currentPrompt = "空置空间";
        }

        promptTextarea.value = currentPrompt;

        // 重置相关状态
        const appState = StateManager.getState();
        appState.usedColors.clear();
        appState.labels = [];
        if (appState.drawingCtx) {
            appState.drawingCtx.clearRect(0, 0, appState.drawingCanvas.width, appState.drawingCanvas.height);
        }
        CoreFunctions.updateUI();
    },

    // 上传图片后清理提示词
    clearPromptAfterUpload() {
        const promptTextarea = document.getElementById('promptOutput');
        const smartPromptTextarea = document.getElementById('smartPromptOutput');

        if (promptTextarea) {
            // 重置为默认提示词
            promptTextarea.value = "空置空间";
        }

        if (smartPromptTextarea) {
            // 清空智能提示词
            smartPromptTextarea.value = "";
        }

        // 重置相关状态
        const appState = StateManager.getState();
        appState.usedColors.clear();
        appState.appliedSmartPrompt = false;
        appState.originalPrompt = "";
        appState.originalSmartPrompt = "";
        appState.originalPromptConfig = null;

        // 重置操作状态
        StateManager.resetOperationState();

        // 如果当前配置有默认提示词，可以使用它
        if (AppState.currentConfig && AppState.currentConfig.defaultPrompt) {
            promptTextarea.value = AppState.currentConfig.defaultPrompt;
        }

        console.log("上传图片后提示词已重置");
    },

    // 更新动作后的提示词
    updatePromptAfterAction() {
        const appState = StateManager.getState();
        const smartPrompt = document.getElementById('smartPromptOutput').value;

        if (appState.appliedSmartPrompt && smartPrompt) {
            const currentPrompt = document.getElementById('promptOutput').value;
            const lines = currentPrompt.split('\n');

            if (lines.length > 0 && lines[0].trim() !== "空置空间") {
                document.getElementById('promptOutput').value = lines[0] + "\n" + smartPrompt;
            } else {
                document.getElementById('promptOutput').value = smartPrompt;
            }
        }
    },

    // 重置智能提示词状态
    resetSmartPromptState() {
        const appState = StateManager.getState();

        appState.appliedSmartPrompt = false;
        appState.originalPrompt = "";
        appState.originalSmartPrompt = "";
        appState.originalPromptConfig = null;

        // 清空智能提示词输出
        const smartPromptTextarea = document.getElementById('smartPromptOutput');
        if (smartPromptTextarea) {
            smartPromptTextarea.value = "";
        }
    },

    // 生成从画布分析的提示词
    generatePromptFromCanvasAnalysis() {
        const appState = StateManager.getState();

        if (appState.labels.length === 0) {
            alert('画布上没有标注，请先进行标注');
            return;
        }

        // 分析画布内容
        const analysis = this.analyzeCanvasComposition();

        // 生成提示词
        const prompt = this.generateCompositionPrompt(analysis);

        // 更新智能提示词输出框
        document.getElementById('smartPromptOutput').value = prompt;

        alert('已根据画布标注生成构图描述');
    },

    // 分析画布构图
    analyzeCanvasComposition() {
        const appState = StateManager.getState();
        const analysis = {
            primaryElements: [],
            secondaryElements: [],
            backgroundElements: [],
            spatialRelations: [],
            overallComposition: ''
        };

        // 按面积和位置分析元素
        const elements = this.analyzeElementsByArea();

        // 分类元素
        elements.forEach((element) => {
            const elementInfo = {
                name: element.name,
                area: element.area,
                position: element.position,
                dominance: element.dominance
            };

            if (element.dominance === 'primary') {
                analysis.primaryElements.push(elementInfo);
            } else if (element.dominance === 'secondary') {
                analysis.secondaryElements.push(elementInfo);
            } else {
                analysis.backgroundElements.push(elementInfo);
            }
        });

        // 分析空间关系
        analysis.spatialRelations = this.analyzeSpatialRelations(elements);

        // 生成整体构图描述
        analysis.overallComposition = this.generateOverallComposition(analysis);

        return analysis;
    },

    // 按面积分析元素
    analyzeElementsByArea() {
        const appState = StateManager.getState();
        const elements = [];
        const elementAreas = {};
        const elementPositions = {};

        // 统计每个元素的面积（标签数量）
        appState.labels.forEach(label => {
            const elementName = label.category;

            if (!elementAreas[elementName]) {
                elementAreas[elementName] = 0;
                elementPositions[elementName] = {
                    x: 0,
                    y: 0,
                    count: 0
                };
            }

            elementAreas[elementName]++;
            elementPositions[elementName].x += label.coordinates.x;
            elementPositions[elementName].y += label.coordinates.y;
            elementPositions[elementName].count++;
        });

        // 计算平均位置和面积占比
        const totalArea = appState.labels.length;
        Object.keys(elementAreas).forEach(elementName => {
            const area = elementAreas[elementName];
            const areaRatio = area / totalArea;
            const avgX = elementPositions[elementName].x / elementPositions[elementName].count;
            const avgY = elementPositions[elementName].y / elementPositions[elementName].count;

            // 确定位置描述
            const position = this.describePosition(avgX, avgY);

            // 确定主导程度
            let dominance = 'background';
            if (areaRatio > 0.3) {
                dominance = 'primary';
            } else if (areaRatio > 0.1) {
                dominance = 'secondary';
            }

            elements.push({
                name: elementName,
                area: area,
                areaRatio: areaRatio,
                position: position,
                dominance: dominance,
                center: { x: avgX, y: avgY }
            });
        });

        // 按面积排序
        return elements.sort((a, b) => b.area - a.area);
    },

    // 描述元素位置
    describePosition(x, y) {
        const appState = StateManager.getState();
        const canvasWidth = appState.canvasWidth;
        const canvasHeight = appState.canvasHeight;

        const horizontal = x < canvasWidth * 0.33 ? '左侧' :
            x < canvasWidth * 0.66 ? '中间' : '右侧';

        const vertical = y < canvasHeight * 0.33 ? '上部' :
            y < canvasHeight * 0.66 ? '中部' : '下部';

        // 特殊位置描述
        if (x < canvasWidth * 0.1) return '最左侧';
        if (x > canvasWidth * 0.9) return '最右侧';
        if (y < canvasHeight * 0.1) return '顶部';
        if (y > canvasHeight * 0.9) return '底部';
        if (Math.abs(x - canvasWidth / 2) < canvasWidth * 0.1 &&
            Math.abs(y - canvasHeight / 2) < canvasHeight * 0.1) {
            return '中心位置';
        }

        return `${vertical}${horizontal}`;
    },

    // 分析空间关系
    analyzeSpatialRelations(elements) {
        const relations = [];

        if (elements.length < 2) return relations;

        // 分析主要元素之间的关系
        const primaryElements = elements.filter(el => el.dominance === 'primary');

        primaryElements.forEach((el1, i) => {
            primaryElements.forEach((el2, j) => {
                if (i < j) {
                    const relation = this.describeRelation(el1, el2);
                    if (relation) relations.push(relation);
                }
            });
        });

        return relations;
    },

    // 描述两个元素之间的关系
    describeRelation(el1, el2) {
        const appState = StateManager.getState();
        const dx = el2.center.x - el1.center.x;
        const dy = el2.center.y - el1.center.y;

        // 水平关系
        let horizontalRelation = '';
        if (Math.abs(dx) > appState.canvasWidth * 0.3) {
            if (dx > 0) {
                horizontalRelation = `${el1.name}在${el2.name}左侧`;
            } else {
                horizontalRelation = `${el1.name}在${el2.name}右侧`;
            }
        }

        // 垂直关系
        let verticalRelation = '';
        if (Math.abs(dy) > appState.canvasHeight * 0.3) {
            if (dy > 0) {
                verticalRelation = `${el1.name}在${el2.name}上方`;
            } else {
                verticalRelation = `${el1.name}在${el2.name}下方`;
            }
        }

        if (horizontalRelation && verticalRelation) {
            return `${horizontalRelation}，${verticalRelation}`;
        } else if (horizontalRelation) {
            return horizontalRelation;
        } else if (verticalRelation) {
            return verticalRelation;
        }

        return null;
    },

    // 生成整体构图描述
    generateOverallComposition(analysis) {
        const primaries = analysis.primaryElements;
        const secondaries = analysis.secondaryElements;

        if (primaries.length === 0) return '构图较为分散，无明显主体';

        let composition = '';

        // 主要元素描述
        if (primaries.length === 1) {
            composition = `${primaries[0].name}为主体，位于${primaries[0].position}`;
        } else {
            const primaryNames = primaries.map(el => el.name).join('、');
            composition = `${primaryNames}为主要元素`;
        }

        // 次要元素描述
        if (secondaries.length > 0) {
            const secondaryNames = secondaries.map(el => el.name).join('、');
            composition += `，辅以${secondaryNames}`;
        }

        // 空间关系描述
        if (analysis.spatialRelations.length > 0) {
            composition += `，${analysis.spatialRelations.join('，')}`;
        }

        return composition;
    },

    // 生成完整的构图提示词
    generateCompositionPrompt(analysis) {
        let prompt = '';

        // 整体构图
        prompt += `【整体构图】${analysis.overallComposition}。\n\n`;

        // 主要元素详细描述
        if (analysis.primaryElements.length > 0) {
            prompt += `【主要元素】\n`;
            analysis.primaryElements.forEach(element => {
                prompt += `• ${element.name}：位于${element.position}，占据显著位置\n`;
            });
            prompt += `\n`;
        }

        // 次要元素
        if (analysis.secondaryElements.length > 0) {
            prompt += `【次要元素】\n`;
            analysis.secondaryElements.forEach(element => {
                prompt += `• ${element.name}：位于${element.position}\n`;
            });
            prompt += `\n`;
        }

        // 背景元素
        if (analysis.backgroundElements.length > 0) {
            prompt += `【背景环境】\n`;
            analysis.backgroundElements.forEach(element => {
                prompt += `• ${element.name}\n`;
            });
        }

        // 构图特点总结
        prompt += `\n【构图特点】`;
        if (analysis.primaryElements.some(el => el.position.includes('中心'))) {
            prompt += `中心对称构图，`;
        }
        if (analysis.primaryElements.length === 1) {
            prompt += `焦点突出，`;
        }
        if (analysis.spatialRelations.length > 2) {
            prompt += `层次丰富，`;
        }

        prompt += `元素布局合理，视觉平衡良好。`;

        return prompt;
    }
};

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SmartPrompt;
}