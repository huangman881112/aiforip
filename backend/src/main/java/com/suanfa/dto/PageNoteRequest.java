package com.suanfa.dto;

/** POST /api/page-notes 请求体：在当前页面新增一条笔记。 */
public record PageNoteRequest(
        String path,      // 页面路由路径（页面唯一标识）
        String menuPath,  // 菜单路径展示名（如「算法 / 排序算法」）
        String content) { // 笔记正文
}
