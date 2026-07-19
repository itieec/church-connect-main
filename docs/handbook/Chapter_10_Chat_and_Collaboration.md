# Chapter 10 — Chat and Collaboration

**Status:** Draft handbook chapter (planning authority until PDF revision)  
**Depends on:** Chapters 3–6  
**Governing ADR:** ADR-004  

---

## 10.1 Purpose

The Chat and Collaboration Engine provides organization-owned messaging channels for ministry coordination. Chat supports Follow-Up and other teams but must never become a hidden permission system.

## 10.2 Design principles

1. **Chat membership ≠ team membership** (ADR-004).  
2. Joining a channel does **not** grant team module permissions or protected ministry-record access.  
3. Teams may have **multiple** channels.  
4. Chat data is **organization-scoped** and isolated.  
5. Parent channels (if any) do not grant local org operational data access.  
6. Soft delete / moderation actions are audited.  
7. UI membership lists are not security for Person records.

## 10.3 Core entities

| Entity | Purpose |
| --- | --- |
| `chatChannels` | Channel metadata (org, related team optional, type, status) |
| `chatMemberships` | Who may participate in the channel |
| `chatMessages` | Message body, sender, timestamps, soft-delete |
| Optional threads / attachments | Via File service references |

Messages must not store unbounded nested replies inside a single document when growth is expected — use collections.

## 10.4 Channel types (baseline)

- **Team operational channel** — default Follow-Up coordination  
- **Case / newcomer channel** (optional later) — selected participants around one journey  
- **Cross-team invite channel** — members from other teams without granting Follow-Up record access  
- **Parent coordination channel** — selected participants across orgs; local data remains local  

## 10.5 Membership rules

- Add/remove members with `follow_up.chat.manage` / `chat.manage_members` (or platform chat manage permissions) inside scope.  
- Membership changes are audited.  
- Removing team membership does **not** automatically remove chat membership unless policy says so (and vice versa).  
- External-team participants see chat content only — not unassigned queues, sensitive bios, or others’ reports unless separately permitted.

## 10.6 Follow-Up usage

Follow-Up Leader template may include chat create/manage by default. Assistant Leader does **not** get management by default (Chapter 6 / permission catalog). Ministers may participate when added to the channel.

Chat is not a substitute for:

- Weekly reports  
- Attendance records  
- Formal escalations  
- Membership approvals  

## 10.7 Security

- Organization isolation enforced in Security Rules.  
- Message read/write requires channel membership (plus account active).  
- Sensitive Person fields must not be mirrored into chat as a bypass; pastoral content belongs in bio/escalation with permissions.  
- Search/export of chat is privileged and audited.

## 10.8 Moderation and retention

- Soft-delete messages; retain for authorized audit/history.  
- Channel archive preserves history.  
- Retention policies may be configured later; default is keep for ministry continuity.

## 10.9 Chapter completion criteria

- Channels and memberships independent of team membership.
- Multi-channel per team supported.
- Org isolation; parent channels do not leak local records.
- Follow-Up can create/manage channels under permissions without implying module access for guests.
- Membership and moderation actions audited.

## 10.10 Next chapter

Chapter 11 defines Notifications and Tasks that chat, workflows, and deadlines emit.
