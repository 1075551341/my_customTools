/**
 * 权限码数据库操作模块
 *
 * 提供权限码的查询和管理
 *
 * @module db/permissions
 */

import Database from "better-sqlite3";
import { v4 as uuidv4 } from "uuid";

/** 权限项接口 */
export interface Permission {
  id: string;
  code: string;
  name: string;
  description: string | null;
  createdAt: string;
}

let db: Database.Database;

/**
 * 初始化数据库连接
 */
export function initDb(database: Database.Database): void {
  db = database;
  initDefaultPermissions();
}

/**
 * 初始化默认权限数据
 */
function initDefaultPermissions(): void {
  const count = db
    .prepare("SELECT COUNT(*) as count FROM permissions")
    .get() as { count: number };
  if (count.count > 0) return;

  const now = new Date().toISOString();
  const permissions: Omit<Permission, "createdAt">[] = [
    // 用户基础权限
    { id: "perm-user-view", code: "user:view", name: "查看用户信息", description: null },
    { id: "perm-user-edit", code: "user:edit", name: "编辑个人信息", description: null },

    // 上传权限
    { id: "perm-upload", code: "upload", name: "文件上传", description: null },
    { id: "perm-download", code: "download", name: "文件下载", description: null },

    // 任务权限
    { id: "perm-task-view", code: "task:view", name: "查看任务", description: null },
    { id: "perm-task-create", code: "task:create", name: "创建任务", description: null },
    { id: "perm-task-cancel", code: "task:cancel", name: "取消任务", description: null },
    { id: "perm-task-delete", code: "task:delete", name: "删除任务", description: null },
    { id: "perm-task-retry", code: "task:retry", name: "重试任务", description: null },
    { id: "perm-task-batch", code: "task:batch", name: "批量任务", description: null },

    // 预设权限
    { id: "perm-preset-view", code: "preset:view", name: "查看预设", description: null },
    { id: "perm-preset-create", code: "preset:create", name: "创建预设", description: null },
    { id: "perm-preset-edit", code: "preset:edit", name: "编辑预设", description: null },
    { id: "perm-preset-delete", code: "preset:delete", name: "删除预设", description: null },

    // 系统配置权限
    { id: "perm-config-view", code: "config:view", name: "查看配置", description: null },
    { id: "perm-config-edit", code: "config:edit", name: "修改配置", description: null },

    // 用户管理权限
    { id: "perm-user-manage", code: "user:manage", name: "用户管理", description: null },
    { id: "perm-user-create", code: "user:create", name: "创建用户", description: null },
    { id: "perm-user-delete", code: "user:delete", name: "删除用户", description: null },

    // 系统管理权限
    { id: "perm-system", code: "system", name: "系统管理", description: null },
    { id: "perm-admin", code: "admin", name: "管理员权限", description: null },
    { id: "perm-super", code: "super", name: "超级管理员权限", description: null },
  ];

  const insertPerm = db.prepare(`
    INSERT INTO permissions (id, code, name, description, created_at)
    VALUES (?, ?, ?, ?, ?)
  `);

  for (const perm of permissions) {
    insertPerm.run(perm.id, perm.code, perm.name, perm.description || null, now);
  }

  // 初始化角色权限关联
  const rolePerms: { role: string; permId: string }[] = [];

  // user 角色权限
  const userPerms = [
    "perm-user-view",
    "perm-user-edit",
    "perm-upload",
    "perm-download",
    "perm-task-view",
    "perm-task-create",
    "perm-task-cancel",
    "perm-task-delete",
    "perm-task-retry",
    "perm-task-batch",
    "perm-preset-view",
    "perm-preset-create",
    "perm-preset-edit",
    "perm-preset-delete",
  ];

  // admin 额外权限
  const adminPerms = [
    "perm-config-view",
    "perm-config-edit",
    "perm-user-manage",
    "perm-user-create",
    "perm-user-delete",
    "perm-admin",
  ];

  // super 全部权限
  const superPerms = ["perm-system", "perm-super"];

  for (const permId of userPerms) {
    rolePerms.push({ role: "user", permId });
  }
  for (const permId of [...userPerms, ...adminPerms]) {
    rolePerms.push({ role: "admin", permId });
  }
  for (const perm of permissions) {
    rolePerms.push({ role: "super", permId: perm.id });
  }

  const insertRolePerm = db.prepare(`
    INSERT OR IGNORE INTO role_permissions (role, permission_id) VALUES (?, ?)
  `);

  for (const rp of rolePerms) {
    insertRolePerm.run(rp.role, rp.permId);
  }

  console.log("[权限] 初始化默认权限数据完成");
}

/**
 * 获取用户角色的权限码列表
 */
export function getPermissionCodesByRole(role: string): string[] {
  const rows = db
    .prepare(
      `
    SELECT p.code
    FROM permissions p
    JOIN role_permissions rp ON p.id = rp.permission_id
    WHERE rp.role = ?
  `
    )
    .all(role) as { code: string }[];

  return rows.map((r) => r.code);
}

/**
 * 获取所有权限
 */
export function getAllPermissions(): Permission[] {
  const rows = db.prepare("SELECT * FROM permissions ORDER BY code").all() as any[];

  return rows.map((r) => ({
    id: r.id,
    code: r.code,
    name: r.name,
    description: r.description,
    createdAt: r.created_at,
  }));
}

/**
 * 创建权限
 */
export function createPermission(
  data: Omit<Permission, "id" | "createdAt">
): Permission {
  const id = `perm-${uuidv4()}`;
  const now = new Date().toISOString();

  db.prepare(
    `
    INSERT INTO permissions (id, code, name, description, created_at)
    VALUES (?, ?, ?, ?, ?)
  `
  ).run(id, data.code, data.name, data.description || null, now);

  return {
    ...data,
    id,
    createdAt: now,
  };
}

/**
 * 删除权限
 */
export function deletePermission(id: string): boolean {
  db.prepare("DELETE FROM role_permissions WHERE permission_id = ?").run(id);
  const result = db.prepare("DELETE FROM permissions WHERE id = ?").run(id);
  return result.changes > 0;
}

/**
 * 更新角色权限
 */
export function updateRolePermissions(role: string, permIds: string[]): void {
  db.prepare("DELETE FROM role_permissions WHERE role = ?").run(role);

  const insert = db.prepare(
    "INSERT INTO role_permissions (role, permission_id) VALUES (?, ?)"
  );
  for (const permId of permIds) {
    insert.run(role, permId);
  }
}

/**
 * 检查用户是否有指定权限
 */
export function hasPermission(role: string, code: string): boolean {
  const row = db
    .prepare(
      `
    SELECT 1
    FROM permissions p
    JOIN role_permissions rp ON p.id = rp.permission_id
    WHERE rp.role = ? AND p.code = ?
  `
    )
    .get(role, code);

  return !!row;
}