# Chapter 2 — People & Access Model

**Source:** Link 1 (pre-cutoff) — https://chatgpt.com/share/6a54d9c0-23d4-83ea-b8d6-6e3675729fbd  
**Status:** Approved (first phase)  
**Handoff into link 2:** Link 2 opens by restating this model, then continues at Step 3 (Follow-Up).

## Separated concepts

These must not be collapsed into one “role” field.

### Ministry Status

- Newcomer  
- Member  
- Minister  

### System Roles (technical authority)

- Super Admin  
- System Admin  
- Support Admin  

### Organizational Positions (ministry authority)

- Head Leader  
- Core Team  

### Team Roles

- Team Leader  
- Assistant Leader  
- Minister  

### Oversight Assignments

- Independent of team membership  
- Can oversee selected teams  
- Can be added/removed without changing ministry position  

### Volunteers

- Temporary assignment  
- Not a ministry status  
- Optional time-based assignment  

## Permission model

- Roles provide **default** permissions  
- Individual **overrides** can add or remove permissions  
- Permissions are dynamic  
- Default deny  
- Audit all permission changes  

## Chapter 2 checklist (completed in link 1)

- Ministry status  
- System roles  
- Organizational positions  
- Team roles  
- Volunteers  
- Dynamic RBAC  
- Permission overrides  
- Oversight  
- Authority domains  

## Continuation

RBAC decision records continue in **link 2** (ADR-RBAC-001/002/003 approved).  
Default grant clarification: assigning a role grants **all permissions on that template within scope**.  
Time-bound assignments: optional start/end dates and active/inactive (ADR-RBAC-003).
