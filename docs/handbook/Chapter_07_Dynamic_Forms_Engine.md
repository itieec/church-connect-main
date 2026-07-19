# Chapter 7 — Dynamic Forms Engine

**Status:** Draft handbook chapter (planning authority until PDF revision)  
**Depends on:** Chapters 3–6  
**Governing ADR:** ADR-005  

---

## 7.1 Purpose

The Dynamic Forms Engine is the shared platform service for configurable data capture. Modules must reuse it for registration, operational reports, applications, schedules, and similar structured input instead of hard-coding one-off form schemas whenever practical.

## 7.2 Design principles

1. **Configuration before hard-coding** — field labels, order, required/optional/hidden, and options are admin-configurable within safeguards.
2. **Published forms are versioned** — a submission always retains the exact structure used at submit time.
3. **Security is not configurable away** — form config cannot grant unauthorized field visibility or bypass permissions.
4. **Sensitivity-aware** — fields may be classified (standard / sensitive / pastoral / internal-only).
5. **Organization-scoped** — form definitions belong to an organization (or parent/shared template published into orgs).
6. **Module consumers, not owners** — Follow-Up owns when to show a form; the Forms Engine owns definition, versioning, and submission shape.

## 7.3 Core concepts

| Concept | Meaning |
| --- | --- |
| **Form definition** | Named form template (e.g. Public Newcomer Registration, Weekly Follow-Up Report) |
| **Form version** | Immutable published snapshot of fields + validation |
| **Draft** | Editable unpublished definition |
| **Submission** | Answers bound to `formDefinitionId` + `formVersion` |
| **Field** | Typed input with key, label, validation, visibility, sensitivity |

## 7.4 Supported field types (baseline)

- Short text / long text  
- Yes / no (boolean)  
- Single-select / multi-select  
- Date / time / datetime  
- Number  
- Phone / email (with normalization hooks where used for Person matching)  
- File / photo reference (via File service)  
- Conditional fields (show/require based on other answers)  

Configurable per field: label, help text, order, required/optional/hidden/internal-only, default value, option lists, validation rules, sensitivity class, permission to view/edit answers.

## 7.5 Versioning rules

```text
Draft → Publish (creates immutable version N)
      → Later edits create Draft → Publish as N+1
```

Rules:

- Submissions store `formDefinitionId` + `formVersion` (+ optional embedded field snapshot if needed for offline audit).
- Editing a live definition does **not** rewrite historical submissions.
- Admins may deprecate old versions; existing submissions remain readable with their original schema.
- Breaking key renames on new versions must not corrupt old `dynamicResponses` maps.

## 7.6 Submission model

Shared collections (planning names):

- `formDefinitions/{formId}`
- `formVersions/{versionId}` or subcollection under definition
- `formSubmissions/{submissionId}` when a standalone submission is needed

Module records may **embed** form binding instead of a separate submission doc when the module record *is* the submission (e.g. `followUpReports` with `formDefinitionId`, `formVersion`, `dynamicResponses`). Both patterns are allowed; choose one consistently per use case.

## 7.7 Public vs authenticated forms

| Mode | Rules |
| --- | --- |
| **Public** | Unauthenticated write only to approved intake paths; no internal-only fields; rate-limit / abuse controls; duplicate detection after submit |
| **Authenticated** | Respect Chapter 6 permissions; field-level sensitivity enforced on read/write |

Public registration must never expose internal notes, admin fields, or pastoral content (Follow-Up requirement).

## 7.8 Follow-Up consumers (first module)

| Use | Form role |
| --- | --- |
| Public / internal newcomer registration | Configurable required/optional/hidden fields |
| Weekly follow-up report | Predefined + dynamic sections; attendance **not** a report field |
| Welcome schedule extras | Optional dynamic responses on schedule records |
| Membership recommendation narrative | May use form sections for structured summaries |

Hard-coded MVP shells are acceptable only as temporary seeds that still store `formDefinitionId` / `formVersion` for forward compatibility.

## 7.9 Permissions

Examples (normalize with Chapter 6 catalog):

- `forms.definition.view` / `forms.definition.manage`
- `forms.publish`
- Module-specific submit/view permissions remain on the module (e.g. `follow_up.reports.submit`)

Managing form structure is separate from submitting answers.

## 7.10 Validation and workflow interaction

- Client validates for UX; trusted backend / rules enforce required fields for the **published version**.
- Workflow Engine may require a specific form version before a transition (e.g. recommendation cannot submit without completed sections).
- Configuration must not allow invalid workflows (ADR-005 / Ch. 2).

## 7.11 Soft delete and audit

- Soft-delete definitions/versions when retiring forms.
- Audit: publish, field sensitivity changes, deletion, and privileged submission edits.

## 7.12 Chapter completion criteria

- Shared form definitions with versioned publish.
- Submissions retain submit-time structure.
- Field types and conditional/sensitivity controls exist as platform capability.
- Public forms cannot expose internal fields.
- Follow-Up registration and weekly reports consume the engine (or seeded definitions).
- Form config cannot bypass RBAC.

## 7.13 Next chapter

Chapter 8 defines the Workflow Engine that drives approvals and state transitions that forms often feed.
