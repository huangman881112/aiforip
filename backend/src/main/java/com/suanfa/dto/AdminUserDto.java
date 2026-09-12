package com.suanfa.dto;

/**
 * 「用户管理」（仅管理员）接口的出入参。
 *
 * <p>任何响应都不含密码哈希；{@code admin} 字段是后端算好的最终身份判定（页面角色 + 配置白名单）。
 */
public final class AdminUserDto {

    private AdminUserDto() {
    }

    /** 列表行：用户基本信息 + 该账号的学习数据量（供管理员判断是否能删除）。 */
    public record Row(
            Long id,
            String username,
            String email,
            String role,
            boolean admin,
            boolean whitelisted,
            String createdAt,
            long progressCount,
            long noteCount,
            long commentCount,
            long trainingCount) {
    }

    /** 新建用户：username / password 必填，email、role（user|admin）可选。 */
    public record CreateRequest(String username, String password, String email, String role) {
    }

    /**
     * 编辑用户：字段为 null 表示不改动该项。
     *
     * <p>改名会同时改变 JWT 里的用户名之外的所有展示与评论署名（token 里的旧名会随下次登录刷新）。
     */
    public record UpdateRequest(String username, String email, String role) {
    }

    /** 管理员重置密码（无需原密码 / 邮箱验证码）。成功后该账号需重新登录。 */
    public record PasswordRequest(String password) {
    }

    /** 列表响应：总数 + 行数据 + 自我保护提示所需的当前管理员 id。 */
    public record ListResponse(long total, java.util.List<Row> users) {
    }
}
