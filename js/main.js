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
// 渲染文章列表
// ============================
function renderPosts(filter = 'all') {
    const grid = document.getElementById('post-grid');
    if (!grid) return;

    const filtered = filter === 'all'
        ? posts
        : posts.filter(p => p.tag === filter);

    grid.innerHTML = filtered.map(post => `
        <div class="post-card" onclick="location.href='post.html?id=${post.id}'">
            <div class="post-meta">
                <span class="post-tag">${post.tagLabel}</span>
                <span>${post.date}</span>
            </div>
            <h3>${post.title}</h3>
            <p class="post-excerpt">${post.excerpt}</p>
            <span class="read-more">阅读全文 →</span>
        </div>
    `).join('');
}


// ============================
// 渲染文章详情
// ============================
function renderPost() {
    const content = document.getElementById('post-content');
    if (!content) return;

    const urlParams = new URLSearchParams(window.location.search);
    const id = parseInt(urlParams.get('id'));
    const post = posts.find(p => p.id === id);

    if (!post) {
        content.innerHTML = '<h1>文章不存在 😢</h1><p><a href="index.html">返回首页</a></p>';
        return;
    }

    document.title = `${post.title} | 我的博客`;

    content.innerHTML = `
        <h1>${post.title}</h1>
        <div class="post-info">
            <span class="post-tag">${post.tagLabel}</span> · ${post.date}
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
        btn.addEventListener('click', () => {
            btns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
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

    const saved = localStorage.getItem('theme');
    if (saved === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        toggle.textContent = '☀️ 切换浅色模式';
    }

    toggle.addEventListener('click', () => {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        if (isDark) {
            document.documentElement.removeAttribute('data-theme');
            toggle.textContent = '🌙 切换深色模式';
            localStorage.setItem('theme', 'light');
        } else {
            document.documentElement.setAttribute('data-theme', 'dark');
            toggle.textContent = '☀️ 切换浅色模式';
            localStorage.setItem('theme', 'dark');
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