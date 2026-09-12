package com.suanfa.repository;

import com.suanfa.entity.AlgorithmContent;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface AlgorithmContentRepository extends MongoRepository<AlgorithmContent, String> {
}
