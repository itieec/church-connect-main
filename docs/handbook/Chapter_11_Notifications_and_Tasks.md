# Chapter 11 — Notifications and Tasks

**Status:** Draft handbook chapter (planning authority until PDF revision)  
**Depends on:** Chapters 6, 8  

---

## 11.1 Purpose

Notifications and Tasks are shared platform services. Modules request them; they do not each build private reminder systems. The engine distinguishes **informational notices** from **required actions**, and tracks delivery, read state, due dates, and escalation.

## 11.2 Design principles

1. Organization-scoped delivery.  
2. Separate **notification** (inform) from **task** (actionable work item).  
3. Channel abstraction: in-app (web + mobile), push (especially mobile), email; SMS/WhatsApp later.  
4. Idempotent triggers where possible (avoid duplicate storms).  
5. User notification preferences may mute channels but must not disable critical security notices without admin policy.  
6. Tasks have owners, due dates, status, and optional escalation.  
7. Deep links go to permitted screens only — permission still enforced on arrival.

## 11.3 Notifications

### Baseline fields

- `organizationId`, recipient `personId` / account  
- Type / template key  
- Title, body, data payload  
- Channel(s)  
- Related entity refs (`journeyId`, `reportId`, …)  
- `createdAt`, `deliveredAt`, `readAt`  
- Status: `pending` · `sent` · `failed` · `read` · `dismissed`  

### Typical Follow-Up triggers

- New registration / unassigned queue  
- Assignment created / reassigned  
- First-contact deadline approaching / overdue (default 48h)  
- Weekly report due / late / returned  
- Membership recommendation pending approval  
- Welcome message send result  
- Escalation opened  
- Journey pause review date  

## 11.4 Tasks

Tasks represent required work:

| Example | Owner | Due |
| --- | --- | --- |
| First contact newcomer | Primary assignee | +48h default |
| Submit weekly report | Primary assignee | Friday due |
| Review membership recommendation | Approver step | Template SLA |
| Resolve duplicate review | Authorized reviewer | Configurable |
| Correct returned report | Report author | Edit window |

Task statuses: `open` · `in_progress` · `completed` · `cancelled` · `expired` · `escalated`

Completing the underlying workflow action should auto-complete the linked task when configured.

## 11.5 Templates and configuration

Admin-configurable:

- Template copy per event type  
- Channels enabled  
- Reminder offsets  
- Escalation paths  
- Welcome message on/off (Follow-Up default: on)  

Guardrail: no deadline automation without timezone (Chapter 8).

## 11.6 Delivery architecture (planning)

Baseline path:

1. Workflow / module writes `notifications` / `tasks` docs.  
2. Cloud Functions (when enabled) fan out email and mobile/web push.  
3. In-app inbox on **web and mobile** reads Firestore notifications for the Person.  

Failures retry with backoff; permanent failures mark `failed` and may create admin-visible alerts.

## 11.7 Permissions and privacy

- Recipients see their own notifications/tasks.  
- Leaders may see team task boards only with permission.  
- Notification bodies must minimize sensitive pastoral content; prefer “new escalation needs review” over pasting bio text into email.  
- Parent org notifications never include restricted local pastoral payloads by default.

## 11.8 Chapter completion criteria

- Shared notification + task models used by Follow-Up.
- Informational vs actionable distinction clear.
- Due dates, read/delivery tracking, and escalation supported.
- Config templates for Follow-Up deadlines and welcome message.
- Channel expansion (SMS/WhatsApp) possible without redesigning modules.

## 11.9 Next chapter

Chapter 12 defines Audit and History requirements that notifications, workflows, and all engines must satisfy.
