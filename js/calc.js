// 科学计算器：tokenizer + 递归下降解析，不使用 eval
(function () {
    'use strict';

    const exprEl = document.getElementById('calc-expr');
    const valueEl = document.getElementById('calc-value');
    const angleEl = document.getElementById('calc-angle');
    const keysEl = document.getElementById('calc-keys');

    let tokens = [];        // 当前输入的 token 序列
    let lastResult = 0;     // Ans
    let justEvaluated = false;

    const FUNCS = ['sin', 'cos', 'tan', 'ln', 'log', 'sqrt', 'abs', 'exp'];
    const CONSTS = { 'π': Math.PI, 'e': Math.E };

    // ---------- 按键布局 ----------
    const KEYS = [
        ['sin', 'fn'], ['cos', 'fn'], ['tan', 'fn'], ['ln', 'fn'], ['log', 'fn'],
        ['(', 'op'], [')', 'op'], ['√', 'fn'], ['^', 'op'], ['π', 'num'],
        ['e', 'num'], ['abs', 'fn'], ['exp', 'fn'], ['%', 'op'], ['C', 'ctrl'],
        ['7', 'num'], ['8', 'num'], ['9', 'num'], ['÷', 'op'], ['⌫', 'ctrl'],
        ['4', 'num'], ['5', 'num'], ['6', 'num'], ['×', 'op'], ['±', 'ctrl'],
        ['1', 'num'], ['2', 'num'], ['3', 'num'], ['−', 'op'], ['Ans', 'num'],
        ['0', 'num'], ['.', 'num'], ['+', 'op'], ['=', 'eq', 'wide']
    ];

    KEYS.forEach(([label, cls, extra]) => {
        const btn = document.createElement('button');
        btn.className = 'calc-key ' + cls + (extra ? ' ' + extra : '');
        btn.textContent = label;
        btn.addEventListener('click', () => press(label));
        keysEl.appendChild(btn);
    });

    // ---------- 按键行为 ----------
    function press(label) {
        valueEl.classList.remove('calc-error');
        if (label === 'C') { tokens = []; justEvaluated = false; render(); return; }
        if (label === '⌫') { tokens.pop(); justEvaluated = false; render(); return; }
        if (label === '±') { negateLast(); render(); return; }
        if (label === '=') { evaluate(); return; }

        if (justEvaluated) {
            // 计算完后输入数字则重新开始，输入运算符则继续
            if (isValueToken(label)) { tokens = []; }
            justEvaluated = false;
        }

        if (label === '√') { tokens.push({ t: 'fn', v: 'sqrt' }); }
        else if (FUNCS.includes(label)) { tokens.push({ t: 'fn', v: label }); }
        else if (CONSTS[label] !== undefined) { tokens.push({ t: 'num', v: String(CONSTS[label]) }); }
        else if (label === 'Ans') { tokens.push({ t: 'num', v: String(lastResult) }); }
        else if (label === '÷') { tokens.push({ t: 'op', v: '/' }); }
        else if (label === '×') { tokens.push({ t: 'op', v: '*' }); }
        else if (label === '−') { tokens.push({ t: 'op', v: '-' }); }
        else if (label === '+') { tokens.push({ t: 'op', v: '+' }); }
        else if (label === '−') { tokens.push({ t: 'op', v: '-' }); }
        else if ('%^('.includes(label)) { tokens.push({ t: 'op', v: label }); }
        else if (label === ')') { tokens.push({ t: 'op', v: ')' }); }
        else { pushDigit(label); }
        render();
    }

    function isValueToken(label) {
        return /[0-9.]/.test(label) || CONSTS[label] !== undefined || label === 'Ans' || FUNCS.includes(label) || label === '√' || label === '(';
    }

    function pushDigit(label) {
        const last = tokens[tokens.length - 1];
        if (last && last.t === 'num' && !last.fromResult) {
            if (label === '.' && last.v.includes('.')) return;
            last.v += label;
        } else {
            tokens.push({ t: 'num', v: label === '.' ? '0.' : label });
        }
    }

    function negateLast() {
        // 给最后一个数字取反
        for (let i = tokens.length - 1; i >= 0; i--) {
            if (tokens[i].t === 'num') {
                tokens[i].v = tokens[i].v.startsWith('-') ? tokens[i].v.slice(1) : '-' + tokens[i].v;
                return;
            }
            if (tokens[i].t === 'op' && tokens[i].v === ')') continue;
            break;
        }
    }

    // ---------- 显示 ----------
    function render() {
        const text = tokens.map(tok => {
            if (tok.t === 'fn') return (tok.v === 'sqrt' ? '√' : tok.v) + '(';
            return tok.v;
        }).join(' ');
        exprEl.innerHTML = text ? escapeHtml(text) : '&nbsp;';
        // 实时尝试求值
        if (tokens.length) {
            try {
                const v = parseAll(tokenSnapshot());
                valueEl.textContent = fmt(v);
                valueEl.classList.remove('calc-error');
            } catch (e) { /* 输入未完成，保持原显示 */ }
        } else {
            valueEl.textContent = '0';
        }
    }

    function evaluate() {
        if (!tokens.length) return;
        try {
            const v = parseAll(tokenSnapshot());
            if (!isFinite(v)) throw new Error('div0');
            lastResult = v;
            exprEl.textContent = tokens.map(tok => tok.t === 'fn' ? (tok.v === 'sqrt' ? '√(' : tok.v + '(') : tok.v).join(' ') + ' =';
            valueEl.textContent = fmt(v);
            tokens = [{ t: 'num', v: String(v), fromResult: true }];
            justEvaluated = true;
        } catch (e) {
            valueEl.textContent = '错误';
            valueEl.classList.add('calc-error');
        }
    }

    function tokenSnapshot() {
        // 去掉末尾不完整的运算符/左括号
        const snap = tokens.slice();
        while (snap.length) {
            const last = snap[snap.length - 1];
            if ((last.t === 'op' && '+-*/%^'.includes(last.v)) || (last.t === 'fn') || (last.t === 'op' && last.v === '(')) snap.pop();
            else break;
        }
        return snap;
    }

    // ---------- 递归下降解析 ----------
    function parseAll(toks) {
        let pos = 0;

        function peek() { return toks[pos]; }
        function next() { return toks[pos++]; }

        function parseExpr() {
            let v = parseTerm();
            while (peek() && peek().t === 'op' && (peek().v === '+' || peek().v === '-')) {
                const op = next().v;
                const r = parseTerm();
                v = op === '+' ? v + r : v - r;
            }
            return v;
        }

        function parseTerm() {
            let v = parseFactor();
            while (peek() && peek().t === 'op' && (peek().v === '*' || peek().v === '/' || peek().v === '%')) {
                const op = next().v;
                const r = parseFactor();
                if (op === '*') v *= r;
                else if (op === '/') v /= r;
                else v %= r;
            }
            return v;
        }

        function parseFactor() {
            const tk = peek();
            if (tk && tk.t === 'op' && (tk.v === '-' || tk.v === '+')) {
                next();
                const v = parseFactor();
                return tk.v === '-' ? -v : v;
            }
            return parsePower();
        }

        function parsePower() {
            let base = parseAtom();
            if (peek() && peek().t === 'op' && peek().v === '^') {
                next();
                const exp = parseFactor(); // 右结合
                base = Math.pow(base, exp);
            }
            return base;
        }

        function parseAtom() {
            const tk = next();
            if (!tk) throw new Error('unexpected end');
            if (tk.t === 'num') return parseFloat(tk.v);
            if (tk.t === 'fn') {
                expectOpen();
                const v = parseExpr();
                expectClose();
                return applyFn(tk.v, v);
            }
            if (tk.t === 'op' && tk.v === '(') {
                const v = parseExpr();
                expectClose();
                return v;
            }
            throw new Error('unexpected token');
        }

        function expectOpen() {
            const tk = next();
            // 函数后必须跟 (，渲染时已隐式添加；若用户数据里没有则容错
            if (!tk || !(tk.t === 'op' && tk.v === '(')) { pos--; }
        }

        function expectClose() {
            const tk = next();
            if (!tk || !(tk.t === 'op' && tk.v === ')')) { pos--; }
        }

        const v = parseExpr();
        if (pos < toks.length) throw new Error('trailing tokens');
        return v;
    }

    function applyFn(name, v) {
        const deg = angleEl.value === 'deg';
        const toRad = x => deg ? x * Math.PI / 180 : x;
        const fromRad = x => deg ? x * 180 / Math.PI : x;
        switch (name) {
            case 'sin': return Math.sin(toRad(v));
            case 'cos': return Math.cos(toRad(v));
            case 'tan': return Math.tan(toRad(v));
            case 'ln': return Math.log(v);
            case 'log': return Math.log10(v);
            case 'sqrt': return Math.sqrt(v);
            case 'abs': return Math.abs(v);
            case 'exp': return Math.exp(v);
            default: throw new Error('unknown fn');
        }
    }

    // ---------- 键盘支持 ----------
    document.addEventListener('keydown', (e) => {
        const k = e.key;
        if (/^[0-9.]$/.test(k)) { press(k); }
        else if (k === '+') press('+');
        else if (k === '-') press('−');
        else if (k === '*') press('×');
        else if (k === '/') { e.preventDefault(); press('÷'); }
        else if (k === '(' || k === ')' || k === '%' || k === '^') press(k);
        else if (k === 'Enter' || k === '=') { e.preventDefault(); press('='); }
        else if (k === 'Backspace') press('⌫');
        else if (k === 'Escape') press('C');
    });

    angleEl.addEventListener('change', render);

    // ---------- 工具 ----------
    function fmt(v) {
        if (Math.abs(v) >= 1e15 || (Math.abs(v) < 1e-9 && v !== 0)) return v.toExponential(8);
        const s = parseFloat(v.toPrecision(12)).toString();
        return s;
    }

    function escapeHtml(s) {
        return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    render();
})();
