// 搜索算法可视化库
class SearchingVisualizer {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            console.error('Canvas element not found');
            return;
        }
        this.ctx = this.canvas.getContext('2d');
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        this.data = [];
        this.target = null;
        this.animationSpeed = 100; // 毫秒
        this.isSearching = false;
        this.comparisons = 0;
        this.foundIndex = -1;
    }

    // 生成随机有序数据
    generateRandomData(size = 20, maxValue = 100) {
        // 生成有序数组
        this.data = Array.from({length: size}, (_, i) => Math.floor(Math.random() * maxValue) + 1);
        this.data.sort((a, b) => a - b);
        // 确保所有元素唯一
        this.data = [...new Set(this.data)];
        // 如果去重后数组长度不足，补足
        while (this.data.length < size) {
            const newValue = Math.floor(Math.random() * maxValue) + 1;
            if (!this.data.includes(newValue)) {
                this.data.push(newValue);
                this.data.sort((a, b) => a - b);
            }
        }
        this.comparisons = 0;
        this.foundIndex = -1;
        this.target = null;
        this.drawData();
    }

    // 设置目标值
    setTarget(target) {
        this.target = target;
        this.comparisons = 0;
        this.foundIndex = -1;
        this.drawData();
    }

    // 随机选择目标值
    selectRandomTarget() {
        if (this.data.length === 0) {
            console.error('No data available');
            return;
        }
        // 有70%的概率选择存在的值，30%的概率选择不存在的值
        if (Math.random() < 0.7) {
            this.target = this.data[Math.floor(Math.random() * this.data.length)];
        } else {
            let randomValue;
            do {
                randomValue = Math.floor(Math.random() * (Math.max(...this.data) + 20)) + 1;
            } while (this.data.includes(randomValue));
            this.target = randomValue;
        }
        this.comparisons = 0;
        this.foundIndex = -1;
        this.drawData();
        return this.target;
    }

    // 绘制数据
    drawData(highlightIndices = [], color = '#3498db') {
        this.ctx.clearRect(0, 0, this.width, this.height);
        const barWidth = this.width / this.data.length;

        // 绘制水平中轴线
        this.ctx.strokeStyle = '#ddd';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.moveTo(0, this.height / 2);
        this.ctx.lineTo(this.width, this.height / 2);
        this.ctx.stroke();

        // 绘制目标值线
        if (this.target !== null) {
            const targetY = this.height - (this.target / Math.max(...this.data)) * (this.height - 50);
            this.ctx.strokeStyle = '#e74c3c';
            this.ctx.lineWidth = 1;
            this.ctx.setLineDash([5, 3]);
            this.ctx.beginPath();
            this.ctx.moveTo(0, targetY);
            this.ctx.lineTo(this.width, targetY);
            this.ctx.stroke();
            this.ctx.setLineDash([]);

            // 绘制目标值文本
            this.ctx.fillStyle = '#e74c3c';
            this.ctx.font = '12px Arial';
            this.ctx.textAlign = 'right';
            this.ctx.fillText(`目标值: ${this.target}`, this.width - 10, targetY - 10);
        }

        // 绘制数据条和值
        this.data.forEach((value, index) => {
            const barHeight = (value / Math.max(...this.data)) * (this.height - 50);
            const x = index * barWidth;
            const y = this.height - barHeight;

            // 设置颜色
            if (this.foundIndex === index) {
                this.ctx.fillStyle = '#2ecc71'; // 找到目标值的颜色
            } else if (highlightIndices.includes(index)) {
                this.ctx.fillStyle = color;
            } else {
                this.ctx.fillStyle = '#3498db';
            }

            // 绘制柱子
            this.ctx.fillRect(x, y, barWidth - 1, barHeight);

            // 绘制数值
            this.ctx.fillStyle = '#000';
            this.ctx.font = '10px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(value, x + barWidth / 2, y - 5);
        });

        // 绘制统计信息
        this.ctx.fillStyle = '#000';
        this.ctx.font = '12px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`比较次数: ${this.comparisons}`, 10, 20);
        if (this.foundIndex !== -1) {
            this.ctx.fillText(`找到目标值，索引: ${this.foundIndex}`, 10, 40);
        } else if (this.target !== null && this.isSearching) {
            this.ctx.fillText('未找到目标值', 10, 40);
        }
    }

    // 比较数据
    compare(index) {
        this.comparisons++;
        this.drawData([index], '#f39c12');
        return this.data[index] === this.target;
    }

    // 睡眠函数
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // 设置动画速度
    setAnimationSpeed(speed) {
        this.animationSpeed = speed;
    }

    // 线性搜索
    async linearSearch() {
        if (this.isSearching || this.target === null) return;
        this.isSearching = true;
        this.comparisons = 0;
        this.foundIndex = -1;

        const n = this.data.length;
        for (let i = 0; i < n; i++) {
            await this.sleep(this.animationSpeed);
            if (this.compare(i)) {
                this.foundIndex = i;
                this.drawData([i], '#2ecc71');
                this.isSearching = false;
                return;
            }
        }

        this.drawData();
        this.isSearching = false;
    }

    // 二分搜索
    async binarySearch() {
        if (this.isSearching || this.target === null) return;
        this.isSearching = true;
        this.comparisons = 0;
        this.foundIndex = -1;

        let left = 0;
        let right = this.data.length - 1;

        while (left <= right) {
            const mid = Math.floor((left + right) / 2);
            await this.sleep(this.animationSpeed);

            if (this.compare(mid)) {
                this.foundIndex = mid;
                this.drawData([mid], '#2ecc71');
                this.isSearching = false;
                return;
            } else if (this.data[mid] < this.target) {
                left = mid + 1;
                this.drawData([mid], '#e74c3c');
            } else {
                right = mid - 1;
                this.drawData([mid], '#e74c3c');
            }
        }

        this.drawData();
        this.isSearching = false;
    }

    // 插值搜索
    async interpolationSearch() {
        if (this.isSearching || this.target === null) return;
        this.isSearching = true;
        this.comparisons = 0;
        this.foundIndex = -1;

        let low = 0;
        let high = this.data.length - 1;

        while (low <= high && this.target >= this.data[low] && this.target <= this.data[high]) {
            if (low === high) {
                await this.sleep(this.animationSpeed);
                if (this.compare(low)) {
                    this.foundIndex = low;
                    this.drawData([low], '#2ecc71');
                }
                this.isSearching = false;
                return;
            }

            // 计算插值位置
            const pos = low + Math.floor(((this.target - this.data[low]) * (high - low)) / (this.data[high] - this.data[low]));
            await this.sleep(this.animationSpeed);

            if (this.compare(pos)) {
                this.foundIndex = pos;
                this.drawData([pos], '#2ecc71');
                this.isSearching = false;
                return;
            } else if (this.data[pos] < this.target) {
                low = pos + 1;
                this.drawData([pos], '#e74c3c');
            } else {
                high = pos - 1;
                this.drawData([pos], '#e74c3c');
            }
        }

        this.drawData();
        this.isSearching = false;
    }

    // 跳跃搜索
    async jumpSearch() {
        if (this.isSearching || this.target === null) return;
        this.isSearching = true;
        this.comparisons = 0;
        this.foundIndex = -1;

        const n = this.data.length;
        // 确定跳跃步长
        const step = Math.floor(Math.sqrt(n));
        // 找到目标值所在的块
        let prev = 0;

        while (prev < n && this.data[Math.min(prev + step - 1, n - 1)] < this.target) {
            await this.sleep(this.animationSpeed);
            this.drawData([Math.min(prev + step - 1, n - 1)], '#e74c3c');
            prev += step;
        }

        // 在块内线性查找
        const start = prev;
        const end = Math.min(prev + step - 1, n - 1);

        for (let i = start; i <= end; i++) {
            await this.sleep(this.animationSpeed);
            if (this.compare(i)) {
                this.foundIndex = i;
                this.drawData([i], '#2ecc71');
                this.isSearching = false;
                return;
            }
        }

        this.drawData();
        this.isSearching = false;
    }

    // 指数搜索
    async exponentialSearch() {
        if (this.isSearching || this.target === null) return;
        this.isSearching = true;
        this.comparisons = 0;
        this.foundIndex = -1;

        const n = this.data.length;
        // 检查第一个元素
        if (this.data[0] === this.target) {
            this.foundIndex = 0;
            this.drawData([0], '#2ecc71');
            this.isSearching = false;
            return;
        }

        // 找到目标值可能的范围
        let i = 1;
        while (i < n && this.data[i] <= this.target) {
            await this.sleep(this.animationSpeed);
            this.drawData([i], '#f39c12');
            i *= 2;
        }

        // 在找到的范围内使用二分查找
        await this.binarySearchInRange(Math.floor(i / 2), Math.min(i, n - 1));
        this.isSearching = false;
    }

    // 在指定范围内进行二分查找
    async binarySearchInRange(left, right) {
        while (left <= right) {
            const mid = Math.floor((left + right) / 2);
            await this.sleep(this.animationSpeed);

            if (this.compare(mid)) {
                this.foundIndex = mid;
                this.drawData([mid], '#2ecc71');
                return;
            } else if (this.data[mid] < this.target) {
                left = mid + 1;
                this.drawData([mid], '#e74c3c');
            } else {
                right = mid - 1;
                this.drawData([mid], '#e74c3c');
            }
        }
    }
}

// 全局可视化器实例
window.searchingVisualizer = null;

// 初始化函数
function initSearchingVisualization() {
    console.log('Starting search visualization initialization...');
    // 确保DOM已加载完成
    if (document.readyState === 'loading') {
        console.log('DOM still loading, waiting...');
        document.addEventListener('DOMContentLoaded', initSearchingVisualization);
        return;
    }

    // 设置canvas尺寸
    const canvas = document.getElementById('algorithmVisualizationCanvas');
    if (canvas) {
        // 确保canvas有正确的尺寸
        canvas.width = 800;
        canvas.height = 400;
        console.log('Canvas found and sized:', canvas.width, 'x', canvas.height);
        try {
            // 创建可视化器实例
            window.searchingVisualizer = new SearchingVisualizer('algorithmVisualizationCanvas');
            console.log('Searching visualizer instance created');
            window.searchingVisualizer.generateRandomData();
            console.log('Searching visualizer initialized successfully');
            // 确保数据被绘制
            window.searchingVisualizer.drawData();
            console.log('Data drawn successfully');
        } catch (error) {
            console.error('Error initializing searching visualizer:', error);
        }
    } else {
        console.error('Canvas element not found!');
        // 如果canvas不存在，延迟后重试
        setTimeout(initSearchingVisualization, 100);
    }
}

// 在DOM加载完成后初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSearchingVisualization);
} else {
    initSearchingVisualization();
}

// 导出函数以便在其他脚本中调用
window.initSearchingVisualization = initSearchingVisualization;