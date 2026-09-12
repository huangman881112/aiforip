// ============================================================
// 算法训练·代码工作台模板生成器
//
// 函数模式（functionTemplate）：把「标准输入」转成代码块里的具名参数——
// 自动按题目 params 生成 typed 函数签名 + JSON harness：
//   stdin 收到一行 JSON 对象（{"nums":[2,7,11,15],"target":9}），
//   harness 按参数名取值 → 调用用户函数 → 结果按 JSON 序列化打印。
//   用户只写函数体，直接用参数名拿值，无需任何输入解析。
//
// 自由模式（FREE_TEMPLATES）：原始 stdin 读写（旧行为）。
// ============================================================

const TYPE_LABELS = {
  int: '整数',
  bool: '布尔',
  string: '字符串',
  'int[]': '整数数组',
  'int[][]': '二维整数数组',
  'string[]': '字符串数组',
}

// ---------------------------------------------------------------- 自由模式模板

export const FREE_TEMPLATES = {
  c: `#include <stdio.h>
#include <string.h>

int main(void) {
    char line[1024];
    while (fgets(line, sizeof(line), stdin)) {
        line[strcspn(line, "\\r\\n")] = '\\0';
        printf("read: %s\\n", line);
    }
    return 0;
}
`,
  cpp: `#include <bits/stdc++.h>
using namespace std;

int main() {
    string line;
    while (getline(cin, line)) {
        cout << "read: " << line << endl;
    }
    return 0;
}
`,
  java: `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        while (sc.hasNextLine()) {
            System.out.println("read: " + sc.nextLine());
        }
    }
}
`,
  python: `import sys

for line in sys.stdin:
    print("read:", line.rstrip())
`,
  go: `package main

import (
	"bufio"
	"fmt"
	"os"
	"strings"
)

func main() {
	scanner := bufio.NewScanner(os.Stdin)
	for scanner.Scan() {
		fmt.Println("read:", strings.TrimSpace(scanner.Text()))
	}
}
`,
  javascript: `const lines = require('fs').readFileSync(0, 'utf8').split('\\n');

for (const line of lines) {
  if (line.trim()) console.log('read:', line.trim());
}
`,
}

// ---------------------------------------------------------------- 类型映射

const CPP_TYPE = { int: 'int', bool: 'bool', string: 'string', 'int[]': 'vector<int>', 'int[][]': 'vector<vector<int>>', 'string[]': 'vector<string>' }
const CPP_GET = { int: '.asInt()', bool: '.asBool()', string: '.asStr()', 'int[]': '.asInts()', 'int[][]': '.asMat()', 'string[]': '.asStrs()' }
const JAVA_TYPE = { int: 'int', bool: 'boolean', string: 'String', 'int[]': 'int[]', 'int[][]': 'int[][]', 'string[]': 'String[]' }
const JAVA_GET = { int: 'i', bool: 'bl', string: 'st', 'int[]': 'ia', 'int[][]': 'iaa', 'string[]': 'sa' }
const GO_TYPE = { int: 'int', bool: 'bool', string: 'string', 'int[]': '[]int', 'int[][]': '[][]int', 'string[]': '[]string' }
const GO_GET = { int: 'jInt', bool: 'jBool', string: 'jStr', 'int[]': 'jInts', 'int[][]': 'jMat', 'string[]': 'jStrs' }
const C_RET = { int: 'int', bool: 'int', string: 'char *', 'int[]': 'IntArr', 'int[][]': 'IntMat', 'string[]': 'StrArr' }
const C_OUT = { int: 'out_int', bool: 'out_bool', string: 'out_str', 'int[]': 'out_intarr', 'int[][]': 'out_intmat', 'string[]': 'out_strarr' }

const DEFAULT_RET = {
  python: { int: '0', bool: 'False', string: '""', 'int[]': '[]', 'int[][]': '[]', 'string[]': '[]' },
  javascript: { int: '0', bool: 'false', string: "''", 'int[]': '[]', 'int[][]': '[]', 'string[]': '[]' },
  java: { int: '0', bool: 'false', string: '""', 'int[]': 'new int[0]', 'int[][]': 'new int[0][]', 'string[]': 'new String[0]' },
  cpp: { int: '0', bool: 'false', string: '""', 'int[]': '{}', 'int[][]': '{}', 'string[]': '{}' },
  go: { int: '0', bool: 'false', string: '""', 'int[]': 'nil', 'int[][]': 'nil', 'string[]': 'nil' },
  c: { int: '0', bool: '0', string: '""', 'int[]': '(IntArr){0, NULL}', 'int[][]': '(IntMat){0, 0, NULL}', 'string[]': '(StrArr){0, NULL}' },
}

function paramHintLines(params) {
  return params.map((p) => `${p.name}: ${TYPE_LABELS[p.type]}`).join('；')
}

function callComment(meta) {
  return `参数由测试机按名取值传入（${paramHintLines(meta.params)}），返回${TYPE_LABELS[meta.ret] || meta.ret}`
}

// ---------------------------------------------------------------- 各语言 harness 工具（静态文本，String.raw 保留反斜杠）

const CPP_UTIL = String.raw`/* ===== 测试用极简 JSON（自动生成，一般无需修改） ===== */
namespace jz {
struct V {
    char t = 'z';               // z 空 / d 数值或布尔 / s 字符串 / a 数组 / o 对象
    double n = 0;
    string s;
    vector<V> a;
    vector<pair<string, V>> o;
    const V& operator[](const string& k) const {
        static V nil;
        for (size_t i = 0; i < o.size(); ++i) if (o[i].first == k) return o[i].second;
        return nil;
    }
    int asInt() const { return (int) n; }
    bool asBool() const { return n != 0; }
    string asStr() const { return s; }
    vector<int> asInts() const { vector<int> r; for (size_t i = 0; i < a.size(); ++i) r.push_back(a[i].asInt()); return r; }
    vector<vector<int>> asMat() const { vector<vector<int>> r; for (size_t i = 0; i < a.size(); ++i) r.push_back(a[i].asInts()); return r; }
    vector<string> asStrs() const { vector<string> r; for (size_t i = 0; i < a.size(); ++i) r.push_back(a[i].s); return r; }
};
inline void ws(const string& s, size_t& i) { while (i < s.size() && isspace((unsigned char) s[i])) ++i; }
inline V parse(const string& s, size_t& i) {
    V v; ws(s, i);
    if (i >= s.size()) return v;
    char c = s[i];
    if (c == '{' || c == '[') {
        bool obj = c == '{';
        v.t = obj ? 'o' : 'a';
        ++i; ws(s, i);
        if (i < s.size() && s[i] == (obj ? '}' : ']')) { ++i; return v; }
        while (i < s.size()) {
            if (obj) {
                V k = parse(s, i); ws(s, i);
                if (i < s.size() && s[i] == ':') ++i;
                v.o.push_back(make_pair(k.s, parse(s, i)));
            } else {
                v.a.push_back(parse(s, i));
            }
            ws(s, i);
            if (i < s.size() && s[i] == ',') { ++i; ws(s, i); continue; }
            if (i < s.size() && (s[i] == '}' || s[i] == ']')) { ++i; break; }
            break;
        }
    } else if (c == '"') {
        v.t = 's'; ++i;
        while (i < s.size() && s[i] != '"') {
            char x = s[i++];
            if (x == '\\' && i < s.size()) { char y = s[i++]; x = (y == 'n') ? '\n' : (y == 't') ? '\t' : y; }
            v.s += x;
        }
        if (i < s.size()) ++i;
    } else if (c == 't') { v.t = 'd'; v.n = 1; while (i < s.size() && isalpha((unsigned char) s[i])) ++i; }
    else if (c == 'f') { v.t = 'd'; v.n = 0; while (i < s.size() && isalpha((unsigned char) s[i])) ++i; }
    else if (c == 'n') { while (i < s.size() && isalpha((unsigned char) s[i])) ++i; }
    else {
        v.t = 'd'; size_t st = i;
        while (i < s.size() && (isdigit((unsigned char) s[i]) || strchr("+-eE.", s[i]))) ++i;
        if (i > st) v.n = stod(s.substr(st, i - st));
    }
    return v;
}
inline string q(const string& x) {
    string r = "\"";
    for (size_t i = 0; i < x.size(); ++i) {
        char c = x[i];
        if (c == '"' || c == '\\') { r += '\\'; r += c; }
        else if (c == '\n') r += "\\n";
        else r += c;
    }
    return r + "\"";
}
inline string tostr(int x) { return to_string(x); }
inline string tostr(long x) { return to_string(x); }
inline string tostr(bool x) { return x ? "true" : "false"; }
inline string tostr(double x) { ostringstream o; o << x; return o.str(); }
inline string tostr(const string& x) { return q(x); }
inline string tostr(const vector<int>& x) { string r = "["; for (size_t i = 0; i < x.size(); ++i) { if (i) r += ","; r += to_string(x[i]); } return r + "]"; }
inline string tostr(const vector<vector<int>>& x) { string r = "["; for (size_t i = 0; i < x.size(); ++i) { if (i) r += ","; r += tostr(x[i]); } return r + "]"; }
inline string tostr(const vector<string>& x) { string r = "["; for (size_t i = 0; i < x.size(); ++i) { if (i) r += ","; r += q(x[i]); } return r + "]"; }
}
`

const C_UTIL = String.raw`/* ===== 测试用极简 JSON（自动生成，一般无需修改；支持本题所需的标量/数组/矩阵） ===== */
typedef struct { int n; int *v; } IntArr;
typedef struct { int rows, cols; int **m; } IntMat;
typedef struct { int n; char **s; } StrArr;
typedef struct { const char *p; } J;

static void jws(J *j) { while (*j->p && isspace((unsigned char) *j->p)) j->p++; }
static long jnum(J *j) { jws(j); return strtol(j->p, (char **) &j->p, 10); }
static int jbool(J *j) {
    jws(j);
    if (!strncmp(j->p, "true", 4)) { j->p += 4; return 1; }
    if (!strncmp(j->p, "false", 5)) { j->p += 5; return 0; }
    return jnum(j) != 0;
}
static char *jstr(J *j) {
    jws(j);
    size_t cap = 16, len = 0;
    char *buf = (char *) malloc(cap);
    buf[0] = 0;
    if (*j->p != '"') {              /* 数字/true 等按其文本读入 */
        const char *st = j->p;
        while (*j->p && *j->p != ',' && *j->p != '}' && !isspace((unsigned char) *j->p)) j->p++;
        size_t n = (size_t) (j->p - st) + 1;
        if (n > cap) buf = (char *) realloc(buf, n);
        memcpy(buf, st, n - 1); buf[n - 1] = 0;
        return buf;
    }
    j->p++;
    while (*j->p && *j->p != '"') {
        char c = *j->p;
        if (c == '\\' && j->p[1]) { j->p++; c = j->p[0] == 'n' ? '\n' : j->p[0]; }
        if (len + 2 > cap) { cap *= 2; buf = (char *) realloc(buf, cap); }
        buf[len++] = c; j->p++;
    }
    if (*j->p == '"') j->p++;
    buf[len] = 0;
    return buf;
}
static int *jintarr(J *j, int *outN) {
    jws(j);
    int *v = NULL, n = 0, cap = 0;
    if (*j->p == '[') {
        j->p++;
        while (*j->p && *j->p != ']') {
            int x = (int) jnum(j);
            if (n == cap) { cap = cap ? cap * 2 : 8; v = (int *) realloc(v, (size_t) cap * sizeof(int)); }
            v[n++] = x;
            jws(j);
            if (*j->p == ',') j->p++;
        }
        if (*j->p == ']') j->p++;
    }
    *outN = n;
    return v;
}
static IntMat jmat(J *j) {
    IntMat r; r.rows = r.cols = 0; r.m = NULL;
    jws(j);
    if (*j->p == '[') {
        j->p++;
        int cap = 0;
        while (*j->p && *j->p != ']') {
            int n; int *row = jintarr(j, &n);
            if (r.rows == cap) { cap = cap ? cap * 2 : 4; r.m = (int **) realloc(r.m, (size_t) cap * sizeof(int *)); }
            r.m[r.rows++] = row;
            if (n > r.cols) r.cols = n;
            jws(j);
            if (*j->p == ',') j->p++;
        }
        if (*j->p == ']') j->p++;
    }
    return r;
}
static StrArr jstrarr(J *j) {
    StrArr r; r.n = 0; r.s = NULL;
    jws(j);
    if (*j->p == '[') {
        j->p++;
        int cap = 0;
        while (*j->p && *j->p != ']') {
            if (r.n == cap) { cap = cap ? cap * 2 : 8; r.s = (char **) realloc(r.s, (size_t) cap * sizeof(char *)); }
            r.s[r.n++] = jstr(j);
            jws(j);
            if (*j->p == ',') j->p++;
        }
        if (*j->p == ']') j->p++;
    }
    return r;
}
static void jkey(J *j, const char *k) {   /* 定位到 "k": 之后 */
    char pat[96];
    snprintf(pat, sizeof pat, "\"%s\"", k);
    const char *f = strstr(j->p, pat);
    if (f) {
        j->p = f + strlen(pat);
        jws(j);
        if (*j->p == ':') { j->p++; jws(j); }
    }
}
static void pstr(const char *s) {
    putchar('"');
    for (const char *c = s; *c; c++) {
        if (*c == '"' || *c == '\\') putchar('\\');
        if (*c == '\n') { putchar('\\'); putchar('n'); continue; }
        putchar(*c);
    }
    putchar('"');
}
static void out_int(long x) { printf("%ld\n", x); }
static void out_bool(long x) { puts(x ? "true" : "false"); }
static void out_str(const char *s) { pstr(s); putchar('\n'); }
static void out_intarr(IntArr a) {
    putchar('[');
    for (int i = 0; i < a.n; i++) printf(i ? ",%d" : "%d", a.v[i]);
    puts("]");
}
static void out_intmat(IntMat m) {
    putchar('[');
    for (int i = 0; i < m.rows; i++) {
        if (i) putchar(',');
        putchar('[');
        for (int k = 0; k < m.cols; k++) printf(k ? ",%d" : "%d", m.m[i] ? m.m[i][k] : 0);
        putchar(']');
    }
    puts("]");
}
static void out_strarr(StrArr a) {
    putchar('[');
    for (int i = 0; i < a.n; i++) { if (i) putchar(','); pstr(a.s[i]); }
    puts("]");
}
`

const JAVA_JSON = String.raw`    static class Json {
        static Object parse(String s) { return new Json(s).read(); }
        static String str(Object o) { StringBuilder b = new StringBuilder(); w(b, o); return b.toString(); }
        private final String src; private int pos;
        Json(String s) { src = s; }
        private static String esc(String s) {
            StringBuilder b = new StringBuilder("\"");
            for (int k = 0; k < s.length(); k++) {
                char c = s.charAt(k);
                if (c == '"' || c == '\\') b.append('\\').append(c);
                else if (c == '\n') b.append("\\n");
                else b.append(c);
            }
            return b.append('"').toString();
        }
        private static void w(StringBuilder b, Object o) {
            if (o == null) b.append("null");
            else if (o instanceof String) b.append(esc((String) o));
            else if (o instanceof Boolean || o instanceof Number) b.append(o);
            else if (o instanceof int[]) { int[] x = (int[]) o; b.append('['); for (int k = 0; k < x.length; k++) { if (k > 0) b.append(','); b.append(x[k]); } b.append(']'); }
            else if (o instanceof long[]) { long[] x = (long[]) o; b.append('['); for (int k = 0; k < x.length; k++) { if (k > 0) b.append(','); b.append(x[k]); } b.append(']'); }
            else if (o instanceof double[]) { double[] x = (double[]) o; b.append('['); for (int k = 0; k < x.length; k++) { if (k > 0) b.append(','); b.append(x[k]); } b.append(']'); }
            else if (o instanceof Object[]) { Object[] x = (Object[]) o; b.append('['); for (int k = 0; k < x.length; k++) { if (k > 0) b.append(','); w(b, x[k]); } b.append(']'); }
            else if (o instanceof List) { b.append('['); boolean first = true; for (Object e : (List<?>) o) { if (!first) b.append(','); first = false; w(b, e); } b.append(']'); }
            else b.append(esc(String.valueOf(o)));
        }
        private void skip() { while (pos < src.length() && Character.isWhitespace(src.charAt(pos))) pos++; }
        private Object read() {
            skip();
            if (pos >= src.length()) return null;
            char c = src.charAt(pos);
            if (c == '{') {
                Map<String, Object> m = new LinkedHashMap<>(); pos++; skip();
                if (src.charAt(pos) == '}') { pos++; return m; }
                while (pos < src.length()) {
                    skip(); String k = String.valueOf(read()); skip();
                    if (src.charAt(pos) == ':') pos++;
                    m.put(k, read()); skip();
                    if (src.charAt(pos) == ',') { pos++; continue; }
                    if (src.charAt(pos) == '}') pos++;
                    break;
                }
                return m;
            }
            if (c == '[') {
                List<Object> l = new ArrayList<>(); pos++; skip();
                if (src.charAt(pos) == ']') { pos++; return l; }
                while (pos < src.length()) {
                    l.add(read()); skip();
                    if (src.charAt(pos) == ',') { pos++; continue; }
                    if (src.charAt(pos) == ']') pos++;
                    break;
                }
                return l;
            }
            if (c == '"') {
                StringBuilder b = new StringBuilder(); pos++;
                while (pos < src.length() && src.charAt(pos) != '"') {
                    char x = src.charAt(pos++);
                    if (x == '\\' && pos < src.length()) {
                        char y = src.charAt(pos++);
                        x = y == 'n' ? '\n' : y == 't' ? '\t' : y;
                    }
                    b.append(x);
                }
                pos++;
                return b.toString();
            }
            if (src.startsWith("true", pos)) { pos += 4; return Boolean.TRUE; }
            if (src.startsWith("false", pos)) { pos += 5; return Boolean.FALSE; }
            if (src.startsWith("null", pos)) { pos += 4; return null; }
            int st = pos;
            while (pos < src.length() && "-+.eE0123456789".indexOf(src.charAt(pos)) >= 0) pos++;
            String num = src.substring(st, pos);
            if (num.contains(".") || num.contains("e") || num.contains("E")) return Double.parseDouble(num);
            return Long.parseLong(num);
        }
    }`

const GO_UTIL = String.raw`func jInt(v interface{}) int { f, _ := v.(float64); return int(f) }
func jBool(v interface{}) bool { b, _ := v.(bool); return b }
func jStr(v interface{}) string {
	if s, ok := v.(string); ok { return s }
	if f, ok := v.(float64); ok { return fmt.Sprint(int(f)) }
	return ""
}
func jInts(v interface{}) []int {
	l, _ := v.([]interface{})
	r := make([]int, len(l))
	for idx, e := range l { r[idx] = jInt(e) }
	return r
}
func jMat(v interface{}) [][]int {
	l, _ := v.([]interface{})
	r := make([][]int, len(l))
	for idx, e := range l { r[idx] = jInts(e) }
	return r
}
func jStrs(v interface{}) []string {
	l, _ := v.([]interface{})
	r := make([]string, len(l))
	for idx, e := range l { r[idx] = jStr(e) }
	return r
}`

// ---------------------------------------------------------------- 生成器

function cParamDecl(pparam) {
  switch (pparam.type) {
    case 'int': case 'bool': return `int ${pparam.name}`
    case 'string': return `char *${pparam.name}`
    case 'int[]': return `int *${pparam.name}, int ${pparam.name}Size`
    case 'int[][]': return `int **${pparam.name}, int ${pparam.name}Rows, int ${pparam.name}Cols`
    case 'string[]': return `char **${pparam.name}, int ${pparam.name}Size`
  }
}

function cParse(pparam) {
  switch (pparam.type) {
    case 'int': return `jkey(&j, "${pparam.name}"); int ${pparam.name} = (int) jnum(&j);`
    case 'bool': return `jkey(&j, "${pparam.name}"); int ${pparam.name} = jbool(&j);`
    case 'string': return `jkey(&j, "${pparam.name}"); char *${pparam.name} = jstr(&j);`
    case 'int[]': return `jkey(&j, "${pparam.name}"); int ${pparam.name}Size; int *${pparam.name} = jintarr(&j, &${pparam.name}Size);`
    case 'int[][]': return `jkey(&j, "${pparam.name}"); IntMat ${pparam.name} = jmat(&j);`
    case 'string[]': return `jkey(&j, "${pparam.name}"); StrArr ${pparam.name} = jstrarr(&j);`
  }
}

function cArgExpr(pparam) {
  switch (pparam.type) {
    case 'int': case 'bool': case 'string': return pparam.name
    case 'int[]': return `${pparam.name}, ${pparam.name}Size`
    case 'string[]': return `${pparam.name}.s, ${pparam.name}.n`
    case 'int[][]': return `${pparam.name}.m, ${pparam.name}.rows, ${pparam.name}.cols`
  }
}

/**
 * 函数模式：生成三段式代码。
 *   stub —— 展示在代码块里的用户函数（含类型注释与待填体）；
 *   head/tail —— 测试机（工具链样板 + 按参数名取值调用），运行时自动拼接，
 *   对用户隐藏，保持编辑器里只有算法实现本身。
 */
export function harnessParts(meta, lang) {
  const { fn, params, ret } = meta
  const names = params.map((p) => p.name).join(', ')
  const doc = callComment(meta)

  switch (lang) {
    case 'python': {
      const argDocs = params.map((p) => `    # ${p.name}: ${TYPE_LABELS[p.type]}`).join('\n')
      const call = params.map((p) => `data["${p.name}"]`).join(', ')
      return {
        head: `import json
import sys

`,
        stub: `# ${doc}
def ${fn}(${names}):
${argDocs}
    # 返回: ${TYPE_LABELS[ret]}
    # TODO: 在这里写你的代码
    return ${DEFAULT_RET.python[ret] || 'None'}
`,
        tail: `
# ===== 测试机（运行时自动附加）=====
data = json.loads(sys.stdin.read() or "{}")
result = ${fn}(${call})
print(json.dumps(result, ensure_ascii=False, separators=(",", ":")))
`,
      }
    }
    case 'javascript': {
      const jsdoc = params.map((p) => ` * @param {${p.type === 'int[]' ? 'number[]' : p.type === 'int[][]' ? 'number[][]' : p.type === 'string[]' ? 'string[]' : p.type === 'bool' ? 'boolean' : p.type === 'string' ? 'string' : 'number'}} ${p.name}`).join('\n')
      const call = params.map((p) => `__data.${p.name}`).join(', ')
      return {
        head: '',
        stub: `/**
${jsdoc}
 * @return {${ret === 'int[]' ? 'number[]' : ret === 'int[][]' ? 'number[][]' : ret === 'string[]' ? 'string[]' : ret === 'bool' ? 'boolean' : ret === 'string' ? 'string' : 'number'}}
 * ${doc}
 */
function ${fn}(${names}) {
    // TODO: 在这里写你的代码
    return ${DEFAULT_RET.javascript[ret]}
}
`,
        tail: `
// ===== 测试机（运行时自动附加）=====
const __raw = require('fs').readFileSync(0, 'utf8').trim();
const __data = __raw ? JSON.parse(__raw) : {};
console.log(JSON.stringify(${fn}(${call})));
`,
      }
    }
    case 'cpp': {
      const sig = params.map((p) => `${CPP_TYPE[p.type]} ${p.name}`).join(', ')
      const call = params.map((p) => `d["${p.name}"]${CPP_GET[p.type]}`).join(', ')
      return {
        head: `#include <bits/stdc++.h>
using namespace std;

${CPP_UTIL}`,
        stub: `/* ${doc} */
${CPP_TYPE[ret]} ${fn}(${sig}) {
    // TODO: 在这里写你的代码
    return ${DEFAULT_RET.cpp[ret]};
}
`,
        tail: `
// ===== 测试机（运行时自动附加）=====
int main() {
    string in, all;
    while (getline(cin, in)) all += in + "\\n";
    size_t i = 0;
    jz::V d = jz::parse(all, i);
    auto r = ${fn}(${call});
    cout << jz::tostr(r) << endl;
    return 0;
}
`,
      }
    }
    case 'java': {
      const sig = params.map((p) => `${JAVA_TYPE[p.type]} ${p.name}`).join(', ')
      const call = params.map((p) => `${JAVA_GET[p.type]}(d.get("${p.name}"))`).join(', ')
      return {
        head: `import java.util.*;

public class Main {
`,
        stub: `    /**
     * ${doc}
     */
    static ${JAVA_TYPE[ret]} ${fn}(${sig}) {
        // TODO: 在这里写你的代码
        return ${DEFAULT_RET.java[ret]};
    }
`,
        tail: `
    // ===== 以下为测试机，运行时自动附加 =====
    @SuppressWarnings("unchecked")
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in).useDelimiter("\\\\A");
        String in = sc.hasNext() ? sc.next() : "";
        Map<String, Object> d = in.trim().isEmpty() ? new LinkedHashMap<String, Object>()
                : (Map<String, Object>) Json.parse(in);
        ${JAVA_TYPE[ret]} r = ${fn}(${call});
        System.out.println(Json.str(r));
    }

    static int i(Object o) { return o instanceof Number ? ((Number) o).intValue() : Integer.parseInt(String.valueOf(o)); }
    static boolean bl(Object o) { return o instanceof Boolean ? (Boolean) o : o != null && i(o) != 0; }
    static String st(Object o) { return o == null ? "" : String.valueOf(o); }
    static int[] ia(Object o) { List<?> l = (List<?>) o; int[] r = new int[l.size()]; for (int k = 0; k < r.length; k++) r[k] = i(l.get(k)); return r; }
    static int[][] iaa(Object o) { List<?> l = (List<?>) o; int[][] r = new int[l.size()][]; for (int k = 0; k < r.length; k++) r[k] = ia(l.get(k)); return r; }
    static String[] sa(Object o) { List<?> l = (List<?>) o; String[] r = new String[l.size()]; for (int k = 0; k < r.length; k++) r[k] = st(l.get(k)); return r; }

${JAVA_JSON}
}
`,
      }
    }
    case 'go': {
      const sig = params.map((p) => `${p.name} ${GO_TYPE[p.type]}`).join(', ')
      const call = params.map((p) => `${GO_GET[p.type]}(d["${p.name}"])`).join(', ')
      return {
        head: `package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"os"
)

`,
        stub: `// ${doc}
func ${fn}(${sig}) ${GO_TYPE[ret]} {
	// TODO: 在这里写你的代码
	return ${DEFAULT_RET.go[ret]}
}
`,
        tail: `
// ===== 测试机（运行时自动附加）=====
${GO_UTIL}

func main() {
	data, _ := io.ReadAll(os.Stdin)
	d := map[string]interface{}{}
	if len(bytes.TrimSpace(data)) > 0 {
		_ = json.Unmarshal(data, &d)
	}
	out := ${fn}(${call})
	b, _ := json.Marshal(out)
	fmt.Println(string(b))
}
`,
      }
    }
    case 'c': {
      const sig = params.map(cParamDecl).join(', ')
      const parses = params.map(cParse).map((l) => `    ${l}`).join('\n')
      const call = params.map(cArgExpr).join(', ')
      return {
        head: `#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <ctype.h>

${C_UTIL}`,
        stub: `/* ${doc}
 * C 语言数组以「指针 + 长度」传递（如 nums / numsSize）；
 * 返回数组时用 IntArr/IntMat/StrArr 结构体，内存可直接 malloc。 */
${C_RET[ret]} ${fn}(${sig}) {
    // TODO: 在这里写你的代码
    return ${DEFAULT_RET.c[ret]};
}
`,
        tail: `
/* ===== 测试机（运行时自动附加）=====*/
int main(void) {
    static char buf[65536];
    size_t len = 0;
    int ch;
    while ((ch = getchar()) != EOF && len + 1 < sizeof buf) buf[len++] = (char) ch;
    buf[len] = 0;
    J j; j.p = buf;
${parses}
    ${C_OUT[ret]}(${fn}(${call}));
    return 0;
}
`,
      }
    }
    default:
      return { head: '', tail: '', stub: FREE_TEMPLATES[lang] || '' }
  }
}

/** 把用户代码（stub 或其修改版）拼成完整可提交程序；自由模式原样返回。 */
export function wrapWithHarness(meta, lang, userCode) {
  if (!meta) return userCode
  const { head, tail } = harnessParts(meta, lang)
  return head + userCode + tail
}

/** 完整代码（harness + stub）：兼容旧调用/测试用。 */
export function functionTemplate(meta, lang) {
  const { head, stub, tail } = harnessParts(meta, lang)
  return head + stub + tail
}
