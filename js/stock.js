// 上证指数行情：双数据源容错
// 主源：腾讯财经（fetch，CORS 开放）  备源：东方财富（JSONP）
(function () {
    'use strict';

    const TX_QUOTE = 'https://qt.gtimg.cn/q=sh000001';
    const TX_KLINE = 'https://web.ifzq.gtimg.cn/appstock/app/fqkline/get?param=sh000001,day,,,N,qfq';
    const EM_QUOTE = 'https://push2.eastmoney.com/api/qt/stock/get?secid=1.000001&fltt=2&fields=f43,f44,f45,f46,f47,f48,f57,f58,f169,f170';
    const EM_KLINE = 'https://push2his.eastmoney.com/api/qt/stock/kline/get?secid=1.000001&klt=101&fqt=1&end=20500101&fields1=f1,f2,f3,f4,f5,f6&fields2=f51,f52,f53,f54,f55,f56,f57,f58,f59,f60,f61';

    let klineData = [];     // [{date, close, pct}]
    let currentRange = 30;

    // ---------- 请求工具 ----------
    let jsonpSeq = 0;
    function jsonp(url) {
        return new Promise((resolve, reject) => {
            const cbName = '__stock_cb_' + (++jsonpSeq) + '_' + Date.now();
            const script = document.createElement('script');
            const timer = setTimeout(() => cleanup(new Error('timeout')), 8000);
            function cleanup(err) {
                clearTimeout(timer);
                delete window[cbName];
                if (script.parentNode) script.parentNode.removeChild(script);
                if (err) reject(err);
            }
            window[cbName] = (data) => { cleanup(null); resolve(data); };
            script.src = url + '&cb=' + cbName;
            script.onerror = () => cleanup(new Error('network'));
            document.head.appendChild(script);
        });
    }

    async function fetchText(url) {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), 8000);
        try {
            const res = await fetch(url, { signal: ctrl.signal });
            if (!res.ok) throw new Error('http ' + res.status);
            return await res.text();
        } finally {
            clearTimeout(timer);
        }
    }

    // 腾讯接口为 GBK 编码，显式按 GBK 解码，保证中文名称不乱码
    async function fetchGbk(url) {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), 8000);
        try {
            const res = await fetch(url, { signal: ctrl.signal });
            if (!res.ok) throw new Error('http ' + res.status);
            const buf = await res.arrayBuffer();
            return new TextDecoder('gbk').decode(buf);
        } finally {
            clearTimeout(timer);
        }
    }

    // ---------- 主源：腾讯 ----------
    async function tencentQuote() {
        const text = await fetchGbk(TX_QUOTE);
        const m = text.split('~');
        if (m.length < 46) throw new Error('bad tencent quote');
        const price = parseFloat(m[3]);
        if (isNaN(price)) throw new Error('bad price');
        const ts = m[30] || '';
        return {
            name: m[1],
            price: price,
            chg: parseFloat(m[31]),
            pct: parseFloat(m[32]),
            open: parseFloat(m[5]),
            prev: parseFloat(m[4]),
            high: parseFloat(m[33]),
            low: parseFloat(m[34]),
            vol: parseFloat(m[6]),          // 手
            amt: parseFloat(m[37]) * 1e4,   // 万 -> 元
            quoteTime: ts ? ts.slice(0, 4) + '-' + ts.slice(4, 6) + '-' + ts.slice(6, 8) + ' ' +
                ts.slice(8, 10) + ':' + ts.slice(10, 12) + ':' + ts.slice(12, 14) : ''
        };
    }

    async function tencentKline(n) {
        const text = await fetchText(TX_KLINE.replace('N', n));
        const json = JSON.parse(text);
        const node = json.data && json.data.sh000001;
        const arr = node && (node.day || node.qfqday);
        if (!arr || !arr.length) throw new Error('bad tencent kline');
        const pts = arr.map(p => ({ date: p[0], close: parseFloat(p[2]) }));
        for (let i = 0; i < pts.length; i++) {
            const prev = i ? pts[i - 1].close : arr[i][1];
            pts[i].pct = prev ? (pts[i].close - prev) / prev * 100 : 0;
        }
        return pts;
    }

    // ---------- 备源：东方财富 JSONP ----------
    async function emQuote() {
        const data = await jsonp(EM_QUOTE);
        if (!data || data.rc !== 0 || !data.data) throw new Error('bad em quote');
        const d = data.data;
        return {
            name: d.f58, price: d.f43, chg: d.f169, pct: d.f170,
            open: d.f46, prev: d.f43 - d.f169, high: d.f44, low: d.f45,
            vol: d.f47, amt: d.f48, quoteTime: ''
        };
    }

    async function emKline(n) {
        const data = await jsonp(EM_KLINE + '&lmt=' + n);
        if (!data || data.rc !== 0 || !data.data || !data.data.klines) throw new Error('bad em kline');
        return data.data.klines.map(line => {
            const p = line.split(',');
            return { date: p[0], close: parseFloat(p[2]), pct: parseFloat(p[8]) };
        });
    }

    async function loadQuote() {
        let q;
        try { q = await tencentQuote(); } catch (e) { q = await emQuote(); }
        const up = q.chg >= 0;
        const cls = up ? 'stock-up' : 'stock-down';

        document.getElementById('stock-name').textContent = q.name || '上证指数';
        const priceEl = document.getElementById('stock-price');
        const changeEl = document.getElementById('stock-change');
        priceEl.textContent = fmt2(q.price);
        changeEl.textContent = (up ? '+' : '') + fmt2(q.chg) + '  ' + (up ? '+' : '') + fmt2(q.pct) + '%';
        priceEl.className = 'stock-price ' + cls;
        changeEl.className = 'stock-change ' + cls;

        document.getElementById('stat-open').textContent = fmt2(q.open);
        document.getElementById('stat-prev').textContent = fmt2(q.prev);
        document.getElementById('stat-high').textContent = fmt2(q.high);
        document.getElementById('stat-low').textContent = fmt2(q.low);
        document.getElementById('stat-vol').textContent = fmtVol(q.vol);
        document.getElementById('stat-amt').textContent = fmtAmt(q.amt);

        const now = new Date();
        const pad = n => String(n).padStart(2, '0');
        document.getElementById('stock-time').textContent =
            (q.quoteTime ? '行情时间 ' + q.quoteTime + ' · ' : '') +
            '本机刷新 ' + pad(now.getHours()) + ':' + pad(now.getMinutes()) + ':' + pad(now.getSeconds());
    }

    async function loadKline() {
        let pts;
        try { pts = await tencentKline(currentRange); } catch (e) { pts = await emKline(currentRange); }
        klineData = pts;
        drawChart();
    }

    // ---------- 格式化 ----------
    const fmt2 = v => (v == null || isNaN(v)) ? '--' : Number(v).toFixed(2);
    function fmtVol(hands) {
        if (hands == null || isNaN(hands)) return '--';
        if (hands >= 1e8) return (hands / 1e8).toFixed(2) + ' 亿手';
        return (hands / 1e4).toFixed(0) + ' 万手';
    }
    function fmtAmt(yuan) {
        if (yuan == null || isNaN(yuan)) return '--';
        if (yuan >= 1e12) return (yuan / 1e12).toFixed(2) + ' 万亿';
        if (yuan >= 1e8) return (yuan / 1e8).toFixed(0) + ' 亿';
        return yuan.toFixed(0) + ' 元';
    }
    function cssVar(name) {
        return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    }

    // ---------- 走势图 ----------
    const canvas = document.getElementById('stock-chart');
    const ctx = canvas.getContext('2d');
    let hoverIndex = -1;

    function drawChart() {
        const points = klineData;
        if (!points.length || points.length < 2) return;

        const dpr = window.devicePixelRatio || 1;
        const cssW = canvas.clientWidth;
        const cssH = canvas.clientHeight;
        canvas.width = cssW * dpr;
        canvas.height = cssH * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, cssW, cssH);

        const padL = 12, padR = 64, padT = 18, padB = 30;
        const w = cssW - padL - padR;
        const h = cssH - padT - padB;

        const closes = points.map(p => p.close);
        let min = Math.min.apply(null, closes), max = Math.max.apply(null, closes);
        if (min === max) { min -= 1; max += 1; }
        const span = max - min;
        min -= span * 0.08; max += span * 0.08;

        const x = i => padL + (i / (points.length - 1)) * w;
        const y = v => padT + (1 - (v - min) / (max - min)) * h;

        const gridColor = cssVar('--border');
        const textColor = cssVar('--text-secondary');
        const up = points[points.length - 1].close >= points[0].close;
        const lineColor = up ? '#e05252' : '#22a06b';

        ctx.font = '11px system-ui, sans-serif';
        ctx.textBaseline = 'middle';
        for (let i = 0; i <= 4; i++) {
            const v = min + ((max - min) * i) / 4;
            const yy = y(v);
            ctx.strokeStyle = gridColor;
            ctx.lineWidth = 1;
            ctx.setLineDash([4, 4]);
            ctx.beginPath();
            ctx.moveTo(padL, yy);
            ctx.lineTo(padL + w, yy);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.fillStyle = textColor;
            ctx.textAlign = 'left';
            ctx.fillText(v.toFixed(2), padL + w + 8, yy);
        }

        ctx.textAlign = 'center';
        ctx.fillStyle = textColor;
        [0, Math.floor((points.length - 1) / 2), points.length - 1].forEach(i => {
            ctx.fillText(points[i].date.slice(5), x(i), padT + h + 14);
        });

        const grad = ctx.createLinearGradient(0, padT, 0, padT + h);
        grad.addColorStop(0, up ? 'rgba(224,82,82,0.28)' : 'rgba(34,160,107,0.28)');
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.beginPath();
        ctx.moveTo(x(0), y(points[0].close));
        for (let i = 1; i < points.length; i++) ctx.lineTo(x(i), y(points[i].close));
        ctx.lineTo(x(points.length - 1), padT + h);
        ctx.lineTo(x(0), padT + h);
        ctx.closePath();
        ctx.fillStyle = grad;
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(x(0), y(points[0].close));
        for (let i = 1; i < points.length; i++) ctx.lineTo(x(i), y(points[i].close));
        ctx.strokeStyle = lineColor;
        ctx.lineWidth = 2;
        ctx.lineJoin = 'round';
        ctx.stroke();

        if (hoverIndex >= 0 && hoverIndex < points.length) {
            const hx = x(hoverIndex), hy = y(points[hoverIndex].close);
            ctx.strokeStyle = textColor;
            ctx.setLineDash([3, 3]);
            ctx.beginPath();
            ctx.moveTo(hx, padT);
            ctx.lineTo(hx, padT + h);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.beginPath();
            ctx.arc(hx, hy, 4, 0, Math.PI * 2);
            ctx.fillStyle = lineColor;
            ctx.fill();
            ctx.strokeStyle = cssVar('--card-bg');
            ctx.lineWidth = 2;
            ctx.stroke();

            const p = points[hoverIndex];
            const label = p.date + '  ' + p.close.toFixed(2) + '  ' + (p.pct >= 0 ? '+' : '') + p.pct.toFixed(2) + '%';
            ctx.font = '12px system-ui, sans-serif';
            const tw = ctx.measureText(label).width + 16;
            let bx = hx + 10;
            if (bx + tw > padL + w) bx = hx - tw - 10;
            const by = Math.max(padT, hy - 30);
            ctx.fillStyle = cssVar('--text');
            ctx.globalAlpha = 0.92;
            ctx.beginPath();
            if (ctx.roundRect) ctx.roundRect(bx, by, tw, 24, 6);
            else ctx.rect(bx, by, tw, 24);
            ctx.fill();
            ctx.globalAlpha = 1;
            ctx.fillStyle = cssVar('--bg');
            ctx.textAlign = 'left';
            ctx.fillText(label, bx + 8, by + 12);
        }
    }

    canvas.addEventListener('mousemove', (e) => {
        if (!klineData.length) return;
        const rect = canvas.getBoundingClientRect();
        const px = e.clientX - rect.left;
        const padL = 12, padR = 64;
        const w = rect.width - padL - padR;
        const idx = Math.round(((px - padL) / w) * (klineData.length - 1));
        const clamped = Math.max(0, Math.min(klineData.length - 1, idx));
        if (clamped !== hoverIndex) {
            hoverIndex = clamped;
            drawChart();
        }
    });
    canvas.addEventListener('mouseleave', () => {
        hoverIndex = -1;
        drawChart();
    });

    window.addEventListener('resize', drawChart);

    // 主题切换时重绘
    new MutationObserver(drawChart).observe(document.documentElement, {
        attributes: true, attributeFilter: ['data-theme']
    });

    // 周期切换
    document.querySelectorAll('.chart-tab').forEach(btn => {
        btn.addEventListener('click', async () => {
            document.querySelectorAll('.chart-tab').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentRange = parseInt(btn.dataset.range, 10);
            hoverIndex = -1;
            try { await loadKline(); } catch (e) { /* 保持旧图 */ }
        });
    });

    // ---------- 启动 ----------
    async function init() {
        try {
            await Promise.all([loadQuote(), loadKline()]);
            document.getElementById('stock-loading').style.display = 'none';
            document.getElementById('stock-body').style.display = 'block';
            setInterval(() => { loadQuote().catch(() => {}); }, 30000);
        } catch (e) {
            document.getElementById('stock-loading').style.display = 'none';
            document.getElementById('stock-error').style.display = 'block';
        }
    }

    init();
})();
