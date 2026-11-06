"""Removes comments from JavaScript, CSS and HTML without changing the code.

A small tokenizer: it understands strings, template literals (with ${...}),
regular expression literals and comments, so `//` inside a string or a regex
is kept. Used by tools/build_demo.py.
"""
import re

REGEX_BEFORE = set('(,=:[!&|?{};+-*%<>~^')
REGEX_WORDS = {'return', 'typeof', 'instanceof', 'in', 'of', 'new', 'delete', 'void', 'throw', 'case', 'do', 'else', 'yield', 'await'}


def strip_js(src):
    out = []
    i, n = 0, len(src)
    stack = []  # template literal nesting: number of open { inside ${ }
    last = ''   # last significant token (char or word)

    def prev_allows_regex():
        if not last:
            return True
        if last in REGEX_WORDS:
            return True
        return last[-1] in REGEX_BEFORE and last not in (')', ']')

    while i < n:
        c = src[i]
        nxt = src[i + 1] if i + 1 < n else ''
        if c == '/' and nxt == '/':
            j = src.find('\n', i)
            i = n if j < 0 else j
            continue
        if c == '/' and nxt == '*':
            j = src.find('*/', i + 2)
            i = n if j < 0 else j + 2
            out.append(' ')
            continue
        if c in '"\'':
            j = i + 1
            while j < n and src[j] != c:
                if src[j] == '\\':
                    j += 1
                elif src[j] == '\n':
                    break
                j += 1
            out.append(src[i:j + 1]); i = j + 1; last = 'str'; continue
        if c == '`' or (c == '}' and stack and stack[-1] == 0):
            if c == '}':
                stack.pop()
            j = i + 1
            while j < n:
                if src[j] == '\\':
                    j += 2; continue
                if src[j] == '`':
                    break
                if src[j] == '$' and j + 1 < n and src[j + 1] == '{':
                    break
                j += 1
            if j < n and src[j] == '$':
                out.append(src[i:j + 2]); i = j + 2; stack.append(0); last = '{'
            else:
                out.append(src[i:j + 1]); i = j + 1; last = 'str'
            continue
        if c == '{' and stack:
            stack[-1] += 1
        elif c == '}' and stack and stack[-1] > 0:
            stack[-1] -= 1
        if c == '/' and prev_allows_regex():
            j = i + 1; in_class = False
            while j < n:
                if src[j] == '\\':
                    j += 2; continue
                if src[j] == '[':
                    in_class = True
                elif src[j] == ']':
                    in_class = False
                elif src[j] == '/' and not in_class:
                    break
                elif src[j] == '\n':
                    break
                j += 1
            j += 1
            while j < n and src[j].isalpha():
                j += 1
            out.append(src[i:j]); i = j; last = 'regex'; continue
        if c.isalnum() or c in '_$':
            m = re.match(r'[\w$]+', src[i:])
            word = m.group(0)
            out.append(word); i += len(word); last = word; continue
        out.append(c)
        if not c.isspace():
            last = c
        i += 1
    text = ''.join(out)
    # tidy: drop lines that are now empty
    return '\n'.join(line.rstrip() for line in text.split('\n') if line.strip()) + '\n'


def strip_css(src):
    return re.sub(r'/\*.*?\*/', '', src, flags=re.S)


def strip_html(src):
    src = re.sub(r'<!--.*?-->', '', src, flags=re.S)
    def script(m):
        open_tag, body = m.group(1), m.group(2)
        if 'src=' in open_tag or 'json' in open_tag:
            return m.group(0)
        return open_tag + strip_js(body) + '</script>'
    src = re.sub(r'(<script[^>]*>)(.*?)</script>', script, src, flags=re.S)
    src = re.sub(r'(<style[^>]*>)(.*?)</style>', lambda m: m.group(1) + strip_css(m.group(2)) + '</style>', src, flags=re.S)
    return src
