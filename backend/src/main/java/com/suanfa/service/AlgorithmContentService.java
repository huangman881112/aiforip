package com.suanfa.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.suanfa.entity.AlgorithmContent;
import com.suanfa.repository.AlgorithmContentRepository;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;

/** 算法详情内容服务（MongoDB）。启动时若集合为空则从 seed/algorithms-content.json 导入。 */
@Service
public class AlgorithmContentService {

    private final AlgorithmContentRepository repository;
    private final ObjectMapper objectMapper;

    public AlgorithmContentService(AlgorithmContentRepository repository, ObjectMapper objectMapper) {
        this.repository = repository;
        this.objectMapper = objectMapper;
    }

    /**
     * 幂等种子导入：只补集合中缺失的文档（新增算法分类后无需清库）。
     * 已存在的文档保持原样，便于在库里手工修订内容。
     *
     * @return 本次新导入的条数
     */
    public int seedMissing() {
        List<AlgorithmContent> missing = new ArrayList<>();
        for (AlgorithmContent doc : loadSeed()) {
            if (repository.findById(doc.id()).isEmpty()) {
                missing.add(doc);
            }
        }
        if (!missing.isEmpty()) {
            repository.insert(missing);
        }
        return missing.size();
    }

    private List<AlgorithmContent> loadSeed() {
        try {
            ClassPathResource resource = new ClassPathResource("seed/algorithms-content.json");
            try (InputStream in = resource.getInputStream()) {
                return objectMapper.readValue(
                        in,
                        objectMapper.getTypeFactory().constructCollectionType(List.class, AlgorithmContent.class));
            }
        } catch (IOException e) {
            throw new IllegalStateException("无法加载种子数据 seed/algorithms-content.json", e);
        }
    }

    public long count() {
        return repository.count();
    }

    public AlgorithmContent getById(String id) {
        return repository.findById(id).orElse(null);
    }
}
