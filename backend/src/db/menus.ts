/**
 * 菜单数据库操作模块
 *
 * 提供菜单的 CRUD 操作和权限查询
 *
 * @module db/menus
 */

import Database from "better-sqlite3";
import { v4 as uuidv4 } from "uuid";

/** 菜单项接口 */
export interface MenuItem {
  id: string;
  parentId: string | null;
  path: string;
  name: string;
  component: string | null;
  redirect: string | null;
  meta: {
    title: string;
    icon?: string;
    badge?: string;
    hideInMenu?: boolean;
  };
  sort: number;
  status: number;
  createdAt: string;
  updatedAt: string;
}

/** 前端菜单格式 */
export interface FrontendMenu {
  path: string;
  name: string;
  component?: string;
  redirect?: string;
  meta: {
    title: string;
    icon?: string;
    badge?: string;
    hideInMenu?: boolean;
  };
  children?: FrontendMenu[];
}

let db: Database.Database;

/**
 * 初始化数据库连接
 */
export function initDb(database: Database.Database): void {
  db = database;
  initDefaultMenus();
}

/**
 * 初始化默认菜单数据
 */
function initDefaultMenus(): void {
  const count = db.prepare("SELECT COUNT(*) as count FROM menus").get() as {
    count: number;
  };
  if (count.count > 0) return;

  const now = new Date().toISOString();
  const menus: Omit<MenuItem, "createdAt" | "updatedAt">[] = [
    // 中心看板
    {
      id: "menu-dashboard",
      parentId: null,
      path: "/dashboard",
      name: "Dashboard",
      component: "/dashboard/index",
      redirect: null,
      meta: { title: "中心看板", icon: "lucide:layout-dashboard" },
      sort: 1,
      status: 1,
    },
    // 转码中心
    {
      id: "menu-transcode",
      parentId: null,
      path: "/transcode",
      name: "Transcode",
      component: null,
      redirect: "/transcode/video",
      meta: { title: "转码中心", icon: "lucide:film" },
      sort: 2,
      status: 1,
    },
    {
      id: "menu-transcode-video",
      parentId: "menu-transcode",
      path: "video",
      name: "TranscodeVideo",
      component: "/video/index",
      redirect: null,
      meta: { title: "视频转码", icon: "lucide:video" },
      sort: 1,
      status: 1,
    },
    {
      id: "menu-transcode-image",
      parentId: "menu-transcode",
      path: "image",
      name: "TranscodeImage",
      component: "/image/index",
      redirect: null,
      meta: { title: "图片转码", icon: "lucide:image" },
      sort: 2,
      status: 1,
    },
    {
      id: "menu-transcode-document",
      parentId: "menu-transcode",
      path: "document",
      name: "TranscodeDocument",
      component: "/document/index",
      redirect: null,
      meta: { title: "文档转换", icon: "lucide:file-text" },
      sort: 3,
      status: 1,
    },
    // 任务管理
    {
      id: "menu-tasks",
      parentId: null,
      path: "/tasks",
      name: "Tasks",
      component: null,
      redirect: "/tasks/all",
      meta: { title: "任务管理", icon: "lucide:list-todo" },
      sort: 3,
      status: 1,
    },
    {
      id: "menu-tasks-all",
      parentId: "menu-tasks",
      path: "all",
      name: "TasksAll",
      component: "/tasks/index",
      redirect: null,
      meta: { title: "全部任务" },
      sort: 1,
      status: 1,
    },
    {
      id: "menu-tasks-processing",
      parentId: "menu-tasks",
      path: "processing",
      name: "TasksProcessing",
      component: "/tasks/processing",
      redirect: null,
      meta: { title: "进行中" },
      sort: 2,
      status: 1,
    },
    {
      id: "menu-tasks-completed",
      parentId: "menu-tasks",
      path: "completed",
      name: "TasksCompleted",
      component: "/tasks/completed",
      redirect: null,
      meta: { title: "已完成" },
      sort: 3,
      status: 1,
    },
    // 消息中心
    {
      id: "menu-message",
      parentId: null,
      path: "/message",
      name: "Message",
      component: "/message/index",
      redirect: null,
      meta: { title: "消息中心", icon: "lucide:bell" },
      sort: 4,
      status: 1,
    },
    // 系统管理
    {
      id: "menu-system",
      parentId: null,
      path: "/system",
      name: "System",
      component: null,
      redirect: "/system/presets",
      meta: { title: "系统管理", icon: "lucide:settings" },
      sort: 5,
      status: 1,
    },
    {
      id: "menu-system-presets",
      parentId: "menu-system",
      path: "presets",
      name: "SystemPresets",
      component: "/settings/presets",
      redirect: null,
      meta: { title: "转码预设" },
      sort: 1,
      status: 1,
    },
    {
      id: "menu-system-config",
      parentId: "menu-system",
      path: "config",
      name: "SystemConfig",
      component: "/settings/index",
      redirect: null,
      meta: { title: "系统配置" },
      sort: 2,
      status: 1,
    },
    {
      id: "menu-system-users",
      parentId: "menu-system",
      path: "users",
      name: "SystemUsers",
      component: "/settings/users",
      redirect: null,
      meta: { title: "用户管理" },
      sort: 3,
      status: 1,
    },
  ];

  const insertMenu = db.prepare(`
    INSERT INTO menus (id, parent_id, path, name, component, redirect, meta, sort, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const menu of menus) {
    insertMenu.run(
      menu.id,
      menu.parentId,
      menu.path,
      menu.name,
      menu.component,
      menu.redirect,
      JSON.stringify(menu.meta),
      menu.sort,
      menu.status,
      now,
      now
    );
  }

  // 初始化角色菜单关联
  const roleMenus: { role: string; menuId: string }[] = [];

  // 普通用户菜单
  const userMenuIds = [
    "menu-dashboard",
    "menu-transcode",
    "menu-transcode-video",
    "menu-transcode-image",
    "menu-transcode-document",
    "menu-tasks",
    "menu-tasks-all",
    "menu-tasks-processing",
    "menu-tasks-completed",
    "menu-message",
  ];

  // 管理员额外菜单
  const adminMenuIds = [
    "menu-system",
    "menu-system-presets",
    "menu-system-config",
    "menu-system-users",
  ];

  // user 角色
  for (const menuId of userMenuIds) {
    roleMenus.push({ role: "user", menuId });
  }

  // admin 角色（继承 user 菜单）
  for (const menuId of [...userMenuIds, ...adminMenuIds]) {
    roleMenus.push({ role: "admin", menuId });
  }

  // super 角色（全部菜单）
  for (const menu of menus) {
    roleMenus.push({ role: "super", menuId: menu.id });
  }

  const insertRoleMenu = db.prepare(`
    INSERT OR IGNORE INTO role_menus (role, menu_id) VALUES (?, ?)
  `);

  for (const rm of roleMenus) {
    insertRoleMenu.run(rm.role, rm.menuId);
  }

  console.log("[菜单] 初始化默认菜单数据完成");
}

/**
 * 获取用户角色的菜单列表
 */
export function getMenusByRole(role: string): FrontendMenu[] {
  // 查询角色关联的菜单ID
  const roleMenus = db
    .prepare(
      `
    SELECT menu_id FROM role_menus WHERE role = ?
  `
    )
    .all(role) as { menu_id: string }[];

  const menuIds = roleMenus.map((rm) => rm.menu_id);
  if (menuIds.length === 0) return [];

  // 查询菜单详情
  const placeholders = menuIds.map(() => "?").join(",");
  const menus = db
    .prepare(
      `
    SELECT * FROM menus WHERE id IN (${placeholders}) AND status = 1 ORDER BY sort ASC
  `
    )
    .all(...menuIds) as any[];

  // 转换为前端格式并构建树形结构
  return buildMenuTree(menus);
}

/**
 * 构建菜单树
 */
function buildMenuTree(menus: any[]): FrontendMenu[] {
  const menuMap = new Map<string, any>();
  const rootMenus: FrontendMenu[] = [];

  // 先转换为统一格式
  for (const menu of menus) {
    menuMap.set(menu.id, {
      id: menu.id,
      parentId: menu.parent_id,
      path: menu.path,
      name: menu.name,
      component: menu.component,
      redirect: menu.redirect,
      meta: JSON.parse(menu.meta),
      sort: menu.sort,
    });
  }

  // 构建树形结构
  for (const menu of menuMap.values()) {
    if (!menu.parentId) {
      rootMenus.push(menu);
    } else {
      const parent = menuMap.get(menu.parentId);
      if (parent) {
        if (!parent.children) parent.children = [];
        parent.children.push(menu);
      }
    }
  }

  // 清理内部属性
  return cleanMenuTree(rootMenus);
}

/**
 * 清理菜单树内部属性
 */
function cleanMenuTree(menus: any[]): FrontendMenu[] {
  return menus.map((menu) => {
    const result: FrontendMenu = {
      path: menu.path,
      name: menu.name,
      meta: menu.meta,
    };
    if (menu.component) result.component = menu.component;
    if (menu.redirect) result.redirect = menu.redirect;
    if (menu.children && menu.children.length > 0) {
      result.children = cleanMenuTree(menu.children);
    }
    return result;
  });
}

/**
 * 获取所有菜单（管理员用）
 */
export function getAllMenus(): MenuItem[] {
  const menus = db
    .prepare("SELECT * FROM menus ORDER BY sort ASC")
    .all() as any[];

  return menus.map((m) => ({
    id: m.id,
    parentId: m.parent_id,
    path: m.path,
    name: m.name,
    component: m.component,
    redirect: m.redirect,
    meta: JSON.parse(m.meta),
    sort: m.sort,
    status: m.status,
    createdAt: m.created_at,
    updatedAt: m.updated_at,
  }));
}

/**
 * 创建菜单
 */
export function createMenu(
  data: Omit<MenuItem, "id" | "createdAt" | "updatedAt">
): MenuItem {
  const id = `menu-${uuidv4()}`;
  const now = new Date().toISOString();

  db.prepare(
    `
    INSERT INTO menus (id, parent_id, path, name, component, redirect, meta, sort, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `
  ).run(
    id,
    data.parentId,
    data.path,
    data.name,
    data.component,
    data.redirect,
    JSON.stringify(data.meta),
    data.sort,
    data.status,
    now,
    now
  );

  return {
    ...data,
    id,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * 更新菜单
 */
export function updateMenu(
  id: string,
  data: Partial<Omit<MenuItem, "id" | "createdAt" | "updatedAt">>
): MenuItem | null {
  const existing = db.prepare("SELECT * FROM menus WHERE id = ?").get(id);
  if (!existing) return null;

  const now = new Date().toISOString();
  const updates: string[] = [];
  const values: any[] = [];

  if (data.parentId !== undefined) {
    updates.push("parent_id = ?");
    values.push(data.parentId);
  }
  if (data.path !== undefined) {
    updates.push("path = ?");
    values.push(data.path);
  }
  if (data.name !== undefined) {
    updates.push("name = ?");
    values.push(data.name);
  }
  if (data.component !== undefined) {
    updates.push("component = ?");
    values.push(data.component);
  }
  if (data.redirect !== undefined) {
    updates.push("redirect = ?");
    values.push(data.redirect);
  }
  if (data.meta !== undefined) {
    updates.push("meta = ?");
    values.push(JSON.stringify(data.meta));
  }
  if (data.sort !== undefined) {
    updates.push("sort = ?");
    values.push(data.sort);
  }
  if (data.status !== undefined) {
    updates.push("status = ?");
    values.push(data.status);
  }

  if (updates.length > 0) {
    updates.push("updated_at = ?");
    values.push(now);
    values.push(id);

    db.prepare(`UPDATE menus SET ${updates.join(", ")} WHERE id = ?`).run(
      ...values
    );
  }

  return getMenuById(id);
}

/**
 * 获取单个菜单
 */
export function getMenuById(id: string): MenuItem | null {
  const menu = db.prepare("SELECT * FROM menus WHERE id = ?").get(id) as any;
  if (!menu) return null;

  return {
    id: menu.id,
    parentId: menu.parent_id,
    path: menu.path,
    name: menu.name,
    component: menu.component,
    redirect: menu.redirect,
    meta: JSON.parse(menu.meta),
    sort: menu.sort,
    status: menu.status,
    createdAt: menu.created_at,
    updatedAt: menu.updated_at,
  };
}

/**
 * 删除菜单
 */
export function deleteMenu(id: string): boolean {
  // 删除子菜单
  db.prepare("DELETE FROM menus WHERE parent_id = ?").run(id);
  // 删除角色关联
  db.prepare("DELETE FROM role_menus WHERE menu_id = ?").run(id);
  // 删除菜单
  const result = db.prepare("DELETE FROM menus WHERE id = ?").run(id);
  return result.changes > 0;
}

/**
 * 更新角色菜单
 */
export function updateRoleMenus(role: string, menuIds: string[]): void {
  // 删除旧关联
  db.prepare("DELETE FROM role_menus WHERE role = ?").run(role);

  // 添加新关联
  const insert = db.prepare(
    "INSERT INTO role_menus (role, menu_id) VALUES (?, ?)"
  );
  for (const menuId of menuIds) {
    insert.run(role, menuId);
  }
}