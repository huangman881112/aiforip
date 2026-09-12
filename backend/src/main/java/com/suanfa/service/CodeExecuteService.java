package com.suanfa.service;

import com.suanfa.dto.CodeExecuteRequest;
import com.suanfa.dto.CodeExecuteResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * 手动测试执行代码（代码工作台后端）。
 *
 * <p>流程：为每次执行创建独立临时目录 → 写入源码 →（编译型语言先编译）→ 以
 * {@code setsid bash -c 'ulimit …; exec …'} 运行，stdin/stdout/stderr 均落盘，
 * 结束后按上限读取并递归清理目录。
 *
 * <p>防护：源码/输入长度上限、wall-time 超时后按进程组 kill、ulimit 限制 CPU 时间
 * 与子进程数、输出截断、要求登录 + 滑动窗口限流（见 Controller）。
 * 注意：这是"尽力而为"的进程级隔离，适合教学站点自部署；公网部署建议再加容器/沙箱。
 */
@Service
public class CodeExecuteService {

    private static final Logger log = LoggerFactory.getLogger(CodeExecuteService.class);

    public static final int MAX_CODE_CHARS = 20_000;
    public static final int MAX_STDIN_CHARS = 10_000;
    /** stdout / stderr / 编译输出 各自的字节上限。 */
    private static final int MAX_OUTPUT_BYTES = 64 * 1024;

    /** 语言配置：源文件名 / 编译命令（null 表示解释型）/ 运行命令 / 工具链 / 运行期虚存上限 KB（null 不限）。 */
    private record LangDef(String fileName, List<String> compileCmd, List<String> runCmd, String toolchain,
                           Long memLimitKB) {}

    private static final Map<String, LangDef> LANGS = new LinkedHashMap<>();

    static {
        // -v（虚存）仅对 C/C++ 运行期限制：Python/Java/Go/Node 启动即预留大量虚存，设了会直接失败。
        LANGS.put("c", new LangDef("main.c",
                List.of("gcc", "-std=c11", "-O2", "-o", "main", "main.c", "-lm"),
                List.of("./main"), "gcc", 512L * 1024));
        LANGS.put("cpp", new LangDef("main.cpp",
                List.of("g++", "-std=c++17", "-O2", "-o", "main", "main.cpp"),
                List.of("./main"), "g++", 512L * 1024));
        LANGS.put("python", new LangDef("main.py",
                null, List.of("python3", "main.py"), "python3", null));
        LANGS.put("java", new LangDef("Main.java",
                List.of("javac", "-encoding", "UTF-8", "Main.java"),
                List.of("java", "-Xmx128m", "-XX:+UseSerialGC", "-cp", ".", "Main"), "javac", null));
        LANGS.put("go", new LangDef("main.go",
                null, List.of("go", "run", "main.go"), "go", null));
        LANGS.put("javascript", new LangDef("main.js",
                null, List.of("node", "main.js"), "node", null));
    }

    private final int compileTimeoutSec;
    private final int runTimeoutSec;

    public CodeExecuteService(@Value("${suanfa.code.compile-timeout-seconds:10}") int compileTimeoutSec,
                              @Value("${suanfa.code.run-timeout-seconds:10}") int runTimeoutSec) {
        this.compileTimeoutSec = compileTimeoutSec;
        this.runTimeoutSec = runTimeoutSec;
    }

    public List<String> supportedLanguages() {
        return LANGS.entrySet().stream()
                .filter(e -> toolchainAvailable(e.getValue().toolchain()))
                .map(Map.Entry::getKey)
                .toList();
    }

    public boolean isSupported(String language) {
        LangDef def = LANGS.get(norm(language));
        return def != null && toolchainAvailable(def.toolchain());
    }

    public CodeExecuteResponse execute(CodeExecuteRequest req) {
        String lang = norm(req.language());
        LangDef def = LANGS.get(lang);
        if (def == null) {
            return unsupported("不支持的语言: " + req.language());
        }
        if (!toolchainAvailable(def.toolchain())) {
            return unsupported("服务器未安装 " + def.toolchain() + "，该语言暂不可用");
        }
        String code = req.code() == null ? "" : req.code();
        String stdin = req.stdin() == null ? "" : req.stdin();
        if (code.isBlank()) {
            return result("CompileError", null, null, "代码为空", lang);
        }
        if (code.length() > MAX_CODE_CHARS) {
            return result("CompileError", null, null,
                    "代码超长（上限 " + MAX_CODE_CHARS + " 字符）", lang);
        }
        if (stdin.length() > MAX_STDIN_CHARS) {
            return result("CompileError", null, null,
                    "输入超长（上限 " + MAX_STDIN_CHARS + " 字符）", lang);
        }

        Path workDir = null;
        long start = System.currentTimeMillis();
        try {
            workDir = Files.createTempDirectory("suanfa-run-");
            // go 需要可写的构建缓存，指到临时目录内，随目录一起清理
            Map<String, String> extraEnv = "go".equals(lang)
                    ? Map.of("GOCACHE", workDir.resolve(".gocache").toString(),
                             "GOPATH", workDir.resolve(".gopath").toString(),
                             "HOME", workDir.toString())
                    : Map.of();

            String runClass = "Main";
            String fileName = def.fileName();
            if ("java".equals(lang)) {
                // 用户可能把类写成 public class Sol 等：按其类名落盘/运行，避免文件名不匹配报错
                Matcher m = Pattern.compile("public\\s+(?:final\\s+|abstract\\s+)*class\\s+(\\w+)").matcher(code);
                if (m.find()) {
                    runClass = m.group(1);
                    fileName = runClass + ".java";
                }
            }
            Files.writeString(workDir.resolve(fileName), code, StandardCharsets.UTF_8);
            Files.writeString(workDir.resolve("input.txt"), stdin, StandardCharsets.UTF_8);

            List<String> compileCmd = def.compileCmd();
            if ("java".equals(lang) && compileCmd != null) {
                compileCmd = List.of("javac", "-encoding", "UTF-8", fileName);
            }
            List<String> runCmd = def.runCmd();
            if ("java".equals(lang)) {
                runCmd = List.of("java", "-Xmx128m", "-XX:+UseSerialGC", "-cp", ".", runClass);
            }

            if (compileCmd != null) {
                StepResult comp = runProcess(workDir, compileCmd, null, extraEnv, compileTimeoutSec, null);
                if (comp.timeout) {
                    return result("Timeout", null, null, "编译超时（>" + compileTimeoutSec + "s）", lang);
                }
                if (comp.exitCode != 0) {
                    OutCapture err = readCapped(workDir.resolve("stderr.log"));
                    return new CodeExecuteResponse("CompileError", null, null, err.text,
                            comp.exitCode, System.currentTimeMillis() - start, err.truncated, null);
                }
            }

            StepResult run = runProcess(workDir, runCmd, "input.txt", extraEnv, runTimeoutSec, def.memLimitKB());
            OutCapture stdout = readCapped(workDir.resolve("stdout.log"));
            OutCapture stderr = readCapped(workDir.resolve("stderr.log"));
            boolean truncated = stdout.truncated || stderr.truncated;

            String status;
            if (run.timeout) {
                status = "Timeout";
                stderr.text = (stderr.text.isEmpty() ? "" : stderr.text + "\n") + "⏱ 运行超时（>" + runTimeoutSec + "s），已被终止";
            } else if (run.exitCode == 137) {
                // 128+9：被 ulimit -t（CPU 秒数）SIGKILL，同样归为超时
                status = "Timeout";
                stderr.text = (stderr.text.isEmpty() ? "" : stderr.text + "\n") + "⏱ CPU 时间超限（>" + runTimeoutSec + "s），已被终止";
            } else if (run.exitCode == 0) {
                status = "Accepted";
            } else {
                status = "RuntimeError";
                if (stderr.text.isEmpty() && run.exitCode > 128) {
                    stderr.text = "进程被信号 " + (run.exitCode - 128) + " 终止（如段错误/内存不足）";
                }
            }
            return new CodeExecuteResponse(status, stdout.text, stderr.text, null,
                    run.exitCode, System.currentTimeMillis() - start, truncated, null);
        } catch (IOException | InterruptedException e) {
            if (e instanceof InterruptedException) {
                Thread.currentThread().interrupt();
            }
            log.warn("代码执行失败: {}", e.toString());
            return result("RuntimeError", null, null, "执行环境错误: " + e.getMessage(), lang);
        } finally {
            if (workDir != null) {
                cleanup(workDir);
            }
        }
    }

    // ------------------------------------------------------------ 内部工具

    private static String norm(String language) {
        if (language == null) return null;
        String l = language.trim().toLowerCase();
        return switch (l) {
            case "c语言", "clang" -> "c";
            case "c++", "cpp", "c++17", "cplusplus" -> "cpp";
            case "python3", "py" -> "python";
            case "js", "javascript", "node", "nodejs" -> "javascript";
            case "golang" -> "go";
            default -> l;
        };
    }

    private record StepResult(int exitCode, boolean timeout) {}

    /**
     * 在 workDir 下运行命令：setsid 使其成为独立进程组，超时按 -pgid 整组 kill
     * （go run / node 派生的子进程也能被收掉）；stdout/stderr 落盘；
     * ulimit -t 限 CPU 秒、-f 限写盘大小（20480 × 512B = 10MB），可选 -v 限虚存。
     * 注意不设 ulimit -u：RLIMIT_NPROC 按用户全局计数，开发机上极易直接禁止 fork。
     */
    private StepResult runProcess(Path workDir, List<String> cmd, String stdinFile,
                                  Map<String, String> extraEnv, int timeoutSec, Long memLimitKB)
            throws IOException, InterruptedException {
        StringBuilder shell = new StringBuilder();
        shell.append("ulimit -f 20480; ");
        shell.append("ulimit -t ").append(timeoutSec).append("; ");
        if (memLimitKB != null) {
            shell.append("ulimit -v ").append(memLimitKB.longValue()).append("; ");
        }
        shell.append("exec ");
        shell.append(cmd.stream().map(CodeExecuteService::shQuote).reduce((a, b) -> a + " " + b).orElse("true"));
        shell.append(" > 'stdout.log' 2> 'stderr.log'");
        if (stdinFile != null) {
            shell.append(" < ").append(shQuote(stdinFile));
        }

        ProcessBuilder pb = new ProcessBuilder("setsid", "bash", "-c", shell.toString())
                .directory(workDir.toFile())
                .redirectErrorStream(false);
        pb.environment().put("LANG", "C.UTF-8");
        pb.environment().put("LC_ALL", "C.UTF-8");
        extraEnv.forEach(pb.environment()::put);

        Process proc = pb.start();
        boolean timeout = !proc.waitFor(timeoutSec + 2, TimeUnit.SECONDS);
        if (timeout) {
            killTree(proc);
            proc.waitFor(3, TimeUnit.SECONDS);
        }
        return new StepResult(timeout ? -1 : proc.exitValue(), timeout);
    }

    private void killTree(Process proc) {
        long pid = proc.pid();
        try {
            // setsid 使 pid == pgid，负号杀整个进程组
            new ProcessBuilder("kill", "-9", "-" + pid).start().waitFor(3, TimeUnit.SECONDS);
        } catch (Exception e) {
            log.debug("按进程组 kill 失败，回退 destroyForcibly: {}", e.toString());
        }
        proc.destroyForcibly();
    }

    private static String shQuote(String s) {
        return "'" + s.replace("'", "'\\''") + "'";
    }

    static class OutCapture {
        String text;
        boolean truncated;
    }

    private OutCapture readCapped(Path file) throws IOException {
        OutCapture out = new OutCapture();
        if (!Files.exists(file)) {
            out.text = "";
            return out;
        }
        byte[] bytes = Files.readAllBytes(file);
        if (bytes.length > MAX_OUTPUT_BYTES) {
            out.text = new String(bytes, 0, MAX_OUTPUT_BYTES, StandardCharsets.UTF_8)
                    + "\n…（输出过长已截断）";
            out.truncated = true;
        } else {
            out.text = new String(bytes, StandardCharsets.UTF_8).stripTrailing();
        }
        return out;
    }

    private boolean toolchainAvailable(String bin) {
        try {
            Process p = new ProcessBuilder("which", bin).redirectErrorStream(true).start();
            return p.waitFor(3, TimeUnit.SECONDS) && p.exitValue() == 0;
        } catch (Exception e) {
            if (e instanceof InterruptedException) Thread.currentThread().interrupt();
            return false;
        }
    }

    private CodeExecuteResponse unsupported(String message) {
        return new CodeExecuteResponse("Unsupported", "", "", message, null, 0, false, supportedLanguages());
    }

    private CodeExecuteResponse result(String status, String stdout, String stderr, String compileError, String lang) {
        return new CodeExecuteResponse(status, stdout == null ? "" : stdout,
                stderr == null ? "" : stderr, compileError, null, 0, false, null);
    }

    private void cleanup(Path dir) {
        try (var walk = Files.walk(dir)) {
            walk.sorted(Comparator.reverseOrder()).forEach(p -> {
                try {
                    Files.deleteIfExists(p);
                } catch (IOException ignored) {
                }
            });
        } catch (IOException e) {
            log.debug("清理临时目录失败 {}: {}", dir, e.toString());
        }
    }
}
