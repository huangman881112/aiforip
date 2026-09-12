package com.suanfa.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.servlet.resource.NoResourceFoundException;

/**
 * 全局异常 → 统一 JSON 错误响应。
 *
 * <p>路由类异常（405 方法不对、404 没有这个接口、400 请求体解析失败）必须原样返回状态码，
 * 否则会被兜底的 500 吞掉：例如前端把「清空 AI 页面配置」误发到 {@code POST /api/ai/settings}（该路径只有 PUT），
 * 之前只会看到 {@code 500 服务器内部错误}，排查成本高。
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErrorBody> handleBadRequest(IllegalArgumentException e) {
        return ResponseEntity.badRequest().body(new ErrorBody(e.getMessage()));
    }

    /** 路径存在但方法不对（如把 POST 发到只支持 PUT 的接口）。 */
    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<ErrorBody> handleMethodNotSupported(HttpRequestMethodNotSupportedException e) {
        log.warn("请求方法不支持：{}（支持：{}）", e.getMethod(), e.getSupportedHttpMethods());
        return ResponseEntity.status(HttpStatus.METHOD_NOT_ALLOWED)
                .body(new ErrorBody("该接口不支持 " + e.getMethod() + " 请求（支持 " + e.getSupportedHttpMethods()
                        + "），请检查前端请求路径与方法"));
    }

    /** 没有这个接口（前端打到旧后端时常见）。 */
    @ExceptionHandler({NoResourceFoundException.class, org.springframework.web.servlet.NoHandlerFoundException.class})
    public ResponseEntity<ErrorBody> handleNotFound(Exception e) {
        log.warn("接口不存在：{}", e.getMessage());
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new ErrorBody("接口不存在（后端版本可能过旧）"));
    }

    @ExceptionHandler({HttpMessageNotReadableException.class, MissingServletRequestParameterException.class})
    public ResponseEntity<ErrorBody> handleUnreadable(Exception e) {
        log.warn("请求参数/请求体解析失败：{}", e.getMessage());
        return ResponseEntity.badRequest().body(new ErrorBody("请求格式不正确：" + shortMsg(e)));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorBody> handleOther(Exception e) {
        log.error("服务器内部错误", e);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ErrorBody("服务器内部错误：" + e.getClass().getSimpleName()));
    }

    private static String shortMsg(Exception e) {
        String m = String.valueOf(e.getMessage());
        int nl = m.indexOf('\n');
        return nl > 0 ? m.substring(0, nl) : m;
    }

    public record ErrorBody(String message) {
    }
}
