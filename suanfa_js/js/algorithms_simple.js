const algorithmData = {
    // 排序算法
    sorting: [
        {
            id: 'bubbleSort',
            name: '冒泡排序',
            description: '冒泡排序是一种简单的排序算法。',
            complexity: {
                time: 'O(n²)',
                space: 'O(1)'
            }
        },
        {
            id: 'quickSort',
            name: '快速排序',
            description: '快速排序是一种高效的排序算法。',
            complexity: {
                time: 'O(n log n)',
                space: 'O(log n)'
            }
        }
    ]
};

// 确保在浏览器环境中可以访问algorithmData
if (typeof window !== 'undefined') {
    window.algorithmData = algorithmData;
}