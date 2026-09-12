package com.suanfa.dto;

/** PUT /api/users/:id/notes/:algorithmId 请求体 */
public record NoteUpdateRequest(String content) {
}
