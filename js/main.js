// ============================
// 博客文章数据（你可以随意增删改）
// ============================
const posts = [
    {
        id: 7,
        title: "SterneSite Web | 个人主页",
        excerpt: "摘要待补充...",
        date: "2026-08-08",
        tag: "tech",
        tagLabel: "技术",
        content: `
            <h2>一个偶然的契机</h2>
            <p>  2026年8月，我刚结束CEEE的赛区预选赛，回到家里，百无聊赖下，
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
    {
        id: 1,
        title: "我的第一个网页是怎么做出来的",
        excerpt: "从零开始学习HTML，记录下我搭建第一个网页的全过程，包括遇到的坑和解决思路...",
        date: "2025-08-01",
        tag: "tech",
        tagLabel: "技术",
        content: `
            <h2>起因</h2>
            <p>一直想有一个自己的博客，但总觉得很难。直到有一天发现，其实一个网页就是一个 HTML 文件而已。</p>
            <h2>开始动手</h2>
            <p>我打开了 VSCode，新建了一个 <code>index.html</code>，写下了第一行代码：</p>
            <pre><code>&lt;!DOCTYPE html&gt;
&lt;html&gt;
  &lt;head&gt;
    &lt;title&gt;Hello World&lt;/title&gt;
  &lt;/head&gt;
  &lt;body&gt;
    &lt;h1&gt;我的第一个网页！&lt;/h1&gt;
  &lt;/body&gt;
&lt;/html&gt;</code></pre>
            <p>双击打开浏览器的那一刻，感觉整个世界都亮了。</p>
            <h2>下一步</h2>
            <p>接下来我要学习 CSS 让页面变好看，学 JavaScript 让页面能交互。慢慢来，不着急。</p>
        `
    },
    {
        id: 2,
        title: "用 Cloudflare Pages 免费部署网站",
        excerpt: "手把手教你把本地网页部署到互联网上，让全世界都能访问，完全免费...",
        date: "2025-07-28",
        tag: "tech",
        tagLabel: "技术",
        content: `
            <h2>为什么选 Cloudflare Pages？</h2>
            <p>免费、全球 CDN 加速、支持自定义域名、无限带宽。对于个人博客来说简直是完美选择。</p>
            <h2>部署步骤</h2>
            <p>1. 把代码上传到 GitHub</p>
            <p>2. 在 Cloudflare Pages 连接你的仓库</p>
            <p>3. 点击部署，等待 1 分钟</p>
            <p>4. 获得一个 <code>xxx.pages.dev</code> 的网址</p>
            <h2>自动更新</h2>
            <p>以后每次你 push 代码到 GitHub，网站就会自动重新部署，完全不需要手动操作。</p>
        `
    },
    {
        id: 3,
        title: "周末去了趟图书馆",
        excerpt: "难得周末没有课，一个人去了市图书馆，找了个靠窗的位置，看了一下午的书...",
        date: "2025-07-25",
        tag: "life",
        tagLabel: "生活",
        content: `
            <h2>一个安静的下午</h2>
            <p>阳光透过落地窗洒在桌面上，周围只有翻书的声音。这种安静的感觉，在宿舍里是找不到的。</p>
            <h2>读了什么</h2>
            <p>翻了一本《小王子》，虽然以前看过，但每次读都有新的感受。"真正重要的东西，用眼睛是看不见的。"</p>
            <h2>小确幸</h2>
            <p>回家路上买了一杯冰美式，坐在路边看夕阳。生活嘛，偶尔要慢下来。</p>
        `
    },
    {
        id: 4,
        title: "《代码整洁之道》读书笔记",
        excerpt: "好的代码不仅是给机器看的，更是给人看的。这本书改变了我对写代码的认知...",
        date: "2025-07-20",
        tag: "reading",
        tagLabel: "读书",
        content: `
            <h2>核心观点</h2>
            <p>代码被阅读的次数远多于被编写的次数。所以，写代码时要时刻想着"下一个读这段代码的人"。</p>
            <h2>命名很重要</h2>
            <p>一个好的变量名应该让你不需要注释就能理解它的用途。<code>const d = 5;</code> 远不如 <code>const daysInWeek = 5;</code>。</p>
            <h2>函数要短小</h2>
            <p>一个函数只做一件事。如果你需要写注释来解释一个函数在做什么，那说明这个函数该拆分了。</p>
        `
    },
    {
        id: 5,
        title: "CSS Flexbox 布局完全指南",
        excerpt: "Flexbox 是现代网页布局的核心，这篇文章用图示和实例帮你彻底搞懂它...",
        date: "2025-07-15",
        tag: "tech",
        tagLabel: "技术",
        content: `
            <h2>什么是 Flexbox？</h2>
            <p>Flexbox 是一种一维布局模型，可以轻松实现元素的对齐、分布和排序。</p>
            <h2>基本用法</h2>
            <pre><code>.container {
  display: flex;
  justify-content: center;  /* 水平居中 */
  align-items: center;      /* 垂直居中 */
}</code></pre>
            <h2>常用属性</h2>
            <p><code>flex-direction</code>：排列方向</p>
            <p><code>flex-wrap</code>：是否换行</p>
            <p><code>gap</code>：子元素间距</p>
            <p>掌握这些，90% 的布局问题都能解决。</p>
        `
    },
    {
        id: 6,
        title: "暑假计划：学完前端三件套",
        excerpt: "给自己定了一个暑假目标：扎实掌握 HTML、CSS、JavaScript，并做出三个小项目...",
        date: "2025-07-10",
        tag: "life",
        tagLabel: "生活",
        content: `
            <h2>为什么要学？</h2>
            <p>与其刷短视频浪费时间，不如学点真本事。前端开发入门门槛不高，但上限很高。</p>
            <h2>计划安排</h2>
            <p>7月：HTML + CSS 基础，做出静态页面</p>
            <p>8月：JavaScript 核心语法，实现交互功能</p>
            <p>9月开学前：完成一个完整的小项目</p>
            <h2>加油 💪</h2>
            <p>每天学两小时，坚持就是胜利。</p>
        `
    }
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