const algorithmData = {
    
    // 搜索算法
    searching: [
        {
            id: 'interpolationSearch',
            name: '插值查找',
            description: '插值查找是二分查找的改进版本，它根据查找值与数组边界值的关系来预测查找值可能的位置，从而加速查找过程。',
            complexity: {
                time: 'O(log log n)',
                space: 'O(1)',
                bestCase: 'O(1)',
                worstCase: 'O(n)',
                averageCase: 'O(log log n)'
            },
            tags: ['中等', '有序数组', '改进二分'],
            difficulty: '中等',
            precondition: '数组必须有序且分布均匀',
            pseudocode: `function interpolationSearch(array, target) {
    let low = 0;
    let high = array.length - 1;
    while (low <= high && target >= array[low] && target <= array[high]) {
        if (low === high) {
            if (array[low] === target) return low;
            return -1;
        }
        // 计算插值位置
        const pos = low + Math.floor(((target - array[low]) * (high - low)) / (array[high] - array[low]));
        if (array[pos] === target) {
            return pos;
        } else if (array[pos] < target) {
            low = pos + 1;
        } else {
            high = pos - 1;
        }
    }
    return -1;
}`,
            code: {
                python: `def interpolation_search(arr, target):
    low = 0
    high = len(arr) - 1
    while low <= high && target >= arr[low] && target <= arr[high]:
        if low == high:
            if arr[low] == target:
                return low
            return -1
        # 计算插值位置
        pos = low + ((target - arr[low]) * (high - low)) // (arr[high] - arr[low])
        if arr[pos] == target:
            return pos
        elif arr[pos] < target:
            low = pos + 1
        else:
            high = pos - 1
    return -1`,
                javascript: `function interpolationSearch(arr, target) {
    let low = 0;
    let high = arr.length - 1;
    while (low <= high && target >= arr[low] && target <= arr[high]) {
        if (low === high) {
            if (arr[low] === target) return low;
            return -1;
        }
        // 计算插值位置
        const pos = low + Math.floor(((target - arr[low]) * (high - low)) / (arr[high] - arr[low]));
        if (arr[pos] === target) {
            return pos;
        } else if (arr[pos] < target) {
            low = pos + 1;
        } else {
            high = pos - 1;
        }
    }
    return -1;
}`
            }
        },
        {
            id: 'jumpSearch',
            name: '跳跃查找',
            description: '跳跃查找是一种用于有序数组的搜索算法，它通过跳过一定数量的元素来加速查找过程，比线性查找效率高，但比二分查找简单。',
            complexity: {
                time: 'O(√n)',
                space: 'O(1)',
                bestCase: 'O(1)',
                worstCase: 'O(√n)',
                averageCase: 'O(√n)'
            },
            tags: ['中等', '有序数组', '分块'],
            difficulty: '中等',
            precondition: '数组必须有序',
            pseudocode: `function jumpSearch(array, target) {
    const n = array.length;
    // 确定跳跃步长
    const step = Math.floor(Math.sqrt(n));
    // 找到目标值所在的块
    let prev = 0;
    while (array[Math.min(step, n) - 1] < target) {
        prev = step;
        step *= 2;
        if (prev >= n) return -1;
    }
    // 在块内线性查找
    while (array[prev] < target) {
        prev++;
        if (prev === Math.min(step, n)) return -1;
    }
    if (array[prev] === target) return prev;
    return -1;
}`,
            code: {
                python: `import math

def jump_search(arr, target):
    n = len(arr)
    # 确定跳跃步长
    step = int(math.sqrt(n))
    # 找到目标值所在的块
    prev = 0
    while arr[min(step, n) - 1] < target:
        prev = step
        step += int(math.sqrt(n))
        if prev >= n:
            return -1
    # 在块内线性查找
    while arr[prev] < target:
        prev += 1
        if prev == min(step, n):
            return -1
    if arr[prev] == target:
        return prev
    return -1`,
                javascript: `function jumpSearch(arr, target) {
    const n = arr.length;
    // 确定跳跃步长
    const step = Math.floor(Math.sqrt(n));
    // 找到目标值所在的块
    let prev = 0;
    while (arr[Math.min(step, n) - 1] < target) {
        prev = step;
        step += Math.floor(Math.sqrt(n));
        if (prev >= n) return -1;
    }
    // 在块内线性查找
    while (arr[prev] < target) {
        prev++;
        if (prev === Math.min(step, n)) return -1;
    }
    if (arr[prev] === target) return prev;
    return -1;
}`
            }
        },
        {
            id: 'exponentialSearch',
            name: '指数搜索',
            description: '指数搜索，也称为加倍搜索或 galioping 搜索，它通过指数级增长的步长来找到目标值可能的范围，然后在该范围内使用二分查找。',
            complexity: {
                time: 'O(log n)',
                space: 'O(log n)',
                bestCase: 'O(1)',
                worstCase: 'O(log n)',
                averageCase: 'O(log n)'
            },
            tags: ['中等', '有序数组', '指数增长'],
            difficulty: '中等',
            precondition: '数组必须有序',
            pseudocode: `function exponentialSearch(array, target) {
    const n = array.length;
    // 检查第一个元素
    if (array[0] === target) return 0;
    // 找到目标值可能的范围
    let i = 1;
    while (i < n && array[i] <= target) {
        i *= 2;
    }
    // 在找到的范围内使用二分查找
    return binarySearch(array, target, i/2, Math.min(i, n-1));
}

function binarySearch(array, target, left, right) {
    while (left <= right) {
        const mid = Math.floor((left + right) / 2);
        if (array[mid] === target) {
            return mid;
        } else if (array[mid] < target) {
            left = mid + 1;
        } else {
            right = mid - 1;
        }
    }
    return -1;
}`,
            code: {
                python: `def exponential_search(arr, target):
    n = len(arr)
    # 检查第一个元素
    if arr[0] == target:
        return 0
    # 找到目标值可能的范围
    i = 1
    while i < n and arr[i] <= target:
        i *= 2
    # 在找到的范围内使用二分查找
    return binary_search(arr, target, i//2, min(i, n-1))

def binary_search(arr, target, left, right):
    while left <= right:
        mid = (left + right) // 2
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            left = mid + 1
        else:
            right = mid - 1
    return -1`,
                javascript: `function exponentialSearch(arr, target) {
    const n = arr.length;
    // 检查第一个元素
    if (arr[0] === target) return 0;
    // 找到目标值可能的范围
    let i = 1;
    while (i < n && arr[i] <= target) {
        i *= 2;
    }
    // 在找到的范围内使用二分查找
    return binarySearch(arr, target, i/2, Math.min(i, n-1));
}

function binarySearch(arr, target, left, right) {
    while (left <= right) {
        const mid = Math.floor((left + right) / 2);
        if (arr[mid] === target) {
            return mid;
        } else if (arr[mid] < target) {
            left = mid + 1;
        } else {
            right = mid - 1;
        }
    }
    return -1;
}`
            }
        },
        {
            id: 'hashSearch',
            name: '哈希查找',
            description: '哈希查找是一种基于哈希表的搜索算法，它通过哈希函数将键映射到表中的一个位置，从而实现常数时间的平均查找复杂度。',
            complexity: {
                time: 'O(1)',
                space: 'O(n)',
                bestCase: 'O(1)',
                worstCase: 'O(n)',
                averageCase: 'O(1)'
            },
            tags: ['中等', '哈希表', '高效'],
            difficulty: '中等',
            precondition: '需要额外空间存储哈希表',
            pseudocode: `function createHashTable(array) {
    const hashTable = {};
    for (let i = 0; i < array.length; i++) {
        hashTable[array[i]] = i;
    }
    return hashTable;
}

function hashSearch(hashTable, target) {
    if (hashTable.hasOwnProperty(target)) {
        return hashTable[target];
    }
    return -1;
}`,
            code: {
                python: `def create_hash_table(arr):
    hash_table = {}
    for i in range(len(arr)):
        hash_table[arr[i]] = i
    return hash_table

def hash_search(hash_table, target):
    if target in hash_table:
        return hash_table[target]
    return -1`,
                javascript: `function createHashTable(arr) {
    const hashTable = {};
    for (let i = 0; i < arr.length; i++) {
        hashTable[arr[i]] = i;
    }
    return hashTable;
}

function hashSearch(hashTable, target) {
    if (hashTable.hasOwnProperty(target)) {
        return hashTable[target];
    }
    return -1;
}`
            }
        },
        {
            id: 'linearSearch',
            name: '线性搜索',
            description: '线性搜索是一种简单的搜索算法，它按顺序检查数组中的每个元素，直到找到目标值或遍历完整个数组。',
            complexity: {
                time: 'O(n)',
                space: 'O(1)',
                bestCase: 'O(1)',
                worstCase: 'O(n)',
                averageCase: 'O(n)'
            },
            tags: ['基础', '搜索', '线性时间'],
            difficulty: '简单',
            precondition: '无',
            pseudocode: `function linearSearch(array, target) {
    for (let i = 0; i < array.length; i++) {
        if (array[i] === target) {
            return i;
        }
    }
    return -1;
}`,
            code: {
                python: `def linear_search(arr, target):
    for i in range(len(arr)):
        if arr[i] == target:
            return i
    return -1`,
                javascript: `function linearSearch(arr, target) {
    for (let i = 0; i < arr.length; i++) {
        if (arr[i] === target) {
            return i;
        }
    }
    return -1;
}`
            }
        },
        {
            id: 'binarySearch',
            name: '二分搜索',
            description: '二分搜索是一种高效的搜索算法，它通过反复将搜索区间一分为二，每次比较中间元素与目标值，从而将搜索范围缩小一半。',
            complexity: {
                time: 'O(log n)',
                space: 'O(1)',
                bestCase: 'O(1)',
                worstCase: 'O(log n)',
                averageCase: 'O(log n)'
            },
            tags: ['搜索', '分治', '高效', '有序数组'],
            difficulty: '中等',
            precondition: '数组必须有序',
            pseudocode: `function binarySearch(array, target) {
    let left = 0;
    let right = array.length - 1;
    while (left <= right) {
        const mid = Math.floor((left + right) / 2);
        if (array[mid] === target) {
            return mid;
        } else if (array[mid] < target) {
            left = mid + 1;
        } else {
            right = mid - 1;
        }
    }
    return -1;
}`,
            code: {
                python: `def binary_search(arr, target):
    left, right = 0, len(arr) - 1
    while left <= right:
        mid = (left + right) // 2
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            left = mid + 1
        else:
            right = mid - 1
    return -1`,
                javascript: `function binarySearch(arr, target) {
    let left = 0;
    let right = arr.length - 1;
    while (left <= right) {
        const mid = Math.floor((left + right) / 2);
        if (arr[mid] === target) {
            return mid;
        } else if (arr[mid] < target) {
            left = mid + 1;
        } else {
            right = mid - 1;
        }
    }
    return -1;
}`
            }
        }
    ],
    // 排序算法
    sorting: [
        {
            id: 'mergeSort',
            name: '归并排序',
            description: '归并排序是建立在归并操作上的一种有效的排序算法。该算法是采用分治法的一个非常典型的应用。',
            complexity: {
                time: 'O(n log n)',
                space: 'O(n)',
                bestCase: 'O(n log n)',
                worstCase: 'O(n log n)',
                averageCase: 'O(n log n)'
            },
            tags: ['中等', '比较类', '稳定'],
            difficulty: '中等',
            pseudocode: `function mergeSort(array) {
    if (array.length <= 1) {
        return array;
    }
    const mid = Math.floor(array.length / 2);
    const left = mergeSort(array.slice(0, mid));
    const right = mergeSort(array.slice(mid));
    return merge(left, right);
}

function merge(left, right) {
    const result = [];
    let i = 0;
    let j = 0;
    while (i < left.length && j < right.length) {
        if (left[i] <= right[j]) {
            result.push(left[i]);
            i++;
        } else {
            result.push(right[j]);
            j++;
        }
    }
    return result.concat(left.slice(i)).concat(right.slice(j));
}`,
            code: {
                python: `def merge_sort(arr):
    if len(arr) <= 1:
        return arr
    mid = len(arr) // 2
    left = merge_sort(arr[:mid])
    right = merge_sort(arr[mid:])
    return merge(left, right)

def merge(left, right):
    result = []
    i = j = 0
    while i < len(left) and j < len(right):
        if left[i] <= right[j]:
            result.append(left[i])
            i += 1
        else:
            result.append(right[j])
            j += 1
    result.extend(left[i:])
    result.extend(right[j:])
    return result`,
                javascript: `function mergeSort(arr) {
    if (arr.length <= 1) {
        return arr;
    }
    const mid = Math.floor(arr.length / 2);
    const left = mergeSort(arr.slice(0, mid));
    const right = mergeSort(arr.slice(mid));
    return merge(left, right);
}

function merge(left, right) {
    const result = [];
    let i = 0;
    let j = 0;
    while (i < left.length && j < right.length) {
        if (left[i] <= right[j]) {
            result.push(left[i]);
            i++;
        } else {
            result.push(right[j]);
            j++;
        }
    }
    return result.concat(left.slice(i)).concat(right.slice(j));
}`
            }
        },
        {
            id: 'heapSort',
            name: '堆排序',
            description: '堆排序是指利用堆这种数据结构所设计的一种排序算法。堆是一个近似完全二叉树的结构，并同时满足堆的性质。',
            complexity: {
                time: 'O(n log n)',
                space: 'O(1)',
                bestCase: 'O(n log n)',
                worstCase: 'O(n log n)',
                averageCase: 'O(n log n)'
            },
            tags: ['中等', '比较类', '不稳定'],
            difficulty: '中等',
            code: {
                python: `def heapify(arr, n, i):
    largest = i
    l = 2 * i + 1
    r = 2 * i + 2
    if l < n and arr[i] < arr[l]:
        largest = l
    if r < n and arr[largest] < arr[r]:
        largest = r
    if largest != i:
        arr[i], arr[largest] = arr[largest], arr[i]
        heapify(arr, n, largest)

def heap_sort(arr):
    n = len(arr)
    for i in range(n // 2 - 1, -1, -1):
        heapify(arr, n, i)
    for i in range(n - 1, 0, -1):
        arr[i], arr[0] = arr[0], arr[i]
        heapify(arr, i, 0)
    return arr`,
                javascript: `function heapify(arr, n, i) {
    let largest = i;
    const l = 2 * i + 1;
    const r = 2 * i + 2;
    if (l < n && arr[i] < arr[l]) {
        largest = l;
    }
    if (r < n && arr[largest] < arr[r]) {
        largest = r;
    }
    if (largest !== i) {
        [arr[i], arr[largest]] = [arr[largest], arr[i]];
        heapify(arr, n, largest);
    }
}

function heapSort(arr) {
    const n = arr.length;
    for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
        heapify(arr, n, i);
    }
    for (let i = n - 1; i > 0; i--) {
        [arr[i], arr[0]] = [arr[0], arr[i]];
        heapify(arr, i, 0);
    }
    return arr;
}`
            }
        },
        {
            id: 'insertionSort',
            name: '插入排序',
            description: '插入排序是一种简单直观的排序算法。它的工作原理是通过构建有序序列，对于未排序数据，在已排序序列中从后向前扫描，找到相应位置并插入。',
            complexity: {
                time: 'O(n²)',
                space: 'O(1)',
                bestCase: 'O(n)',
                worstCase: 'O(n²)',
                averageCase: 'O(n²)'
            },
            tags: ['简单', '比较类', '稳定'],
            difficulty: '简单',
            code: {
                python: `def insertion_sort(arr):
    for i in range(1, len(arr)):
        key = arr[i]
        j = i - 1
        while j >= 0 and key < arr[j]:
            arr[j + 1] = arr[j]
            j -= 1
        arr[j + 1] = key
    return arr`,
                javascript: `function insertionSort(arr) {
    for (let i = 1; i < arr.length; i++) {
        const key = arr[i];
        let j = i - 1;
        while (j >= 0 && arr[j] > key) {
            arr[j + 1] = arr[j];
            j--;
        }
        arr[j + 1] = key;
    }
    return arr;
}`
            }
        },
        {
            id: 'selectionSort',
            name: '选择排序',
            description: '选择排序是一种简单直观的排序算法。它的工作原理是每一次从待排序的数据元素中选出最小（或最大）的一个元素，存放在序列的起始位置。',
            complexity: {
                time: 'O(n²)',
                space: 'O(1)',
                bestCase: 'O(n²)',
                worstCase: 'O(n²)',
                averageCase: 'O(n²)'
            },
            tags: ['简单', '比较类', '不稳定'],
            difficulty: '简单',
            code: {
                python: `def selection_sort(arr):
    n = len(arr)
    for i in range(n):
        min_idx = i
        for j in range(i + 1, n):
            if arr[j] < arr[min_idx]:
                min_idx = j
        arr[i], arr[min_idx] = arr[min_idx], arr[i]
    return arr`,
                javascript: `function selectionSort(arr) {
    const n = arr.length;
    for (let i = 0; i < n; i++) {
        let minIdx = i;
        for (let j = i + 1; j < n; j++) {
            if (arr[j] < arr[minIdx]) {
                minIdx = j;
            }
        }
        [arr[i], arr[minIdx]] = [arr[minIdx], arr[i]];
    }
    return arr;
}`
            }
        },
        {
            id: 'bubbleSort',
            name: '冒泡排序',
            description: '冒泡排序是一种简单的排序算法。',
            complexity: {
                time: 'O(n²)',
                space: 'O(1)',
                bestCase: 'O(n)',
                worstCase: 'O(n²)',
                averageCase: 'O(n²)'
            },
            tags: ['基础', '排序', '比较类', '稳定'],
            difficulty: '简单',
            code: {
                python: `def bubble_sort(arr):
    n = len(arr)
    for i in range(n):
        swapped = False
        for j in range(0, n-i-1):
            if arr[j] > arr[j+1]:
                arr[j], arr[j+1] = arr[j+1], arr[j]
                swapped = True
        if not swapped:
            break
    return arr`,
                javascript: `function bubbleSort(arr) {
    const n = arr.length;
    for (let i = 0; i < n; i++) {
        let swapped = false;
        for (let j = 0; j < n - i - 1; j++) {
            if (arr[j] > arr[j + 1]) {
                [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
                swapped = true;
            }
        }
        if (!swapped) break;
    }
    return arr;
}`
            }
        },
        {
            id: 'quickSort',
            name: '快速排序',
            description: '快速排序是一种高效的排序算法。它通过选择一个基准元素，将数组分为两个子数组，递归地排序这些子数组。',
            complexity: {
                time: 'O(n log n)',
                space: 'O(log n)',
                bestCase: 'O(n log n)',
                worstCase: 'O(n²)',
                averageCase: 'O(n log n)'
            },
            tags: ['排序', '分治', '高效', '不稳定'],
            difficulty: '中等',
            code: {
                python: `def quick_sort(arr):
    if len(arr) <= 1:
        return arr
    pivot = arr[len(arr) // 2]
    left = [x for x in arr if x < pivot]
    middle = [x for x in arr if x == pivot]
    right = [x for x in arr if x > pivot]
    return quick_sort(left) + middle + quick_sort(right)`,
                javascript: `function quickSort(arr) {
    if (arr.length <= 1) {
        return arr;
    }
    const pivot = arr[Math.floor(arr.length / 2)];
    const left = [];
    const middle = [];
    const right = [];
    for (let i = 0; i < arr.length; i++) {
        if (arr[i] < pivot) {
            left.push(arr[i]);
        } else if (arr[i] > pivot) {
            right.push(arr[i]);
        } else {
            middle.push(arr[i]);
        }
    }
    return quickSort(left).concat(middle, quickSort(right));
}`
            }
        }
    ]
};

// 导出算法数据
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = algorithmData;
}

// 确保在浏览器环境中可以访问algorithmData
if (typeof window !== 'undefined') {
    window.algorithmData = algorithmData;
}