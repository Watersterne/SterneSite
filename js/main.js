// ============================
// 博客文章数据（你可以随意增删改）
// ============================
const posts = [
    {
        id: 1,
        title: "SterneSite Web | 个人主页",
        excerpt: "A Personal Chance......",
        date: "2026-08-08",
        tag: "tech",
        tagLabel: "技术",
        content: `
            <h2>一个偶然的契机</h2>
            <p>  2026年8月，我刚结束NUEDC的赛区预选赛，回到家里，百无聊赖下，
            开始回想起自己年少的时候用凡科建站自己搭建阅读网站的事情。
            </p>
            <p>  正好有闻Cloudflare的pages托管服务，搭配上github的仓库，简直完美。于是就马上搭配着Agent，开始建站。不得不说，AI发展太快啦QWQ
            </p>
            <p>  以后这里就是我的个人主页了，有什么新鲜事，或者技术，抑或是个人的学术见解，我都会在这里发布。也期待我这个小主页，在互联网的一个默默无闻的小角落里，尽到它应尽的义务和责任。
            </p>
            <p>  (ゝ∀･)
            </p>
            <p>  2026.08.08    WangQuan
            </p>
        `
    },
];


// ============================
// 工具函数
// ============================
function storageGet(key) {
    try {
        return localStorage.getItem(key);
    } catch (e) {
        return null; // 隐私模式下 localStorage 不可用
    }
}

function storageSet(key, value) {
    try {
        localStorage.setItem(key, value);
    } catch (e) { /* 忽略写入失败 */ }
}

function escapeHtml(text) {
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}


// ============================
// 渲染文章列表
// ============================
function renderPosts(filter = 'all') {
    const grid = document.getElementById('post-grid');
    if (!grid) return;

    const filtered = (filter === 'all' ? posts : posts.filter(p => p.tag === filter))
        .slice()
        .sort((a, b) => b.date.localeCompare(a.date)); // 按日期倒序，不依赖数组插入顺序

    if (filtered.length === 0) {
        grid.innerHTML = '<p class="post-empty">该分类暂无文章</p>';
        return;
    }

    grid.innerHTML = filtered.map(post => `
        <a class="post-card" href="post.html?id=${post.id}">
            <div class="post-meta">
                <span class="post-tag">${escapeHtml(post.tagLabel)}</span>
                <span>${escapeHtml(post.date)}</span>
            </div>
            <h3>${escapeHtml(post.title)}</h3>
            <p class="post-excerpt">${escapeHtml(post.excerpt)}</p>
            <span class="read-more">阅读全文 →</span>
        </a>
    `).join('');
}


// ============================
// 渲染文章详情
// ============================
function renderPost() {
    const content = document.getElementById('post-content');
    if (!content) return;

    const urlParams = new URLSearchParams(window.location.search);
    const rawId = urlParams.get('id');

    if (rawId === null || rawId.trim() === '') {
        document.title = '文章详情 | 星网';
        content.innerHTML = '<h1>缺少文章参数</h1><p>请从 <a href="posts.html">文章列表</a> 选择一篇文章阅读。</p>';
        return;
    }

    const id = parseInt(rawId, 10);
    const post = Number.isInteger(id) ? posts.find(p => p.id === id) : undefined;

    if (!post) {
        document.title = '文章不存在 | 星网';
        content.innerHTML = '<h1>文章不存在 😢</h1><p>没有找到这篇文章，去 <a href="posts.html">文章列表</a> 看看吧。</p>';
        return;
    }

    document.title = `${post.title} | 星网`;

    content.innerHTML = `
        <h1>${escapeHtml(post.title)}</h1>
        <div class="post-info">
            <span class="post-tag">${escapeHtml(post.tagLabel)}</span> · ${escapeHtml(post.date)}
        </div>
        <div class="post-body">
            ${post.content}
        </div>
    `;
}


// ============================
// 标签筛选
// ============================
function initFilters() {
    const btns = document.querySelectorAll('.filter-btn');
    btns.forEach(btn => {
        btn.setAttribute('aria-pressed', btn.classList.contains('active') ? 'true' : 'false');
        btn.addEventListener('click', () => {
            btns.forEach(b => {
                b.classList.remove('active');
                b.setAttribute('aria-pressed', 'false');
            });
            btn.classList.add('active');
            btn.setAttribute('aria-pressed', 'true');
            renderPosts(btn.dataset.tag);
        });
    });
}


// ============================
// 暗色模式切换
// ============================
function initTheme() {
    const toggle = document.getElementById('theme-toggle');
    if (!toggle) return;

    if (storageGet('theme') === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        toggle.textContent = '☀️ 切换浅色模式';
    }

    toggle.addEventListener('click', () => {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        if (isDark) {
            document.documentElement.removeAttribute('data-theme');
            toggle.textContent = '🌙 切换深色模式';
            storageSet('theme', 'light');
        } else {
            document.documentElement.setAttribute('data-theme', 'dark');
            toggle.textContent = '☀️ 切换浅色模式';
            storageSet('theme', 'dark');
        }
    });
}


// ============================
// 初始化
// ============================
document.addEventListener('DOMContentLoaded', () => {
    renderPosts();
    renderPost();
    initFilters();
    initTheme();
});