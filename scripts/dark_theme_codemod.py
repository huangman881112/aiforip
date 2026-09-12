#!/usr/bin/env python3
"""把组件样式中的浅色硬编码值替换为 styles/theme.css 中的深色主题变量。"""
import os
import re
import sys

SRC = os.path.abspath(os.path.dirname(__file__) + '/../suanfa_vue/src')

SURFACE = {'#fff', '#ffffff', 'white'}
MUTED = {'#f8fafc', '#fafafa', '#f9f9f9', '#fafbfc', '#fbfcfe', '#f8f9fa', '#f6f8fa',
         '#f1f5f9', '#f1f4f8', '#f4f8fb', '#f5f7fa', '#f8fbfe', '#f0f9ff', '#f6faf6',
         '#fcfdff', '#fafcff', '#f7f9fc', '#f0f4f8'}
SURFACE2 = {'#f5f5f5', '#f0f0f0', '#eceff1', '#e9ecef', '#e0e0e0', '#e2e8f0', '#cbd5e1',
            '#dfe6e9', '#d5dbe3', '#d9d9d9', '#eee', '#eeeeee', '#ddd', '#dddddd', '#ccc',
            '#cccccc', '#bdbdbd', '#94a3b8', '#a0a0a0', '#dce6f0', '#e6e6e6', '#efefef'}
CODEBG = {'#0f172a', '#1e2a3a', '#282c34', '#242424', '#1a1a1a', '#2a2c2b', '#10202b',
          '#0b1220', '#111827', '#0d1117'}

TINT_BG = {}
for tokens, var in [
    ({'#e3f0fb', '#e6f7ff', '#e3f2fd', '#d0e6f9', '#dbeafe', '#bbdefb', '#e8f4fd', '#e0f2fe',
      '#d6eafc', '#e8f1fb', '#d4e8fa', '#e0e7ff', '#93c5fd', '#90c8f5', '#eaf2fd', '#f0f7ff',
      '#e1f0fe', '#e8f2fd'}, '--tint-blue'),
    ({'#dcfce7', '#d5f5e3', '#d4edda', '#e6ffed', '#e8f5e9', '#eaf6ec', '#e6f7ee', '#ecfdf5',
      '#f0fff4', '#eef6ee', '#c8e6c9', '#bbf7d0', '#e3f6e8'}, '--tint-green'),
    ({'#fadbd8', '#fee2e2', '#fdecea', '#fff1f0', '#ffe6e6', '#f8d7da', '#ffcdd2', '#ffebee',
      '#fde0e0'}, '--tint-red'),
    ({'#fff3e0', '#fef3c7', '#fff7e6', '#ffedd5', '#fff8e1', '#fff3cd', '#fff9e6', '#ffecb3',
      '#ffe0b2', '#fce8cd'}, '--tint-amber'),
    ({'#f3e8ff', '#ede9fe', '#e6e6fa', '#d1c4e9'}, '--tint-purple'),
    ({'#ccfbf1', '#e0f7fa', '#b2ebf2'}, '--tint-cyan'),
    ({'#fce7f3', '#f8bbd0'}, '--tint-pink'),
]:
    for t in tokens:
        TINT_BG[t] = var

BG_MAP = {}
for t in SURFACE:
    BG_MAP[t] = 'var(--surface)'
for t in MUTED:
    BG_MAP[t] = 'var(--surface-muted)'
for t in SURFACE2:
    BG_MAP[t] = 'var(--surface-2)'
for t in CODEBG:
    BG_MAP[t] = 'var(--code-bg)'
for t, v in TINT_BG.items():
    BG_MAP[t] = f'var({v})'

COLOR_MAP = {}
for group, var in [
    ({'#333', '#333333', '#444', '#444444', '#2c3e50', '#1e293b', '#1a2b49', '#263238',
      '#37474f', '#303133', '#1b3a2b', '#155724', '#721c24', '#5d4037', '#000', '#000000',
      '#213547', '#1f2d3d', '#0d3c61', '#f8fafc'}, '--text-1'),
    ({'#666', '#666666', '#64748b', '#607d8b', '#78909c', '#90a4ae', '#546e7a', '#7f8c8d',
      '#6c757d', '#95a5a6', '#b0bec5', '#555', '#555555', '#455a64', '#94a3b8', '#a0a0a0',
      '#777', '#888'}, '--text-2'),
    ({'#999', '#999999', '#aaa', '#aaaaaa', '#bbb', '#888888', '#777777'}, '--text-3'),
    ({'#1e88e5', '#1565c0', '#1976d2', '#2196f3', '#1890ff', '#3498db', '#2980b9', '#007bff',
      '#1d4ed8', '#3b82f6', '#2563eb', '#1e40af', '#0369a1', '#646cff', '#535bf2', '#747bff'},
     '--c-blue'),
    ({'#2e7d32', '#15803d', '#42b983', '#389e70', '#52c41a', '#558b2f', '#2c9764', '#3aa876',
      '#82d319', '#43a047', '#4caf50', '#2f9e44', '#10b981'}, '--c-green'),
    ({'#c62828', '#d32f2f', '#b91c1c', '#dc2626', '#ef4444', '#e74c3c', '#ff4d4f', '#ffb4a9',
      '#f44336', '#d9363e'}, '--c-red'),
    ({'#ef6c00', '#e65100', '#d97706', '#c2410c', '#d48817', '#f97316', '#ff9800', '#e67e22'},
     '--c-orange'),
    ({'#92400e', '#faad14', '#ffc107', '#f59e0b', '#ffeb3b'}, '--c-amber'),
    ({'#6b21a8', '#7e22ce', '#9c27b0', '#8b5cf6', '#6366f1', '#4338ca', '#7c3aed'}, '--c-purple'),
    ({'#0f766e', '#14b8a6', '#26a69a', '#00bcd4'}, '--c-cyan'),
    ({'#be185d', '#ec4899', '#e91e63'}, '--c-pink'),
]:
    for t in group:
        COLOR_MAP[t] = f'var({var})'

BORDER_MAP = {}
for t in {'#ddd', '#dddddd', '#eee', '#eeeeee', '#ccc', '#cccccc', '#e0e0e0', '#eceff1',
          '#e9ecef', '#cfd8dc', '#e2e8f0', '#e0e6ef', '#d5dbe3', '#e4eaf3', '#d5deeb',
          '#dbe4ee', '#d7e2ee', '#b0bec5', '#f0f0f0', '#dee2e6', '#d9d9d9', '#bdbdbd',
          '#e5e5e5', '#efefef', '#e6e6e6', '#d5deea', '#d5dfe9', '#cbd5e1', '#eaeaea',
          '#e8e8e8', '#f5f5f5'}:
    BORDER_MAP[t] = 'var(--border-1)'
for t in {'#aaa', '#aaaaaa', '#999', '#a0a0a0'}:
    BORDER_MAP[t] = 'var(--border-2)'
for group, var in [
    ({'#bbdefb', '#91d5ff', '#90caf9', '#c3dcf7', '#a0c8f0', '#b3d9f7', '#bae0ff'},
     '--tint-blue-border'),
    ({'#c3e6cb', '#dcedc8', '#a5d6a7', '#c8e6c9', '#b7ebc9', '#b7eb8f'}, '--tint-green-border'),
    ({'#ffeeba', '#ffcc80', '#ffe0b2', '#ffd591', '#ffe7ba'}, '--tint-amber-border'),
    ({'#ef9a9a', '#f8d7da', '#ffcdd2'}, '--tint-red-border'),
    ({'#d1c4e9', '#e1bee7'}, '--tint-purple-border'),
    ({'#b2ebf2', '#87e8de'}, '--tint-cyan-border'),
    ({'#f8bbd0'}, '--tint-pink-border'),
]:
    for t in group:
        BORDER_MAP[t] = f'var({var})'

PROP_RE = re.compile(
    r'(?P<pre>[;{}\s]|^)'
    r'(?P<prop>background-color|background|color|border-color|border|'
    r'border-top|border-right|border-bottom|border-left|'
    r'border-top-color|border-right-color|border-bottom-color|border-left-color|outline-color)'
    r'(?P<colon>\s*:\s*)(?P<val>[^;{}\n]*)',
    re.IGNORECASE)


def split_top(value):
    """按顶层逗号切分，括号内的逗号不切（保护 gradient / rgba）。"""
    parts, depth, cur = [], 0, ''
    for ch in value:
        if ch == '(':
            depth += 1
        elif ch == ')':
            depth -= 1
        if ch == ',' and depth == 0:
            parts.append(cur)
            cur = ''
        else:
            cur += ch
    parts.append(cur)
    return parts


def map_exact(value, table):
    out = []
    changed = False
    for part in split_top(value):
        stripped = part.strip().lower()
        if stripped in table:
            out.append(part.replace(part.strip(), table[stripped]))
            changed = True
        else:
            out.append(part)
    return ','.join(out) if changed else value


def map_anywhere(value, table):
    def repl(m):
        tok = m.group(0).lower()
        return table.get(tok, m.group(0))
    return re.sub(r'#[0-9a-fA-F]{3,8}\b|\bwhite\b', repl, value)


def transform(text):
    stats = {'n': 0}

    def sub(m):
        prop = m.group('prop').lower()
        value = m.group('val')
        if prop.startswith('background'):
            new = map_exact(value, BG_MAP)
        elif prop == 'color':
            new = map_exact(value, COLOR_MAP)
        else:  # border / outline
            new = map_anywhere(value, BORDER_MAP)
        if new != value:
            stats['n'] += 1
        return m.group('pre') + m.group('prop') + m.group('colon') + new

    return PROP_RE.sub(sub, text), stats['n']


def style_regions(text):
    """返回 .vue 文件中所有 <style> 块的位置区间。"""
    regions = []
    for m in re.finditer(r'<style[^>]*>(.*?)</style>', text, re.S):
        regions.append((m.start(1), m.end(1)))
    return regions


def main():
    total = 0
    for root, dirs, files in os.walk(SRC):
        dirs[:] = [d for d in dirs if d != 'node_modules']
        for name in files:
            path = os.path.join(root, name)
            if path == os.path.join(SRC, 'style.css') or '/styles/' in path:
                continue
            if name.endswith('.vue'):
                text = open(path, encoding='utf-8').read()
                pieces, pos, n = [], 0, 0
                for start, end in style_regions(text):
                    new, s = transform(text[pos:start])
                    pieces.append(new)
                    piece, s = transform(text[start:end])
                    pieces.append(piece)
                    n += s
                    pos = end
                new, s = transform(text[pos:])
                pieces.append(new)
                out = ''.join(pieces)
                if n:
                    open(path, 'w', encoding='utf-8').write(out)
                    print(f'{os.path.relpath(path, SRC)}: {n}')
                    total += n
            elif name.endswith('.css'):
                text = open(path, encoding='utf-8').read()
                out, n = transform(text)
                if n:
                    open(path, 'w', encoding='utf-8').write(out)
                    print(f'{os.path.relpath(path, SRC)}: {n}')
                    total += n
    print('TOTAL', total)


if __name__ == '__main__':
    main()
