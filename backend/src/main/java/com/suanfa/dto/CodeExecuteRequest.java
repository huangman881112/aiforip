package com.suanfa.dto;

/** 手动测试执行代码请求：language + 源码 + 标准输入。 */
public record CodeExecuteRequest(String language, String code, String stdin) {
}
