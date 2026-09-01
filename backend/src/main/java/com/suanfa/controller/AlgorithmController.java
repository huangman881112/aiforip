package com.suanfa.controller;

import com.suanfa.entity.Algorithm;
import com.suanfa.service.AlgorithmService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** 算法元数据接口（阶段一数据源的服务器版）。 */
@RestController
@RequestMapping("/api/algorithms")
public class AlgorithmController {

    private final AlgorithmService algorithmService;

    public AlgorithmController(AlgorithmService algorithmService) {
        this.algorithmService = algorithmService;
    }

    @GetMapping
    public List<Algorithm> list(@RequestParam(required = false) String category) {
        return algorithmService.list(category);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Algorithm> get(@PathVariable String id) {
        Algorithm a = algorithmService.getById(id);
        return a == null ? ResponseEntity.notFound().build() : ResponseEntity.ok(a);
    }
}
