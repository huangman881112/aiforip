// DOM 加载完成后执行 - 版本更新
console.log('main.js loaded successfully');
console.log('DOMContentLoaded event listener started');
document.addEventListener('DOMContentLoaded', function() {
    // 移动端菜单切换
    const menuBtn = document.getElementById('menuBtn');
    const mobileMenu = document.getElementById('mobileMenu');

    if (menuBtn && mobileMenu) {
        menuBtn.addEventListener('click', function() {
            mobileMenu.classList.toggle('hidden');
        });

        // 点击菜单项后关闭菜单
        const mobileMenuLinks = mobileMenu.querySelectorAll('a');
        mobileMenuLinks.forEach(link => {
            link.addEventListener('click', function() {
                mobileMenu.classList.add('hidden');
            });
        });
    }

    // 页面滚动动画
    const fadeElements = document.querySelectorAll('.card, .hero, section h2');

    function checkFade() {
        fadeElements.forEach(element => {
            const elementTop = element.getBoundingClientRect().top;
            const windowHeight = window.innerHeight;

            if (elementTop < windowHeight - 100) {
                element.classList.add('fade-in');
            }
        });
    }

    // 初始检查
    checkFade();

    // 滚动时检查
    window.addEventListener('scroll', checkFade);

    // 平滑滚动
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;

            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });

    // 搜索功能
    const searchBox = document.querySelector('.search-box');
    if (searchBox) {
        searchBox.addEventListener('submit', function(e) {
            e.preventDefault();
            const searchTerm = this.querySelector('input').value.trim().toLowerCase();
            if (searchTerm) {
                // 在实际应用中，这里会发起搜索请求
                alert(`搜索: ${searchTerm}`);
            }
        });
    }

    // 算法详情页的标签点击功能
    const algorithmTags = document.querySelectorAll('.algorithm-tag');
    algorithmTags.forEach(tag => {
        tag.addEventListener('click', function() {
            const tagText = this.textContent;
            alert(`查看所有${tagText}难度的算法`);
        });
    });

    // 回到顶部按钮
    const backToTopButton = document.createElement('button');
    backToTopButton.innerHTML = '<i class="fas fa-arrow-up"></i>';
    backToTopButton.className = 'fixed bottom-6 right-6 bg-blue-600 text-white p-3 rounded-full shadow-lg opacity-0 invisible transition-all duration-300 hover:bg-blue-700';
    document.body.appendChild(backToTopButton);

    window.addEventListener('scroll', function() {
        if (window.pageYOffset > 300) {
            backToTopButton.classList.remove('opacity-0', 'invisible');
            backToTopButton.classList.add('opacity-100', 'visible');
        } else {
            backToTopButton.classList.remove('opacity-100', 'visible');
            backToTopButton.classList.add('opacity-0', 'invisible');
        }
    });

    backToTopButton.addEventListener('click', function() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
});

// 算法可视化示例函数
function visualizeSorting(algorithm) {
    // 这里是排序算法可视化的示例实现
    // 在实际应用中，会根据选择的算法类型生成不同的可视化效果
    console.log('Visualizing:', algorithm);

    // 示例: 创建一些随机数据
    const data = Array.from({length: 20}, () => Math.floor(Math.random() * 100));
    console.log('Data:', data);

    // 这里应该有具体的可视化逻辑
    // 例如，使用Canvas或DOM元素展示排序过程
}

// 算法复杂度计算函数
function calculateComplexity(algorithm, n) {
    // 示例函数: 计算算法的时间复杂度近似值
    // 在实际应用中，这可能是一个更复杂的分析工具
    switch(algorithm) {
        case 'bubbleSort':
            return n * n; // O(n²)
        case 'quickSort':
            return n * Math.log2(n); // O(n log n)
        case 'binarySearch':
            return Math.log2(n); // O(log n)
        default:
            return n; // O(n)
    }
}