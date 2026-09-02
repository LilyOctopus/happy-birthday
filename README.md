# 🎂 生日回忆网站

大学同学 30 岁生日礼物。每年农历七月廿一打开,蛋糕 + 烟花。平时是回忆时间线,支持密码上传照片和故事。

## 功能

- **农历生日触发**: 农历 7 月 21 当天打开,弹出 CSS 自制蛋糕动画 + 烟花特效(`solarlunar` 转换)
- **回忆时间线**: 照片 + 文字故事,按日期倒序滚动
- **密码上传**: 输入共享密码即可上传照片和故事,持续扩展回忆

## 技术栈

Next.js 16 (App Router) · TypeScript · Tailwind 4 · Supabase (Postgres + Storage) · Vercel

## 本地开发

```bash
pnpm install
cp .env.example .env.local   # 填入 Supabase 配置
pnpm dev                     # http://localhost:3000
```

## Supabase 设置

1. 创建项目,拿 URL + anon key + service role key
2. 建表:

```sql
create table stories (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text,
  image_url text,
  event_date date,
  created_at timestamptz default now(),
  sort_order int default 0
);
```

3. 建 Storage bucket `birthday-images`,公开读
4. RLS: `stories` 允许匿名 `SELECT`,写入仅 service_role;bucket 同理

```sql
alter table stories enable row level security;

create policy "public read stories"
  on stories for select using (true);

create policy "service role write stories"
  on stories for all using (auth.role() = 'service_role');
```

## 部署

推 GitHub → Vercel import → 填 4 个环境变量 → deploy。

## 农历生日判断

`lib/birthday.ts`: 用 `solarlunar.lunar2solar(year, 7, 21, false)` 反推当年农历 7/21 的公历日期,固定 `Asia/Shanghai` 时区。2026 年农历 7/21 = 2026-09-02。已过则自动倒计时到明年。

> 注: `solarlunar@3` 的 d.ts 与 `exports` 字段不匹配,TS 无法解析,已在 `types/solarlunar.d.ts` 手动声明。
