package com.suanfa.dto;

/**
 * 「个人中心 → 个人信息」接口出入参。
 *
 * <p>六个资料字段（displayName / gender / age / city / occupation / learningGoal）均可为空；
 * gender 用代码值 male / female / other（前端负责展示为 男 / 女 / 其他）。
 */
public final class ProfileDtos {

    private ProfileDtos() {
    }

    /** 资料视图：账号上下文（username / email / 会员状态）+ 六个资料字段。 */
    public record ProfileResponse(
            String username,
            String email,
            String displayName,
            String gender,
            Integer age,
            String city,
            String occupation,
            String learningGoal,
            boolean membershipActive,
            String membershipExpireAt) {
    }

    /** 更新请求（PUT 全量语义：字段可为 null 表示清空该项；校验收口在 ProfileService）。 */
    public record ProfileUpdateRequest(
            String displayName,
            String gender,
            Integer age,
            String city,
            String occupation,
            String learningGoal) {
    }
}
