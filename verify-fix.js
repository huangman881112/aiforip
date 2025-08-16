// 验证二分查找详情修复脚本
console.log('====== 二分查找修复验证脚本开始 ======');

// 添加验证按钮
document.addEventListener('DOMContentLoaded', function() {
    // 检查是否存在修复函数
    console.log('修复函数是否存在:', window.fixBinarySearchDetail !== undefined);

    // 创建验证按钮
    const verifyButton = document.createElement('button');
    verifyButton.id = 'verifyFixBtn';
    verifyButton.className = 'bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors fixed bottom-4 right-4 z-50';
    verifyButton.textContent = '验证二分查找修复';

    // 添加点击事件
    verifyButton.addEventListener('click', function() {
        console.log('验证按钮点击');
        if (window.fixBinarySearchDetail) {
            window.fixBinarySearchDetail();
            console.log('修复已触发，请检查详情显示');
        } else {
            console.error('修复函数不存在');
            alert('修复函数未加载，请刷新页面重试');
        }
    });

    // 添加到页面
    document.body.appendChild(verifyButton);
    console.log('验证按钮已添加到页面');

    // 自动检查修复效果
    setTimeout(function() {
        console.log('自动检查修复效果...');
        if (window.algorithmData && window.algorithmData.searching) {
            const binarySearch = window.algorithmData.searching.find(alg => alg.id === 'binarySearch');
            if (binarySearch) {
                console.log('二分查找算法数据完整性检查:');
                console.log('- 复杂度分析:', binarySearch.complexity ? '完整' : '缺失');
                console.log('- 伪代码:', binarySearch.pseudocode ? '存在' : '缺失');
                console.log('- Python实现:', binarySearch.code && binarySearch.code.python ? '存在' : '缺失');
                console.log('- JavaScript实现:', binarySearch.code && binarySearch.code.javascript ? '存在' : '缺失');
            }
        }
    }, 2000);
});

console.log('====== 二分查找修复验证脚本加载完成 ======');