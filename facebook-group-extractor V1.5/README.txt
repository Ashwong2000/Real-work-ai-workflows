FB Group Extractor V1.5

Fixes:
1. Fixed an issue where the group name was incorrectly identified as "Visit" (or "Access").
2. Group names are now prioritized for extraction from the first segment of `group_basic_info`—specifically, the content preceding the privacy status (Public/Private) and member count.
3. Added `unread_posts` / `unread_posts_number` fields.
4. Added `joined_time` field.
5. Retained the group name and avatar cleaning rules from V1.4.

Example:
LASER FILES Public · 65K members · 25 unread posts · Joined: Dec 2025 17 friends have joined Visit

Parsed as:
group_name: LASER FILES
privacy_status: Public
member_count_number: 65000
unread_posts_number: 25
friends_joined_number: 17
joined_time: Joined: Dec 2025

修复内容：
1. 修复小组名被识别成“访问”的问题。
2. 小组名优先从 group_basic_info 的第一段提取，也就是公开/非公开/成员数之前的内容。
3. 新增 unread_posts / unread_posts_number 字段。
4. 新增 joined_time 字段。
5. 继续保留 V1.4 的小组名头像清洗规则。

示例：
LASER FILES 公开 · 6.5 万位成员 · 25 篇未读帖子 · 加入时间：2025年12月 17 位好友已加入 访问

会识别为：
group_name: LASER FILES
privacy_status: Public
member_count_number: 65000
unread_posts_number: 25
friends_joined_number: 17
joined_time: 加入时间：2025年12月
