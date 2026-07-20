# Chapter 8 — Workflow Engine

**Status:** Draft handbook chapter (planning authority until PDF revision)  
**Depends on:** Chapters 3–7  
**Related module detail:** `docs/modules/follow-up-workflows-and-state-transitions.md`  

---

## 8.1 Purpose

The Workflow Engine manages state machines, approvals, required steps, exceptions, and transition history for ministry processes. Modules declare workflow types and permissions; they must not invent isolated approval frameworks.

## 8.2 Design principles

1. Explicit **current state** on every workflow-managed record.
2. Transitions validate **who**, **when**, and **required conditions**.
3. Full **transition history**; never silent overwrite.
4. **Configurable** labels, steps, and deadlines within guardrails.
5. Critical system state **identifiers** stay stable even if labels change.
6. Authorized **manual intervention** / `workflow.override` is audited.
7. Workflows trigger notifications and tasks when configured (Chapter 11).
8. Backend enforcement — UI cannot be the only gate.

## 8.3 Core concepts

| Concept | Meaning |
| --- | --- |
| **Workflow type** | Named process (e.g. `newcomer_journey`, `membership_approval`, `weekly_report`) |
| **Workflow instance** | One running process on a record (`journeyId`, `recommendationId`, …) |
| **State** | Current machine state |
| **Transition** | Allowed move from state A → B with guards |
| **Approval template** | Configurable multi-step approval path |
| **Approval step** | One approver role/person/position requirement |
| **Override** | Privileged forced transition with reason |

## 8.4 Transition contract

Every transition records at minimum:

- Workflow type + record id  
- Previous state → new state  
- Action name  
- Actor (`personId` / system)  
- Timestamp  
- Reason / comments when required  
- Permission source / override flag  
- Related ids (assignment, approval step, form submission)

## 8.5 Approval templates

Support:

- One-step or multi-step  
- Sequential (default for membership)  
- Parallel where explicitly configured  
- Return-for-correction, reject, cancel, skip (when allowed), expire  

Step states: `pending` · `approved` · `rejected` · `returned_for_correction` · `skipped` · `cancelled` · `expired`

Approver actions: approve, reject, return, request info, delegate/abstain/cancel when policy allows. Reject/return require comment.

### Guardrails (mandatory)

- No approval path without a final outcome definition  
- No Person → Member without an approval path  
- No circular approval graphs  
- No deadline without timezone  
- No sensitive category without defined viewers  

## 8.6 Follow-Up workflows (reference consumers)

The Workflow Engine must be able to express at least:

1. Registration → duplicate review → journey create  
2. Assignment / reassignment  
3. First contact + active follow-up loop  
4. Weekly report lifecycle (draft → submit → review / return / lock)  
5. Attendance correction (history-preserving; may be lightweight workflow)  
6. Pause / unable_to_contact / inactive / decline / close / reopen  
7. Pastoral escalation  
8. Membership readiness → recommendation → configurable approval → Member transition  

Authoritative Follow-Up states and edges: `docs/modules/follow-up-workflows-and-state-transitions.md`.

## 8.7 Membership approval (canonical example)

```text
Configurable template example:
Follow-Up Minister → Follow-Up Leader → Core Team → Head Leader
```

Outcomes:

| Outcome | Effect |
| --- | --- |
| Approved | Person status → Member; journey completed; assignments ended; notifications/tasks |
| Returned | Stays in approval; revise and resubmit |
| Rejected | Journey returns to active/review-ready; does **not** auto-close |

Member transition must be transactional / safely recoverable and must write Person status history (Chapter 4).

## 8.8 Automation

Workflows may enqueue:

- Reminders (first contact 48h default, report due Friday, etc.)  
- Escalations on overdue states  
- Welcome message tasks  

Automation is configuration-driven and may be toggled per organization. Automation never bypasses permissions.

## 8.9 Permissions

- Step assignees act from **approver assignment** + underlying permissions  
- `workflow.override` for authorized forced transitions  
- Module permissions still gate starting actions (recommend, assign, close, …)  

Role title alone is insufficient (Chapter 6).

## 8.10 Data placement

Prefer:

- State fields on the domain record (`journeyStatus`, `reportStatus`, …)  
- `workflowTransitions` / `approvalInstances` collections for history and multi-step approvals  
- Organization scope on every record  

Do not bury unbounded history arrays inside hot documents.

## 8.11 Chapter completion criteria

- Shared transition + approval model reused by modules.
- Configurable multi-step approvals with return/reject/cancel.
- Guardrails prevent Member without approval and invalid graphs.
- Full transition history and override audit.
- Follow-Up journey/report/membership flows map cleanly onto the engine.
- Notifications/tasks can subscribe to transitions.

## 8.12 Next chapter

Chapter 9 defines the Ministry Calendar Engine that attendance and schedules depend on.
