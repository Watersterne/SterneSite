# -*- coding: utf-8 -*-
"""
一键新建博客文章
在 js/main.js 的 posts 数组顶部插入一篇新文章骨架，
标题/摘要/分类通过交互输入，id 与日期自动生成。
"""
import os
import re
import sys
import datetime

# 本脚本位于 scripts/ 目录下，项目根目录为上两级
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
JS_PATH = os.path.join(ROOT, 'js', 'main.js')

TAGS = {
    '1': ('tech', '技术'),
    '2': ('life', '生活'),
    '3': ('reading', '读书'),
}


def escape_js(text):
    """转义特殊字符，保证放进 JS 双引号字符串里不破坏语法"""
    return (text.replace('\\', '\\\\')
                .replace('"', '\\"')
                .replace('\r', '')
                .replace('\n', ' ')
                .strip())


def main():
    try:
        with open(JS_PATH, 'rb') as f:
            raw = f.read()
    except FileNotFoundError:
        print('[错误] 找不到 js/main.js，请确认脚本放在博客根目录。')
        return 1

    text = raw.decode('utf-8')

    marker = 'const posts = ['
    pos = text.find(marker)
    if pos == -1:
        print('[错误] 在 js/main.js 里找不到 posts 数组，文件结构可能被改动过。')
        return 1

    # 保持与原文件一致的换行风格
    nl = '\r\n' if raw.count(b'\r\n') * 2 > raw.count(b'\n') else '\n'

    ids = [int(x) for x in re.findall(r'(?m)^\s*id:\s*(\d+)\s*,', text)]
    new_id = max(ids) + 1 if ids else 1

    print('=' * 44)
    print('  一键新建文章（SterneSite）')
    print('=' * 44)
    print()

    title = ''
    while not title:
        title = input('输入文章标题（必填）: ').strip()

    excerpt = input('输入文章摘要（可留空，之后再补）: ').strip()
    if not excerpt:
        excerpt = '摘要待补充...'

    tag = ''
    while tag not in TAGS:
        tag = input('选择分类 [1=技术 2=生活 3=读书]: ').strip() or '1'
    tag_key, tag_label = TAGS[tag]

    today = datetime.date.today().isoformat()

    lines = [
        '    {',
        '        id: %d,' % new_id,
        '        title: "%s",' % escape_js(title),
        '        excerpt: "%s",' % escape_js(excerpt),
        '        date: "%s",' % today,
        '        tag: "%s",' % tag_key,
        '        tagLabel: "%s",' % tag_label,
        '        content: `',
        '            <h2>写一个小标题</h2>',
        '            <p>在这里写正文。写完保存本文件，本地刷新"文章"页即可预览。</p>',
        '        `',
        '    },',
    ]
    block = nl.join(lines) + nl

    insert_at = text.find('\n', pos) + 1
    new_text = text[:insert_at] + block + text[insert_at:]

    with open(JS_PATH, 'w', encoding='utf-8', newline='') as f:
        f.write(new_text)

    # 写入后自检：文章数量应恰好 +1，且新 id 存在
    with open(JS_PATH, 'rb') as f:
        check = f.read().decode('utf-8')
    new_ids = re.findall(r'(?m)^\s*id:\s*(\d+)\s*,', check)
    if len(new_ids) != len(ids) + 1 or str(new_id) not in new_ids:
        print('[警告] 写入结果异常，请手动检查 js/main.js ！')
        return 1

    print()
    print('新文章已创建：')
    print('  ID　　: %d' % new_id)
    print('  标题　: %s' % title)
    print('  分类　: %s' % tag_label)
    print('  日期　: %s' % today)
    print()
    print('接下来：')
    print('  1. 在 js/main.js 里填写这篇文章的正文（content 部分）')
    print('  2. 本地刷新 posts.html 预览效果')
    print('  3. 双击 deploy.bat 发布上线')

    # 交互模式下自动打开数据文件，方便直接写正文
    if sys.stdin.isatty():
        try:
            os.startfile(JS_PATH)
        except Exception:
            pass

    return 0


if __name__ == '__main__':
    try:
        sys.exit(main())
    except KeyboardInterrupt:
        print()
        print('已取消，未做任何修改。')
        sys.exit(1)
