// 二分查找详情显示修复脚本
console.log('====== 二分查找详情修复脚本开始 ======');

// 等待DOM加载完成
document.addEventListener('DOMContentLoaded', function() {
    // 检查algorithmData是否可用
    console.log('window.algorithmData是否可用:', window.algorithmData !== undefined);

    if (window.algorithmData && window.algorithmData.searching) {
        // 查找二分查找算法
        const binarySearch = window.algorithmData.searching.find(alg => alg.id === 'binarySearch');

        if (binarySearch) {
            console.log('找到二分查找算法，开始修复详情显示...');

            // 修复view-algorithm-btn的点击事件处理
            const binarySearchButton = document.querySelector('[data-algorithm="binarySearch"]');
            if (binarySearchButton) {
                // 移除现有的点击事件监听器
                const newButton = binarySearchButton.cloneNode(true);
                binarySearchButton.parentNode.replaceChild(newButton, binarySearchButton);

                // 添加新的点击事件监听器
                newButton.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('二分查找详情按钮点击');

                    // 手动填充算法详情
                    fillAlgorithmDetail(binarySearch);
                });
                console.log('二分查找按钮事件监听器已修复');
            }

            // 添加全局修复函数
            window.fixBinarySearchDetail = function() {
                console.log('手动触发二分查找详情修复');
                fillAlgorithmDetail(binarySearch);
            };

            console.log('修复脚本初始化完成');
        } else {
            console.error('未找到二分查找算法，无法修复详情显示');
        }
    } else {
        console.error('algorithmData.searching不存在，无法修复详情显示');
    }
});

// 填充算法详情的函数
function fillAlgorithmDetail(algorithm) {
    console.log('填充算法详情:', algorithm.name);

    // 获取详情元素
    const algorithmDetail = document.getElementById('algorithmDetail');
    if (!algorithmDetail) {
        console.error('未找到算法详情容器');
        return;
    }

    // 填充基本信息
    document.getElementById('detailTitle').textContent = algorithm.name || '未命名算法';
    document.getElementById('detailDescription').textContent = algorithm.description || '无描述';

    // 填充复杂度分析
    if (algorithm.complexity) {
        document.getElementById('detailTimeComplexity').textContent = algorithm.complexity.time || '未知';
        document.getElementById('detailSpaceComplexity').textContent = algorithm.complexity.space || '未知';
        document.getElementById('detailBestCase').textContent = algorithm.complexity.bestCase || '未知';
        document.getElementById('detailWorstCase').textContent = algorithm.complexity.worstCase || '未知';
        document.getElementById('detailAverageCase').textContent = algorithm.complexity.averageCase || '未知';
    } else {
        document.getElementById('detailTimeComplexity').textContent = '未知';
        document.getElementById('detailSpaceComplexity').textContent = '未知';
        document.getElementById('detailBestCase').textContent = '未知';
        document.getElementById('detailWorstCase').textContent = '未知';
        document.getElementById('detailAverageCase').textContent = '未知';
        console.warn('算法复杂度数据不存在');
    }

    // 填充其他信息
    document.getElementById('detailDifficulty').textContent = algorithm.difficulty || '未知';
    document.getElementById('detailPrecondition').textContent = algorithm.precondition || (algorithm.tags && algorithm.tags.includes('有序数组') ? '数组必须有序' : '无特殊要求');

    // 填充伪代码
    document.getElementById('detailPseudocode').textContent = algorithm.pseudocode || '无伪代码';

    // 填充代码实现
    if (algorithm.code) {
        document.getElementById('detailPythonCode').textContent = algorithm.code.python || '无Python实现';
        document.getElementById('detailJavaScriptCode').textContent = algorithm.code.javascript || '无JavaScript实现';
    } else {
        document.getElementById('detailPythonCode').textContent = '无Python实现';
        document.getElementById('detailJavaScriptCode').textContent = '无JavaScript实现';
        console.warn('算法代码实现数据不存在');
    }

    // 填充标签
    const tagsContainer = document.getElementById('detailTags');
    tagsContainer.innerHTML = '';
    if (algorithm.tags && algorithm.tags.length > 0) {
        algorithm.tags.forEach(tag => {
            const tagElement = document.createElement('span');
            tagElement.className = 'algorithm-tag bg-gray-100 text-gray-800 px-2 py-0.5 rounded-full text-xs font-medium';
            tagElement.textContent = tag;
            tagsContainer.appendChild(tagElement);
        });
    } else {
        const tagElement = document.createElement('span');
        tagElement.className = 'algorithm-tag bg-gray-100 text-gray-800 px-2 py-0.5 rounded-full text-xs font-medium';
        tagElement.textContent = '无标签';
        tagsContainer.appendChild(tagElement);
    }

    // 显示详情
    algorithmDetail.classList.remove('hidden');
    // 滚动到详情部分
    algorithmDetail.scrollIntoView({ behavior: 'smooth' });

    console.log('算法详情填充完成');
}

console.log('====== 二分查找详情修复脚本加载完成 ======');