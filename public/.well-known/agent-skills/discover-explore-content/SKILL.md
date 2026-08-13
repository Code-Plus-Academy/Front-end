---
name: discover-explore-content
description: Browse technical articles, short-form clips, long-form videos, and developer posts on the Code Plus Academy Explore Hub.
version: 1.0.0
author: Code Plus Academy
allowed_roles:
  - developer
  - creator
  - autonomous_agent
---

# Discover Explore Content Skill

This skill enables AI agents to query the Code Plus Academy Explore Hub to retrieve public technical posts, long-form articles, short video clips, and video tutorials.

## Endpoints

### 1. Fetch Explore Feed & Content
* **HTTP Method**: `GET`
* **URL**: `/api/posts`
* **Query Parameters**:
  * `type` (string, optional): Content type (`article`, `video`, `short`, `post`, `resource`).
  * `sort` (string, optional): Sorting order (`recent`, `popular`, `trending`).
  * `limit` (number, optional, default: 20): Result limit.

### Response Schema
```json
{
  "posts": [
    {
      "id": "post_7890",
      "type": "article",
      "title": "Building Production-Grade AI Agents with NVIDIA NIMs and Node.js",
      "slug": "building-production-grade-ai-agents",
      "author": {
        "username": "cpa_admin",
        "name": "CPA Admin"
      },
      "clap_count": 142,
      "view_count": 1050,
      "thumbnail_url": "https://www.codeplusacademy.in/assets/thumbnails/ai-agents.jpg",
      "created_at": "2026-08-10T12:00:00Z"
    }
  ]
}
```
