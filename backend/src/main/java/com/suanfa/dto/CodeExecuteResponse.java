package com.suanfa.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.util.List;

/**
 * 代码执行结果。
 *
 * @param status        Accepted（正常退出）/ WrongAnswer（非 0 退出）/ CompileError / RuntimeError / Timeout / Limited
 * @param compileError  编译输出（仅编译型语言且编译失败时非空）
 * @param truncated     stdout/stderr 是否因超长被截断
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record CodeExecuteResponse(
        String status,
        String stdout,
        String stderr,
        String compileError,
        Integer exitCode,
        long timeMs,
        boolean truncated,
        List<String> supportedLanguages) {
}
