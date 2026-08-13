---
name: track-support-cases
description: Query ticket status, submit evidence, and manage compliance cases on Code Plus Academy.
version: 1.0.0
author: Code Plus Academy
allowed_roles:
  - user
  - support_officer
  - autonomous_agent
---

# Track Support Cases Skill

This skill enables AI agents to track compliance tickets, content reports, and support cases logged on Code Plus Academy.

## Endpoints

### 1. Get Support Ticket Status
* **HTTP Method**: `GET`
* **URL**: `/api/support/cases/{ticketId}`

### Response Schema
```json
{
  "ticketId": "CASE-9021",
  "status": "under_review",
  "category": "content_policy",
  "subject": "DMCA Takedown Request Notice",
  "created_at": "2026-08-09T14:20:00Z",
  "timeline": [
    {
      "status": "received",
      "timestamp": "2026-08-09T14:20:00Z",
      "message": "Ticket created and queued for compliance review."
    }
  ]
}
```
