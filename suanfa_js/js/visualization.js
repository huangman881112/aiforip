// 排序算法可视化库
class SortingVisualizer {
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
        this.animationSpeed = 100; // 毫秒
        this.isSorting = false;
        this.comparisons = 0;
        this.swaps = 0;
        this.lastFrameTime = 0;
    }

    // 生成随机数据
    generateRandomData(size = 20, maxValue = 100) {
        this.data = Array.from({length: size}, () => Math.floor(Math.random() * maxValue) + 1);
        this.comparisons = 0;
        this.swaps = 0;
        this.drawData();
    }

    // 绘制数据
    drawData(highlightIndices = [], color = '#3498db') {
        this.ctx.clearRect(0, 0, this.width, this.height);
        const barWidth = this.width / this.data.length;

        this.data.forEach((value, index) => {
            const barHeight = (value / Math.max(...this.data)) * (this.height - 50);
            const x = index * barWidth;
            const y = this.height - barHeight;

            // 设置颜色
            if (highlightIndices.includes(index)) {
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
        this.ctx.fillText(`交换次数: ${this.swaps}`, 10, 40);
    }

    // 交换数据
    async swap(i, j) {
        [this.data[i], this.data[j]] = [this.data[j], this.data[i]];
        this.swaps++;
        this.drawData([i, j], '#e74c3c');
        await this.sleep(this.animationSpeed);
    }

    // 比较数据
    compare(i, j) {
        this.comparisons++;
        this.drawData([i, j], '#f39c12');
        return this.data[i] > this.data[j];
    }

    // 睡眠函数
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // 设置动画速度
    setAnimationSpeed(speed) {
        this.animationSpeed = speed;
    }

    // 冒泡排序
    async bubbleSort() {
        if (this.isSorting) return;
        this.isSorting = true;
        this.comparisons = 0;
        this.swaps = 0;

        const n = this.data.length;
        for (let i = 0; i < n - 1; i++) {
            for (let j = 0; j < n - i - 1; j++) {
                if (this.compare(j, j + 1)) {
                    await this.swap(j, j + 1);
                }
            }
        }

        // 排序完成，全部高亮
        this.drawData(Array.from({length: n}, (_, i) => i), '#2ecc71');
        this.isSorting = false;
    }

    // 快速排序
    async quickSort() {
        if (this.isSorting) return;
        this.isSorting = true;
        this.comparisons = 0;
        this.swaps = 0;

        await this.quickSortHelper(0, this.data.length - 1);

        // 排序完成，全部高亮
        this.drawData(Array.from({length: this.data.length}, (_, i) => i), '#2ecc71');
        this.isSorting = false;
    }

    async quickSortHelper(low, high) {
        if (low < high) {
            const pi = await this.partition(low, high);
            await this.quickSortHelper(low, pi - 1);
            await this.quickSortHelper(pi + 1, high);
        }
    }

    async partition(low, high) {
        const pivot = this.data[high];
        let i = low - 1;

        for (let j = low; j < high; j++) {
            if (this.data[j] < pivot) {
                i++;
                await this.swap(i, j);
            }
            this.comparisons++;
        }
        await this.swap(i + 1, high);
        return i + 1;
    }

    // 插入排序
    async insertionSort() {
        if (this.isSorting) return;
        this.isSorting = true;
        this.comparisons = 0;
        this.swaps = 0;

        const n = this.data.length;
        for (let i = 1; i < n; i++) {
            const key = this.data[i];
            let j = i - 1;

            while (j >= 0 && this.data[j] > key) {
                this.comparisons++;
                this.data[j + 1] = this.data[j];
                this.drawData([j, j + 1], '#f39c12');
                await this.sleep(this.animationSpeed);
                j--;
            }
            this.comparisons++;
            this.data[j + 1] = key;
            this.swaps++;
            this.drawData([j + 1], '#2ecc71');
            await this.sleep(this.animationSpeed / 2);
        }

        // 排序完成，全部高亮
        this.drawData(Array.from({length: n}, (_, i) => i), '#2ecc71');
        this.isSorting = false;
    }

    // 选择排序
    async selectionSort() {
        if (this.isSorting) return;
        this.isSorting = true;
        this.comparisons = 0;
        this.swaps = 0;

        const n = this.data.length;
        for (let i = 0; i < n - 1; i++) {
            let minIndex = i;
            for (let j = i + 1; j < n; j++) {
                this.comparisons++;
                if (this.data[j] < this.data[minIndex]) {
                    minIndex = j;
                }
            }
            if (minIndex !== i) {
                await this.swap(i, minIndex);
            }
        }

        // 排序完成，全部高亮
        this.drawData(Array.from({length: n}, (_, i) => i), '#2ecc71');
        this.isSorting = false;
    }

    // 归并排序
    async mergeSort() {
        if (this.isSorting) return;
        this.isSorting = true;
        this.comparisons = 0;
        this.swaps = 0;

        await this.mergeSortHelper(0, this.data.length - 1);

        // 排序完成，全部高亮
        this.drawData(Array.from({length: this.data.length}, (_, i) => i), '#2ecc71');
        this.isSorting = false;
    }

    async mergeSortHelper(low, high) {
        if (low < high) {
            const mid = Math.floor((low + high) / 2);
            await this.mergeSortHelper(low, mid);
            await this.mergeSortHelper(mid + 1, high);
            await this.merge(low, mid, high);
        }
    }

    async merge(low, mid, high) {
        const n1 = mid - low + 1;
        const n2 = high - mid;

        const left = new Array(n1);
        const right = new Array(n2);

        for (let i = 0; i < n1; i++) {
            left[i] = this.data[low + i];
        }
        for (let j = 0; j < n2; j++) {
            right[j] = this.data[mid + 1 + j];
        }

        let i = 0, j = 0, k = low;

        while (i < n1 && j < n2) {
            this.comparisons++;
            if (left[i] <= right[j]) {
                this.data[k] = left[i];
                i++;
            } else {
                this.data[k] = right[j];
                j++;
            }
            this.swaps++;
            this.drawData([k], '#f39c12');
            await this.sleep(this.animationSpeed / 2);
            k++;
        }

        while (i < n1) {
            this.data[k] = left[i];
            this.swaps++;
            this.drawData([k], '#2ecc71');
            await this.sleep(this.animationSpeed / 2);
            i++;
            k++;
        }

        while (j < n2) {
            this.data[k] = right[j];
            this.swaps++;
            this.drawData([k], '#2ecc71');
            await this.sleep(this.animationSpeed / 2);
            j++;
            k++;
        }
    }

    // 堆排序
    async heapSort() {
        if (this.isSorting) return;
        this.isSorting = true;
        this.comparisons = 0;
        this.swaps = 0;

        const n = this.data.length;

        // 构建最大堆
        for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
            await this.heapify(n, i);
        }

        // 一个个从堆顶取出元素
        for (let i = n - 1; i > 0; i--) {
            // 将当前堆顶（最大值）移到数组末尾
            await this.swap(0, i);

            // 对剩余堆进行调整
            await this.heapify(i, 0);
        }

        // 排序完成，全部高亮
        this.drawData(Array.from({length: n}, (_, i) => i), '#2ecc71');
        this.isSorting = false;
    }

    async heapify(n, i) {
        let largest = i; // 初始化最大值为根节点
        const left = 2 * i + 1; // 左子节点
        const right = 2 * i + 2; // 右子节点

        // 如果左子节点大于根节点
        if (left < n) {
            this.comparisons++;
            if (this.data[left] > this.data[largest]) {
                largest = left;
            }
        }

        // 如果右子节点大于当前最大值
        if (right < n) {
            this.comparisons++;
            if (this.data[right] > this.data[largest]) {
                largest = right;
            }
        }

        // 如果最大值不是根节点
        if (largest !== i) {
            await this.swap(i, largest);

            // 递归调整受影响的子树
            await this.heapify(n, largest);
        }
    }
}

// 全局可视化器实例
window.visualizer = null;

// 初始化函数
function initVisualization() {
    console.log('Starting visualization initialization...');
    // 确保DOM已加载完成
    if (document.readyState === 'loading') {
        console.log('DOM still loading, waiting...');
        document.addEventListener('DOMContentLoaded', initVisualization);
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
            window.visualizer = new SortingVisualizer('algorithmVisualizationCanvas');
            console.log('Visualizer instance created');
            window.visualizer.generateRandomData();
            console.log('Visualizer initialized successfully');
            // 确保数据被绘制
            window.visualizer.drawData();
            console.log('Data drawn successfully');
        } catch (error) {
            console.error('Error initializing visualizer:', error);
        }
    } else {
        console.error('Canvas element not found!');
        // 如果canvas不存在，延迟后重试
        setTimeout(initVisualization, 100);
    }
}

// 在DOM加载完成后初始化
document.addEventListener('DOMContentLoaded', initVisualization);

// 导出函数以便在其他脚本中调用
window.initVisualization = initVisualization;