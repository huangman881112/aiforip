package com.suanfa.dto;

/** PUT /api/users/:id/progress/:algorithmId 请求体 */
public record ProgressUpdateRequest(String status) {
}
