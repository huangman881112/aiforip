package com.suanfa.entity;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.List;
import java.util.Map;

/** 算法详情内容（MongoDB 文档，collection: algorithm_content，一算法一文档）。 */
@Document("algorithm_content")
public record AlgorithmContent(
        @Id String id,
        String name,
        String category,
        String subCategory,
        String difficulty,
        String stability,
        String description,
        String complexity,
        String route,
        Map<String, Object> complexityDetails,
        Sections sections,
        List<Video> videos,
        List<String> tabs) {

    /** 详情页静态文案区（Markdown 源码，null 表示该算法无此区）。 */
    public record Sections(String basic, String advanced, String defaultNotes) {
    }

    /** 视频解说条目（当前阶段 videos 恒为空数组，字段先行）。 */
    public record Video(String title, String author, String platform, String bvid) {
    }
}
