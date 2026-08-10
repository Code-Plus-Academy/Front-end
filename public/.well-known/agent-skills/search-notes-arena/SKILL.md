---
name: search-notes-arena
description: Search and filter academic study materials, PYQs, and lab manuals across colleges and courses on Code Plus Academy.
version: 1.0.0
author: Code Plus Academy
allowed_roles:
  - candidate
  - developer
  - student
  - autonomous_agent
---

# Search Notes Arena Skill

This skill enables AI agents to query the Code Plus Academy Notes Arena database for academic resources including lecture notes, past year question papers (PYQs), lab manuals, and assignments.

## Endpoints

### 1. Search Notes
* **HTTP Method**: `GET`
* **URL**: `/api/notes/search`
* **Query Parameters**:
  * `q` (string, optional): Full-text search term (e.g. `data structures`, `os lab`).
  * `college_id` (string, optional): Filter by college ID.
  * `course_id` (string, optional): Filter by course ID.
  * `field_id` (string, optional): Filter by field/department ID.
  * `subject_id` (string, optional): Filter by subject ID.
  * `type` (string, optional): Material type (`lecture_notes`, `pyq`, `lab_manual`, `assignment`, `handwritten`).
  * `page` (number, optional, default: 1): Pagination page index.

### Response Schema
```json
{
  "notes": [
    {
      "id": "note_12345",
      "title": "Data Structures & Algorithms Comprehensive Notes",
      "type": "lecture_notes",
      "college_name": "COEP Technological University",
      "course_name": "B.Tech Computer Engineering",
      "subject_name": "Data Structures",
      "file_url": "https://www.codeplusacademy.in/api/download/note_12345",
      "upvotes": 42,
      "downloads": 128
    }
  ],
  "total": 1,
  "page": 1,
  "totalPages": 1
}
```
