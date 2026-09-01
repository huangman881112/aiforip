// 二分查找最终测试脚本
console.log('====== 二分查找最终测试开始 ======');

// 检查window.algorithmData是否存在
console.log('window.algorithmData是否存在:', window.algorithmData !== undefined);

if (window.algorithmData) {
    // 检查searching数组是否存在
    console.log('algorithmData.searching是否存在:', window.algorithmData.searching !== undefined);
    
    if (window.algorithmData.searching) {
        // 打印搜索算法数量
        console.log('搜索算法数量:', window.algorithmData.searching.length);
        
        // 打印所有搜索算法的ID
        const algorithmIds = window.algorithmData.searching.map(alg => alg.id);
        console.log('搜索算法ID列表:', algorithmIds);
        
        // 查找二分查找算法
        const binarySearch = window.algorithmData.searching.find(alg => alg.id === 'binarySearch');
        
        if (binarySearch) {
            console.log('找到二分查找算法:', binarySearch.name);
            
            // 打印二分查找算法的完整数据
            console.log('二分查找完整数据:', JSON.stringify(binarySearch, null, 2));
            
            // 检查复杂度分析是否存在
            console.log('复杂度分析是否存在:', binarySearch.complexity !== undefined);
            if (binarySearch.complexity) {
                console.log('时间复杂度:', binarySearch.complexity.time);
                console.log('空间复杂度:', binarySearch.complexity.space);
                console.log('最佳情况:', binarySearch.complexity.bestCase);
                console.log('最坏情况:', binarySearch.complexity.worstCase);
                console.log('平均情况:', binarySearch.complexity.averageCase);
            }
            
            // 检查伪代码是否存在
            console.log('伪代码是否存在:', binarySearch.pseudocode !== undefined && binarySearch.pseudocode.trim() !== '');
            if (binarySearch.pseudocode) {
                console.log('伪代码长度:', binarySearch.pseudocode.length);
            }
            
            // 检查代码实现是否存在
            console.log('代码实现是否存在:', binarySearch.code !== undefined);
            if (binarySearch.code) {
                console.log('Python实现是否存在:', binarySearch.code.python !== undefined && binarySearch.code.python.trim() !== '');
                if (binarySearch.code.python) {
                    console.log('Python实现长度:', binarySearch.code.python.length);
                }
                
                console.log('JavaScript实现是否存在:', binarySearch.code.javascript !== undefined && binarySearch.code.javascript.trim() !== '');
                if (binarySearch.code.javascript) {
                    console.log('JavaScript实现长度:', binarySearch.code.javascript.length);
                }
            }
            
            // 尝试手动触发详情显示
            console.log('尝试手动触发详情显示...');
            try {
                // 模拟查看详情按钮点击
                const event = new Event('click');
                const detailButton = document.querySelector('[data-algorithm="binarySearch"]');
                
                if (detailButton) {
                    console.log('找到详情按钮，触发点击事件');
                    detailButton.dispatchEvent(event);
                } else {
                    console.log('未找到详情按钮');
                }
            } catch (e) {
                console.error('手动触发详情显示失败:', e);
            }
        } else {
            console.error('未找到二分查找算法');
        }
    }
} else {
    console.error('window.algorithmData不存在');
}

console.log('====== 二分查找最终测试结束 ======');