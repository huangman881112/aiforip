package com.suanfa.controller;

import com.suanfa.entity.AlgorithmContent;
import com.suanfa.service.AlgorithmContentService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** 算法详情内容接口（统一详情页的数据源，公开只读）。 */
@RestController
@RequestMapping("/api/algorithms")
public class AlgorithmContentController {

    private final AlgorithmContentService contentService;

    public AlgorithmContentController(AlgorithmContentService contentService) {
        this.contentService = contentService;
    }

    @GetMapping("/{id}/content")
    public ResponseEntity<AlgorithmContent> get(@PathVariable String id) {
        AlgorithmContent content = contentService.getById(id);
        return content == null ? ResponseEntity.notFound().build() : ResponseEntity.ok(content);
    }
}
