package com.suanfa.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.suanfa.entity.Algorithm;
import com.suanfa.repository.AlgorithmRepository;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.InputStream;
import java.util.List;

/** 算法元数据服务。启动时若库为空则从 seed/algorithms.json 导入。 */
@Service
public class AlgorithmService {

    private final AlgorithmRepository repository;
    private final ObjectMapper objectMapper;

    public AlgorithmService(AlgorithmRepository repository, ObjectMapper objectMapper) {
        this.repository = repository;
        this.objectMapper = objectMapper;
    }

    /**
     * 幂等种子导入：补齐「种子里有、库里没有」的算法，
     * 因此新增分类（动态规划 / 贪心算法）后无需清库，重启即生效。
     *
     * @return 本次新导入的条数
     */
    public int seedMissing() {
        int added = 0;
        for (Algorithm a : loadSeed()) {
            if (repository.insertIfAbsent(a)) {
                added++;
            }
        }
        return added;
    }

    private List<Algorithm> loadSeed() {
        try {
            ClassPathResource resource = new ClassPathResource("seed/algorithms.json");
            try (InputStream in = resource.getInputStream()) {
                return objectMapper.readValue(
                        in,
                        objectMapper.getTypeFactory().constructCollectionType(List.class, Algorithm.class));
            }
        } catch (IOException e) {
            throw new IllegalStateException("无法加载种子数据 seed/algorithms.json", e);
        }
    }

    public List<Algorithm> list(String category) {
        return category == null || category.isBlank()
                ? repository.findAll()
                : repository.findByCategory(category);
    }

    public Algorithm getById(String id) {
        return repository.findById(id).orElse(null);
    }
}
