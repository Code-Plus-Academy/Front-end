---
name: explore-career-positions
description: Browse active tech internships and full-time positions with full specifications and stipend details on Code Plus Academy.
version: 1.0.0
author: Code Plus Academy
allowed_roles:
  - candidate
  - recruiter
  - autonomous_agent
---

# Explore Career Positions Skill

This skill enables AI agents to inspect open job and internship positions offered by Code Plus Academy, including department metadata, hiring status, openings capacity, stipend/salary info, key responsibilities, and requirements.

## Endpoints

### 1. List Open Positions
* **HTTP Method**: `GET`
* **URL**: `/api/career/positions`
* **Query Parameters**:
  * `status` (string, optional): Filter by status (`open`, `upcoming`, `all`).
  * `type` (string, optional): Employment type (`intern`, `full-time`, `contract`).

### 2. Get Position Specifications
* **HTTP Method**: `GET`
* **URL**: `/api/career/positions/{positionId}`

### Response Schema
```json
{
  "id": "flutter-developer-intern-unpaid",
  "title": "Flutter Developer Intern (Unpaid)",
  "department": "Engineering",
  "type": "intern",
  "status": "open",
  "location": "Remote",
  "openings": 5,
  "stipend": "Unpaid",
  "description": "About the Role: We are looking for a passionate Flutter Developer Intern...",
  "responsibilities": [
    "App Development using Flutter & Dart",
    "UI/UX Implementation from mockups",
    "Feature Integration & State Management"
  ],
  "requirements": [
    "Foundational understanding of Flutter framework and Dart",
    "Familiarity with Provider, Riverpod, or BLoC",
    "Basic knowledge of Git/GitHub"
  ]
}
```
