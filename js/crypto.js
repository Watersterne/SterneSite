// 加密解密工具交互逻辑
(function () {
    'use strict';
    const inputEl = document.getElementById('crypto-input');
    const modeEl = document.getElementById('crypto-mode');
    const runBtn = document.getElementById('crypto-run');
    const copyBtn = document.getElementById('crypto-copy');
    const resultEl = document.getElementById('crypto-result');
    let lastOutput = '';

    // UTF-8 安全的 Base64 编解码
    function b64encode(s) {
        const bytes = new TextEncoder().encode(s);
        let bin = '';
        bytes.forEach(b => bin += String.fromCharCode(b));
        return btoa(bin);
    }
    function b64decode(s) {
        const bin = atob(s.trim());
        const bytes = Uint8Array.from(bin, c => c.charCodeAt(0));
        return new TextDecoder().decode(bytes);
    }

    async function run() {
        const text = inputEl.value;
        const mode = modeEl.value;
        resultEl.innerHTML = '<span class="muted">处理中...</span>';
        try {
            let out;
            switch (mode) {
                case 'b64enc': out = b64encode(text); break;
                case 'b64dec': out = b64decode(text); break;
                case 'urlenc': out = encodeURIComponent(text); break;
                case 'urldec': out = decodeURIComponent(text); break;
                case 'md5': out = md5(text); break;
                case 'sha1': out = sha1(text); break;
                case 'sha256': out = sha256(text); break;
                default: out = '';
            }
            lastOutput = out;
            resultEl.textContent = out;
        } catch (e) {
            lastOutput = '';
            resultEl.innerHTML = '<span class="muted" style="color:#e05252;">处理失败：输入格式不符合该操作要求</span>';
        }
    }

    runBtn.addEventListener('click', run);

    copyBtn.addEventListener('click', async () => {
        if (!lastOutput) return;
        try {
            await navigator.clipboard.writeText(lastOutput);
            copyBtn.textContent = '已复制 ✓';
            setTimeout(() => copyBtn.textContent = '复制结果', 1500);
        } catch (e) {
            copyBtn.textContent = '复制失败';
            setTimeout(() => copyBtn.textContent = '复制结果', 1500);
        }
    });
})();
