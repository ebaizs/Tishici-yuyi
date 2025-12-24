// canvas-manager.js - 画布管理模块

const CanvasManager = {
    // 初始化画布
    initCanvas() {
        console.log("初始化画布...");
        
        try {
            const appState = StateManager.getState();
            
            // 设置画布尺寸
            appState.canvasWidth = 1024;
            appState.canvasHeight = 1024;
            
            // 设置画布实际尺寸
            appState.backgroundCanvas.width = appState.canvasWidth;
            appState.backgroundCanvas.height = appState.canvasHeight;
            appState.drawingCanvas.width = appState.canvasWidth;
            appState.drawingCanvas.height = appState.canvasHeight;
            appState.previewCanvas.width = appState.canvasWidth;
            appState.previewCanvas.height = appState.canvasHeight;
            
            // 设置画布显示尺寸
            appState.backgroundCanvas.style.width = appState.canvasWidth + 'px';
            appState.backgroundCanvas.style.height = appState.canvasHeight + 'px';
            appState.drawingCanvas.style.width = appState.canvasWidth + 'px';
            appState.drawingCanvas.style.height = appState.canvasHeight + 'px';
            appState.previewCanvas.style.width = appState.canvasWidth + 'px';
            appState.previewCanvas.style.height = appState.canvasHeight + 'px';
            
            // 设置画布包装器
            const canvasWrapper = document.getElementById('canvasWrapper');
            if (canvasWrapper) {
                canvasWrapper.style.width = appState.canvasWidth + 'px';
                canvasWrapper.style.height = appState.canvasHeight + 'px';
            }
            
            // 初始化背景
            appState.backgroundCtx.fillStyle = 'white';
            appState.backgroundCtx.fillRect(0, 0, appState.backgroundCanvas.width, appState.backgroundCanvas.height);
            
            // 清空绘图层
            appState.drawingCtx.clearRect(0, 0, appState.drawingCanvas.width, appState.drawingCanvas.height);
            appState.previewCtx.clearRect(0, 0, appState.previewCanvas.width, appState.previewCanvas.height);
            
            // 绘制网格
            this.drawGridBackground();
            
            // 重置所有状态
            this.resetCanvasState();
            
            console.log("画布初始化完成");
            
            // 自动执行重置
            setTimeout(() => this.resetZoom(), 100);
        } catch (error) {
            console.error("画布初始化失败:", error);
        }
        
        const appState = StateManager.getState();
        appState.usedColors = new Set();
    },
    
    // 绘制网格背景
    drawGridBackground() {
        const appState = StateManager.getState();
        const ctx = appState.backgroundCtx;
        const width = appState.backgroundCanvas.width;
        const height = appState.backgroundCanvas.height;
        
        // 清除背景
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        
        // 绘制网格
        ctx.strokeStyle = '#f0f0f0';
        ctx.lineWidth = 1;
        
        // 绘制水平线
        for (let y = 0; y <= height; y += 20) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }
        
        // 绘制垂直线
        for (let x = 0; x <= width; x += 20) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
        }
    },
    
    // 重置画布状态
    resetCanvasState() {
        const appState = StateManager.getState();
        appState.labels = [];
        appState.usedColors.clear();
        appState.drawingHistory = [];
        appState.lastOperationLabels = [];
        appState.lassoPoints = [];
        appState.isLassoActive = false;
        appState.lineStartPoint = null;
        appState.isDrawing = false;
        appState.isShiftPressed = false;
        
        // 重置提示词
        document.getElementById('promptOutput').value = "空置空间";
    },
    
    // 更新预览
    updatePreview() {
        // 更新基础设置中的预览
        const previewCircle = document.getElementById('previewCircle');
        const previewCircleInner = document.getElementById('previewCircleInner');
        const previewBrushSize = document.getElementById('previewBrushSize');
        const previewColorName = document.getElementById('previewColorName');
        
        // 更新导出设置中的预览
        const previewCircleExport = document.getElementById('previewCircleExport');
        const previewCircleInnerExport = document.getElementById('previewCircleInnerExport');
        const previewBrushSizeExport = document.getElementById('previewBrushSizeExport');
        const previewColorNameExport = document.getElementById('previewColorNameExport');
        
        if (!previewCircle || !previewCircleInner || !previewBrushSize || !previewColorName) return;
        
        const appState = StateManager.getState();
        const colorInfo = this.getColorInfo(appState.currentColor);
        const hexColor = colorInfo ? rgbToHex(colorInfo.color[0], colorInfo.color[1], colorInfo.color[2]) : '#000000';
        
        // 实时计算显示尺寸，确保预览与实际笔触大小同步
        const maxDisplaySize = 48;
        const minDisplaySize = 3;
        const displaySize = Math.min(maxDisplaySize, Math.max(minDisplaySize, appState.brushSize));
        
        // 更新基础设置预览 - 使用方形
        previewCircle.style.borderColor = hexColor;
        previewCircleInner.style.backgroundColor = hexColor;
        previewCircleInner.style.width = `${displaySize}px`;
        previewCircleInner.style.height = `${displaySize}px`;
        
        previewBrushSize.textContent = `${appState.brushSize}px`;
        previewColorName.textContent = appState.currentColor;
        
        // 更新导出设置预览 - 使用方形
        if (previewCircleExport && previewCircleInnerExport && previewBrushSizeExport && previewColorNameExport) {
            previewCircleExport.style.borderColor = hexColor;
            previewCircleInnerExport.style.backgroundColor = hexColor;
            previewCircleInnerExport.style.width = `${displaySize}px`;
            previewCircleInnerExport.style.height = `${displaySize}px`;
            previewBrushSizeExport.textContent = `${appState.brushSize}px`;
            previewColorNameExport.textContent = appState.currentColor;
        }
        
        this.updatePreviewMode();
    },
    
    // 更新预览模式
    updatePreviewMode() {
        const previewCircle = document.getElementById('previewCircle');
        const previewCircleExport = document.getElementById('previewCircleExport');
        if (!previewCircle) return;
        
        const appState = StateManager.getState();
        
        previewCircle.classList.remove('eraser-mode', 'lasso-mode', 'pipette-mode', 'vanish-mode');
        if (previewCircleExport) {
            previewCircleExport.classList.remove('eraser-mode', 'lasso-mode', 'pipette-mode', 'vanish-mode');
        }
        
        if (appState.operationMode === 'erase') {
            previewCircle.classList.add('eraser-mode');
            if (previewCircleExport) {
                previewCircleExport.classList.add('eraser-mode');
            }
        } else if (appState.operationMode === 'lasso') {
            previewCircle.classList.add('lasso-mode');
            if (previewCircleExport) {
                previewCircleExport.classList.add('lasso-mode');
            }
        } else if (appState.operationMode === 'pipette') {
            previewCircle.classList.add('pipette-mode');
            if (previewCircleExport) {
                previewCircleExport.classList.add('pipette-mode');
            }
        } else if (appState.operationMode === 'vanish') {
            previewCircle.classList.add('vanish-mode');
            if (previewCircleExport) {
                previewCircleExport.classList.add('vanish-mode');
            }
        }
    },
    
    // 获取颜色信息
    getColorInfo(colorName) {
        // 先尝试从当前配置获取
        if (AppState.currentConfig && AppState.currentConfig.colorPalette[colorName]) {
            return AppState.currentConfig.colorPalette[colorName];
        }
        // 然后尝试从自定义颜色获取
        else if (AppState.customColors[colorName]) {
            return AppState.customColors[colorName];
        }
        // 最后从全局颜色映射获取（跨配置颜色）
        else if (AppState.globalColorMap[colorName]) {
            return AppState.globalColorMap[colorName];
        }
        return null;
    },
    
    // 在画布上绘制
    drawOnCanvas(x, y, isClick = false) {
        const appState = StateManager.getState();
        let colorInfo;
        
        if (appState.operationMode === 'vanish') {
            // 消失模式
            colorInfo = {
                color: appState.vanishColor,
                id: -1,
                category: appState.vanishColorName
            };
            appState.drawingCtx.globalCompositeOperation = 'source-over';
            const hexColor = rgbToHex(colorInfo.color[0], colorInfo.color[1], colorInfo.color[2]);
            appState.drawingCtx.fillStyle = hexColor;
        } else if (appState.operationMode === 'erase') {
            // 橡皮擦模式
            appState.drawingCtx.globalCompositeOperation = 'destination-out';
            appState.drawingCtx.fillStyle = 'rgba(0,0,0,1)';
            this.checkErasedLabels(x, y);
        } else {
            // 正常画笔模式
            appState.drawingCtx.globalCompositeOperation = 'source-over';
            colorInfo = this.getColorInfo(appState.currentColor);
            if (colorInfo) {
                const hexColor = rgbToHex(colorInfo.color[0], colorInfo.color[1], colorInfo.color[2]);
                appState.drawingCtx.fillStyle = hexColor;
            }
        }
        
        // 绘制
        const halfSize = appState.brushSize / 2;
        appState.drawingCtx.fillRect(x - halfSize, y - halfSize, appState.brushSize, appState.brushSize);
        
        if (isClick && appState.operationMode !== 'erase') {
            const newLabel = {
                category: appState.operationMode === 'vanish' ? appState.vanishColorName : appState.currentColor,
                coordinates: { x: Math.round(x), y: Math.round(y) },
                color: appState.operationMode === 'vanish' ? appState.vanishColor : (colorInfo ? colorInfo.color : [0, 0, 0]),
                id: appState.operationMode === 'vanish' ? -1 : (colorInfo ? colorInfo.id : 0),
                brushSize: appState.brushSize,
                timestamp: new Date().toISOString()
            };
            
            appState.labels.push(newLabel);
            appState.lastOperationLabels.push(newLabel);
            
            // 更新UI和提示词
            CoreFunctions.updateUI();
            this.updatePromptColors();
        }
        
        appState.lastX = x;
        appState.lastY = y;
    },
    
    // 检查被擦除的标签
    checkErasedLabels(x, y) {
        const appState = StateManager.getState();
        const brushSize = appState.brushSize;
        const halfSize = brushSize / 2;
        
        const labelsToRemove = [];
        
        // 查找要删除的标签
        appState.labels.forEach((label, index) => {
            const labelX = label.coordinates.x;
            const labelY = label.coordinates.y;
            
            if (labelX >= x - halfSize && labelX <= x + halfSize &&
                labelY >= y - halfSize && labelY <= y + halfSize) {
                labelsToRemove.push(index);
            }
        });
        
        // 删除标签
        for (let i = labelsToRemove.length - 1; i >= 0; i--) {
            const index = labelsToRemove[i];
            appState.labels.splice(index, 1);
        }
        
        if (labelsToRemove.length > 0) {
            // 重新计算实际使用的颜色
            const actualUsedColors = new Set();
            appState.labels.forEach(label => {
                if (label.category !== appState.vanishColorName) {
                    actualUsedColors.add(label.category);
                } else {
                    actualUsedColors.add(appState.vanishColorName);
                }
            });
            
            // 更新 usedColors
            appState.usedColors = new Set(actualUsedColors);
            
            // 更新UI和提示词
            CoreFunctions.updateUI();
            this.updatePromptColors();
        }
    },
    
    // 更新提示词颜色部分
    updatePromptColors() {
        const promptTextarea = document.getElementById('promptOutput');
        const appState = StateManager.getState();
        
        // 如果没有标签，显示空置空间或智能提示词
        if (appState.labels.length === 0) {
            const smartPrompt = document.getElementById('smartPromptOutput').value.trim();
            if (appState.appliedSmartPrompt && smartPrompt) {
                promptTextarea.value = smartPrompt;
            } else {
                promptTextarea.value = "空置空间";
            }
            return;
        }
        
        // 计算当前画布上实际存在的颜色
        const actualUsedColors = new Set();
        appState.labels.forEach(label => {
            if (label.category !== appState.vanishColorName) {
                actualUsedColors.add(label.category);
            } else {
                actualUsedColors.add(appState.vanishColorName);
            }
        });
        
        // 更新 appState.usedColors
        appState.usedColors = new Set(actualUsedColors);
        
        // 构建颜色相关的提示词
        let colorPrompt = "";
        if (appState.usedColors.size > 0) {
            const colorNames = [];
            const colorDetails = [];
            const seenColors = new Set();
            
            // 收集颜色名称和颜色详情
            appState.usedColors.forEach(colorName => {
                if (colorName === appState.vanishColorName) {
                    // 消失区域
                    const hexColor = rgbToHex(appState.vanishColor[0], appState.vanishColor[1], appState.vanishColor[2]);
                    if (!seenColors.has('vanish')) {
                        colorDetails.push(`将${hexColor}颜色区域的物体清除`);
                        seenColors.add('vanish');
                    }
                } else {
                    const colorInfo = this.getColorInfo(colorName);
                    if (colorInfo && !seenColors.has(colorName)) {
                        const hexColor = rgbToHex(colorInfo.color[0], colorInfo.color[1], colorInfo.color[2]);
                        colorNames.push(colorName);
                        colorDetails.push(`在${hexColor}颜色区域添加${colorName}`);
                        seenColors.add(colorName);
                    }
                }
            });
            
            if (colorNames.length > 0) {
                colorPrompt = "超高清，" + colorNames.join('，');
            } else {
                colorPrompt = "超高清";
            }
            
            if (colorDetails.length > 0) {
                colorPrompt += "，" + colorDetails.join('，');
            }
        }
        
        // 合并智能提示词部分
        let finalPrompt = colorPrompt;
        if (appState.appliedSmartPrompt) {
            const smartPrompt = document.getElementById('smartPromptOutput').value;
            if (smartPrompt) {
                finalPrompt = colorPrompt ? colorPrompt + "\n" + smartPrompt : smartPrompt;
            }
        }
        
        // 如果没有内容，使用默认
        if (!finalPrompt.trim()) {
            finalPrompt = "空置空间";
        }
        
        // 清理多余的逗号
        finalPrompt = finalPrompt.replace(/，，/g, '，')
            .replace(/^，/, '')
            .replace(/，$/, '')
            .trim();
        
        promptTextarea.value = finalPrompt;
    },
    
    // 绘制直线
    drawLineOnCanvas(x1, y1, x2, y2) {
        const appState = StateManager.getState();
        const colorInfo = this.getColorInfo(appState.currentColor);
        
        if (appState.operationMode === 'erase') {
            appState.drawingCtx.globalCompositeOperation = 'destination-out';
            appState.drawingCtx.strokeStyle = 'rgba(0,0,0,1)';
        } else {
            appState.drawingCtx.globalCompositeOperation = 'source-over';
            const hexColor = rgbToHex(colorInfo.color[0], colorInfo.color[1], colorInfo.color[2]);
            appState.drawingCtx.strokeStyle = hexColor;
        }
        
        appState.drawingCtx.lineWidth = appState.brushSize;
        appState.drawingCtx.lineCap = 'square';
        appState.drawingCtx.beginPath();
        appState.drawingCtx.moveTo(x1, y1);
        appState.drawingCtx.lineTo(x2, y2);
        appState.drawingCtx.stroke();
        
        if (appState.operationMode !== 'erase') {
            const midX = Math.round((x1 + x2) / 2);
            const midY = Math.round((y1 + y2) / 2);
            
            const newLabel = {
                category: appState.currentColor,
                coordinates: { x: midX, y: midY },
                color: colorInfo.color,
                id: colorInfo.id,
                brushSize: appState.brushSize,
                timestamp: new Date().toISOString()
            };
            
            appState.labels.push(newLabel);
            appState.lastOperationLabels.push(newLabel);
            
            appState.usedColors.add(appState.currentColor);
            
            CoreFunctions.updateUI();
            this.updatePromptColors();
        }
    },
    
    // 绘制直线预览
    drawLinePreview(x1, y1, x2, y2) {
        const appState = StateManager.getState();
        appState.previewCtx.clearRect(0, 0, appState.previewCanvas.width, appState.previewCanvas.height);
        
        const colorInfo = this.getColorInfo(appState.currentColor);
        
        if (appState.operationMode === 'erase') {
            appState.previewCtx.strokeStyle = 'rgba(255,0,0,0.5)';
        } else {
            const hexColor = rgbToHex(colorInfo.color[0], colorInfo.color[1], colorInfo.color[2]);
            appState.previewCtx.strokeStyle = hexColor;
        }
        
        appState.previewCtx.lineWidth = appState.brushSize;
        appState.previewCtx.lineCap = 'square';
        appState.previewCtx.setLineDash([5, 5]);
        appState.previewCtx.beginPath();
        appState.previewCtx.moveTo(x1, y1);
        appState.previewCtx.lineTo(x2, y2);
        appState.previewCtx.stroke();
        appState.previewCtx.setLineDash([]);
    },
    
    // 开始套索
    startLasso(x, y) {
        const appState = StateManager.getState();
        
        // 如果按下Alt键，则禁用套索功能
        if (appState.isAltPressed) return;
        
        appState.lassoPoints = [{ x, y }];
        appState.isLassoActive = true;
        appState.lastOperationLabels = [];
        
        this.drawLassoPreview();
    },
    
    // 添加套索点
    addLassoPoint(x, y) {
        const appState = StateManager.getState();
        
        // 如果按下Alt键，则禁用套索功能
        if (appState.isAltPressed || !appState.isLassoActive) return;
        
        appState.lassoPoints.push({ x, y });
        this.drawLassoPreview();
    },
    
    // 完成套索
    completeLasso() {
        const appState = StateManager.getState();
        if (!appState.isLassoActive || appState.lassoPoints.length < 3) return;
        
        const colorInfo = this.getColorInfo(appState.currentColor);
        const hexColor = rgbToHex(colorInfo.color[0], colorInfo.color[1], colorInfo.color[2]);
        
        appState.drawingCtx.globalCompositeOperation = 'source-over';
        appState.drawingCtx.fillStyle = hexColor;
        
        appState.drawingCtx.beginPath();
        appState.drawingCtx.moveTo(appState.lassoPoints[0].x, appState.lassoPoints[0].y);
        
        for (let i = 1; i < appState.lassoPoints.length; i++) {
            appState.drawingCtx.lineTo(appState.lassoPoints[i].x, appState.lassoPoints[i].y);
        }
        
        appState.drawingCtx.closePath();
        appState.drawingCtx.fill();
        
        const center = this.getPolygonCenter(appState.lassoPoints);
        const newLabel = {
            category: appState.currentColor,
            coordinates: { x: Math.round(center.x), y: Math.round(center.y) },
            color: colorInfo.color,
            id: colorInfo.id,
            brushSize: appState.brushSize,
            timestamp: new Date().toISOString(),
            isLasso: true,
            points: [...appState.lassoPoints]
        };
        
        appState.labels.push(newLabel);
        appState.lastOperationLabels.push(newLabel);
        
        appState.usedColors.add(appState.currentColor);
        
        appState.lassoPoints = [];
        appState.isLassoActive = false;
        
        appState.previewCtx.clearRect(0, 0, appState.previewCanvas.width, appState.previewCanvas.height);
        
        this.saveDrawingState();
        
        CoreFunctions.updateUI();
        this.updatePromptColors();
    },
    
    // 取消套索
    cancelLasso() {
        const appState = StateManager.getState();
        appState.lassoPoints = [];
        appState.isLassoActive = false;
        appState.previewCtx.clearRect(0, 0, appState.previewCanvas.width, appState.previewCanvas.height);
    },
    
    // 绘制套索预览
    drawLassoPreview() {
        const appState = StateManager.getState();
        if (!appState.isLassoActive || appState.lassoPoints.length === 0) return;
        
        appState.previewCtx.clearRect(0, 0, appState.previewCanvas.width, appState.previewCanvas.height);
        
        const colorInfo = this.getColorInfo(appState.currentColor);
        const hexColor = rgbToHex(colorInfo.color[0], colorInfo.color[1], colorInfo.color[2]);
        
        appState.previewCtx.strokeStyle = hexColor;
        appState.previewCtx.fillStyle = hexColor + '40';
        appState.previewCtx.lineWidth = 2;
        appState.previewCtx.setLineDash([5, 5]);
        
        appState.previewCtx.beginPath();
        appState.previewCtx.moveTo(appState.lassoPoints[0].x, appState.lassoPoints[0].y);
        
        for (let i = 1; i < appState.lassoPoints.length; i++) {
            appState.previewCtx.lineTo(appState.lassoPoints[i].x, appState.lassoPoints[i].y);
        }
        
        if (appState.lassoPoints.length > 0) {
            appState.previewCtx.lineTo(appState.lastX, appState.lastY);
        }
        
        appState.previewCtx.stroke();
        
        if (appState.lassoPoints.length >= 2) {
            appState.previewCtx.closePath();
            appState.previewCtx.fill();
        }
        
        appState.previewCtx.setLineDash([]);
        
        appState.lassoPoints.forEach(point => {
            appState.previewCtx.beginPath();
            appState.previewCtx.arc(point.x, point.y, 4, 0, Math.PI * 2);
            appState.previewCtx.fillStyle = hexColor;
            appState.previewCtx.fill();
        });
    },
    
    // 获取多边形中心
    getPolygonCenter(points) {
        let x = 0, y = 0;
        points.forEach(point => {
            x += point.x;
            y += point.y;
        });
        return {
            x: x / points.length,
            y: y / points.length
        };
    },
    
    // 设置操作模式
    setOperationMode(mode) {
        const appState = StateManager.getState();
        appState.operationMode = mode;
        
        document.querySelectorAll('.tool-button').forEach(btn => {
            btn.classList.remove('active');
        });
        
        if (mode === 'pipette') {
            document.getElementById('pipetteMode').classList.add('active');
            document.getElementById('currentTool').textContent = '吸管';
            appState.drawingCanvas.style.cursor = 'crosshair';
        } else if (mode === 'paint') {
            document.getElementById('paintMode').classList.add('active');
            document.getElementById('currentTool').textContent = '画笔';
            appState.drawingCanvas.style.cursor = 'crosshair';
        } else if (mode === 'erase') {
            document.getElementById('eraseMode').classList.add('active');
            document.getElementById('currentTool').textContent = '橡皮';
            appState.drawingCanvas.style.cursor = 'crosshair';
        } else if (mode === 'lasso') {
            document.getElementById('lassoMode').classList.add('active');
            document.getElementById('currentTool').textContent = '套索';
            this.cancelLasso();
        } else if (mode === 'vanish') {
            document.getElementById('vanishMode').classList.add('active');
            document.getElementById('currentTool').textContent = '消失';
            appState.drawingCanvas.style.cursor = 'crosshair';
        }
        
        this.updatePreview();
    },
    
    // 调整画布尺寸
    resizeCanvasContent(width, height) {
        const appState = StateManager.getState();
        
        const tempBackgroundCanvas = document.createElement('canvas');
        tempBackgroundCanvas.width = appState.backgroundCanvas.width;
        tempBackgroundCanvas.height = appState.backgroundCanvas.height;
        const tempBackgroundCtx = tempBackgroundCanvas.getContext('2d');
        tempBackgroundCtx.drawImage(appState.backgroundCanvas, 0, 0);
        
        const tempDrawingCanvas = document.createElement('canvas');
        tempDrawingCanvas.width = appState.drawingCanvas.width;
        tempDrawingCanvas.height = appState.drawingCanvas.height;
        const tempDrawingCtx = tempDrawingCanvas.getContext('2d');
        tempDrawingCtx.drawImage(appState.drawingCanvas, 0, 0);
        
        appState.backgroundCanvas.width = width;
        appState.backgroundCanvas.height = height;
        appState.drawingCanvas.width = width;
        appState.drawingCanvas.height = height;
        appState.previewCanvas.width = width;
        appState.previewCanvas.height = height;
        
        appState.backgroundCanvas.style.width = width + 'px';
        appState.backgroundCanvas.style.height = height + 'px';
        appState.drawingCanvas.style.width = width + 'px';
        appState.drawingCanvas.style.height = height + 'px';
        appState.previewCanvas.style.width = width + 'px';
        appState.previewCanvas.style.height = height + 'px';
        
        const canvasWrapper = document.getElementById('canvasWrapper');
        if (canvasWrapper) {
            canvasWrapper.style.width = width + 'px';
            canvasWrapper.style.height = height + 'px';
        }
        
        appState.backgroundCtx.drawImage(tempBackgroundCanvas, 0, 0);
        appState.drawingCtx.drawImage(tempDrawingCanvas, 0, 0);
        
        if (appState.originalImage) {
            this.drawImageOnCanvas(appState.originalImage);
        } else {
            this.drawGridBackground();
        }
    },
    
    // 在画布上绘制图片
    drawImageOnCanvas(img) {
        const appState = StateManager.getState();
        appState.canvasWidth = img.width;
        appState.canvasHeight = img.height;
        
        // 设置画布实际尺寸
        appState.backgroundCanvas.width = img.width;
        appState.backgroundCanvas.height = img.height;
        appState.drawingCanvas.width = img.width;
        appState.drawingCanvas.height = img.height;
        appState.previewCanvas.width = img.width;
        appState.previewCanvas.height = img.height;
        
        // 设置画布显示尺寸（保持原始尺寸）
        appState.backgroundCanvas.style.width = img.width + 'px';
        appState.backgroundCanvas.style.height = img.height + 'px';
        appState.drawingCanvas.style.width = img.width + 'px';
        appState.drawingCanvas.style.height = img.height + 'px';
        appState.previewCanvas.style.width = img.width + 'px';
        appState.previewCanvas.style.height = img.height + 'px';
        
        // 设置画布包装器尺寸
        const canvasWrapper = document.getElementById('canvasWrapper');
        if (canvasWrapper) {
            canvasWrapper.style.width = img.width + 'px';
            canvasWrapper.style.height = img.height + 'px';
        }
        
        // 清空背景并绘制图片
        appState.backgroundCtx.clearRect(0, 0, appState.backgroundCanvas.width, appState.backgroundCanvas.height);
        appState.backgroundCtx.drawImage(img, 0, 0);
        
        // 重置缩放和平移
        this.resetZoom();
    },
    
    // 切换背景显示
    toggleBackground() {
        const appState = StateManager.getState();
        appState.backgroundVisible = !appState.backgroundVisible;
        appState.backgroundCanvas.style.display = appState.backgroundVisible ? 'block' : 'none';
        document.getElementById('toggleBackground').textContent =
            appState.backgroundVisible ? '隐藏背景' : '显示背景';
    },
    
    // 调整缩放
    adjustZoom(delta) {
        const appState = StateManager.getState();
        const oldZoom = appState.zoomLevel;
        appState.zoomLevel += delta;
        appState.zoomLevel = Math.max(0.1, Math.min(5, appState.zoomLevel));
        
        // 修复：确保百分比显示准确
        const displayPercent = Math.round(appState.zoomLevel * 100);
        document.getElementById('zoomLevel').textContent = `${displayPercent}%`;
        document.getElementById('zoomLevelDisplay').textContent = `${displayPercent}%`;
        
        const canvasWrapper = document.getElementById('canvasWrapper');
        canvasWrapper.style.transform = `translate(${appState.canvasTranslateX}px, ${appState.canvasTranslateY}px) scale(${appState.zoomLevel})`;
        
        setTimeout(this.checkScrollHint, 100);
    },
    
    // 重置缩放
    resetZoom() {
        const appState = StateManager.getState();
        appState.zoomLevel = 1;
        appState.canvasTranslateX = 0;
        appState.canvasTranslateY = 0;
        document.getElementById('zoomLevel').textContent = '100%';
        document.getElementById('zoomLevelDisplay').textContent = '100%';
        
        const canvasWrapper = document.getElementById('canvasWrapper');
        canvasWrapper.style.transform = 'translate(0px, 0px) scale(1)';
        
        // 重置滚动位置
        const canvasContainer = document.querySelector('.canvas-container');
        if (canvasContainer) {
            canvasContainer.scrollLeft = 0;
            canvasContainer.scrollTop = 0;
        }
        
        // 检查是否需要显示滚动提示
        setTimeout(this.checkScrollHint, 100);
    },
    
    // 检查滚动提示
    checkScrollHint() {
        const canvasContainer = document.querySelector('.canvas-container');
        const canvasWrapper = document.getElementById('canvasWrapper');
        
        if (!canvasContainer || !canvasWrapper) return;
        
        // 移除现有的滚动提示
        const existingHint = document.querySelector('.scroll-hint');
        if (existingHint) {
            existingHint.remove();
        }
        
        // 检查是否需要显示滚动提示
        const containerWidth = canvasContainer.clientWidth;
        const containerHeight = canvasContainer.clientHeight;
        const wrapperWidth = canvasWrapper.offsetWidth;
        const wrapperHeight = canvasWrapper.offsetHeight;
        
        const needsHorizontalScroll = wrapperWidth > containerWidth;
        const needsVerticalScroll = wrapperHeight > containerHeight;
        
        if (needsHorizontalScroll || needsVerticalScroll) {
            const scrollHint = document.createElement('div');
            scrollHint.className = 'scroll-hint';
            
            let hintText = '可滚动查看完整图像';
            if (needsHorizontalScroll && needsVerticalScroll) {
                hintText = '可拖拽滚动查看完整图像';
            } else if (needsHorizontalScroll) {
                hintText = '可左右滚动查看完整图像';
            } else if (needsVerticalScroll) {
                hintText = '可上下滚动查看完整图像';
            }
            
            scrollHint.textContent = hintText;
            canvasContainer.appendChild(scrollHint);
            
            // 显示提示3秒后淡出
            setTimeout(() => {
                scrollHint.classList.add('visible');
            }, 100);
            
            setTimeout(() => {
                scrollHint.classList.remove('visible');
                setTimeout(() => {
                    if (scrollHint.parentNode) {
                        scrollHint.parentNode.removeChild(scrollHint);
                    }
                }, 300);
            }, 3000);
        }
    },
    
    // 保存绘图状态
    saveDrawingState() {
        const appState = StateManager.getState();
        
        // 保存整个画布状态
        const imageData = appState.drawingCtx.getImageData(0, 0, appState.drawingCanvas.width, appState.drawingCanvas.height);
        
        // 保存到状态管理器
        StateManager.saveDrawingState(imageData);
    },
    
    // 增加画笔大小
    increaseBrushSize() {
        const appState = StateManager.getState();
        if (appState.brushSize < 100) {
            appState.brushSize += 1;
            this.updateBrushSizeUI();
            this.updatePreview();
        }
    },
    
    // 减小画笔大小
    decreaseBrushSize() {
        const appState = StateManager.getState();
        if (appState.brushSize > 1) {
            appState.brushSize -= 1;
            this.updateBrushSizeUI();
            this.updatePreview();
        }
    },
    
    // 更新画笔大小UI
    updateBrushSizeUI() {
        const appState = StateManager.getState();
        document.getElementById('brushSize').value = appState.brushSize;
        document.getElementById('currentBrushSize').textContent = `${appState.brushSize}px`;
    },
    
    // 从画布拾取颜色
    pickColorFromCanvas(x, y) {
        const appState = StateManager.getState();
        
        // 只从标注画布拾取颜色，不取背景颜色
        const imageData = appState.drawingCtx.getImageData(x, y, 1, 1).data;
        
        // 如果标注画布该位置是透明的，则不取色
        if (imageData[3] === 0) {
            showTemporaryMessage('该位置没有标注颜色');
            return;
        }
        
        const r = imageData[0];
        const g = imageData[1];
        const b = imageData[2];
        
        // 查找完全相同的颜色（不找相近色）
        const exactColor = this.findExactColorInGlobal(r, g, b);
        
        if (exactColor) {
            appState.currentColor = exactColor.name;
            this.updatePreview();
            CoreFunctions.updateUI();
            
            // 显示拾取成功的提示
            showTemporaryMessage(`已找到颜色: ${exactColor.name}`);
            // 切换到画笔模式
            this.setOperationMode('paint');
        } else {
            // 没有找到完全相同的颜色
            showTemporaryMessage('色板中没有找到完全相同的颜色');
        }
    },
    
    // 在全局颜色映射中查找完全相同的颜色
    findExactColorInGlobal(r, g, b) {
        let foundColor = null;
        
        // 优先在当前配置中查找
        if (AppState.currentConfig) {
            Object.keys(AppState.currentConfig.colorPalette).forEach(colorName => {
                const colorInfo = AppState.currentConfig.colorPalette[colorName];
                const colorR = colorInfo.color[0];
                const colorG = colorInfo.color[1];
                const colorB = colorInfo.color[2];
                
                // 完全匹配
                if (r === colorR && g === colorG && b === colorB) {
                    foundColor = {
                        name: colorName,
                        info: colorInfo,
                        source: 'currentConfig'
                    };
                    return;
                }
            });
            
            // 如果在当前配置中找到，直接返回
            if (foundColor) {
                return foundColor;
            }
        }
        
        // 然后在自定义颜色中查找
        Object.keys(AppState.customColors).forEach(colorName => {
            const colorInfo = AppState.customColors[colorName];
            const colorR = colorInfo.color[0];
            const colorG = colorInfo.color[1];
            const colorB = colorInfo.color[2];
            
            // 完全匹配
            if (r === colorR && g === colorG && b === colorB) {
                foundColor = {
                    name: colorName,
                    info: colorInfo,
                    source: 'custom'
                };
                return;
            }
        });
        
        // 最后在其他配置中查找
        if (!foundColor) {
            Object.keys(defaultConfigs).forEach(configKey => {
                if (configKey !== document.getElementById('configSelector').value) {
                    const config = defaultConfigs[configKey];
                    Object.keys(config.colorPalette).forEach(colorName => {
                        const colorInfo = config.colorPalette[colorName];
                        const colorR = colorInfo.color[0];
                        const colorG = colorInfo.color[1];
                        const colorB = colorInfo.color[2];
                        
                        // 完全匹配
                        if (r === colorR && g === colorG && b === colorB) {
                            foundColor = {
                                name: colorName,
                                info: colorInfo,
                                source: 'otherConfig'
                            };
                            return;
                        }
                    });
                }
            });
        }
        
        return foundColor;
    }
};