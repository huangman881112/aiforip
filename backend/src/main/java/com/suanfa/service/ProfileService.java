package com.suanfa.service;

import com.suanfa.dto.ProfileDtos.ProfileResponse;
import com.suanfa.dto.ProfileDtos.ProfileUpdateRequest;
import com.suanfa.entity.User;
import com.suanfa.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.Locale;
import java.util.Set;

/**
 * 个人中心资料业务：读取 / 更新（校验收口）。
 *
 * <p>约束：名称 ≤ 32 字；gender ∈ male/female/other；年龄 6~120；
 * 城市 / 职业 ≤ 50 字；学习目的 ≤ 200 字。全部选填，传 null / 空串 = 清空该项。
 * 用户名、邮箱、角色不在本接口范围（分别走认证与用户管理）。
 */
@Service
public class ProfileService {

    private static final Logger log = LoggerFactory.getLogger(ProfileService.class);

    public static final Set<String> GENDERS = Set.of("male", "female", "other");

    private static final int MAX_DISPLAY_NAME = 32;
    private static final int MAX_CITY_OCCUPATION = 50;
    private static final int MAX_LEARNING_GOAL = 200;
    private static final int MIN_AGE = 6;
    private static final int MAX_AGE = 120;

    private final UserRepository userRepo;

    public ProfileService(UserRepository userRepo) {
        this.userRepo = userRepo;
    }

    public ProfileResponse get(long userId) {
        return toResponse(mustExist(userId));
    }

    public ProfileResponse update(long userId, ProfileUpdateRequest req) {
        mustExist(userId);
        String displayName = normalizeText(req == null ? null : req.displayName(), MAX_DISPLAY_NAME, "名称");
        String gender = normalizeGender(req == null ? null : req.gender());
        Integer age = normalizeAge(req == null ? null : req.age());
        String city = normalizeText(req == null ? null : req.city(), MAX_CITY_OCCUPATION, "城市");
        String occupation = normalizeText(req == null ? null : req.occupation(), MAX_CITY_OCCUPATION, "职业");
        String goal = normalizeText(req == null ? null : req.learningGoal(), MAX_LEARNING_GOAL, "学习目的");

        userRepo.updateProfile(userId, displayName, gender, age, city, occupation, goal);
        log.info("用户 {} 已更新个人资料：displayName={} gender={} age={} city={} occupation={} goal={}",
                userId, displayName, gender, age, city, occupation,
                goal == null ? "" : ("(" + goal.length() + "字)"));
        return toResponse(mustExist(userId));
    }

    // ------------------------------------------------------------ 内部工具

    private User mustExist(long userId) {
        return userRepo.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("用户不存在"));
    }

    private ProfileResponse toResponse(User u) {
        return new ProfileResponse(u.username(), u.email(), u.displayName(), u.gender(), u.age(),
                u.city(), u.occupation(), u.learningGoal(),
                OrderService.isMemberActive(u.membershipExpireAt()), u.membershipExpireAt());
    }

    /** trim + 空串 → null + 长度上限。 */
    private static String normalizeText(String raw, int max, String label) {
        if (raw == null) {
            return null;
        }
        String v = raw.trim();
        if (v.isEmpty()) {
            return null;
        }
        if (v.length() > max) {
            throw new IllegalArgumentException(label + "最多 " + max + " 字");
        }
        return v;
    }

    private static String normalizeGender(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        String v = raw.trim().toLowerCase(Locale.ROOT);
        if (!GENDERS.contains(v)) {
            throw new IllegalArgumentException("性别只能是 male / female / other");
        }
        return v;
    }

    private static Integer normalizeAge(Integer age) {
        if (age == null) {
            return null;
        }
        if (age < MIN_AGE || age > MAX_AGE) {
            throw new IllegalArgumentException("年龄需在 " + MIN_AGE + " ~ " + MAX_AGE + " 之间");
        }
        return age;
    }
}
