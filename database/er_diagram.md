# Course Management System (CMS) - Entity Relationship (ER) Diagram

## Relational Schema Diagram (Mermaid)

```mermaid
erDiagram
    USERS ||--o{ COURSES : "teaches (1:N)"
    USERS ||--o{ ENROLLMENTS : "enrolls in (1:N)"
    COURSES ||--o{ ENROLLMENTS : "has enrolled (1:N)"
    COURSES ||--o{ MATERIALS : "contains (1:N)"
    COURSES ||--o{ ASSIGNMENTS : "assigns (1:N)"
    ASSIGNMENTS ||--o{ SUBMISSIONS : "receives (1:N)"
    USERS ||--o{ SUBMISSIONS : "submits (1:N)"

    USERS {
        int id PK
        string name
        string email UK
        string password
        enum role "ADMIN, TEACHER, STUDENT"
        timestamp created_at
    }

    COURSES {
        int id PK
        string course_name
        string course_code UK
        string description
        string duration
        int teacher_id FK
        timestamp created_at
    }

    ENROLLMENTS {
        int id PK
        int student_id FK
        int course_id FK
        timestamp enrolled_date
        enum status "ACTIVE, DROPPED, COMPLETED"
    }

    MATERIALS {
        int id PK
        int course_id FK
        string title
        string description
        string file_url
        int file_size
        timestamp uploaded_date
    }

    ASSIGNMENTS {
        int id PK
        int course_id FK
        string title
        string description
        datetime due_date
        int max_marks
        timestamp created_at
    }

    SUBMISSIONS {
        int id PK
        int assignment_id FK
        int student_id FK
        string file_url
        string submission_text
        timestamp submitted_date
        int marks
        string feedback
        enum status "SUBMITTED, GRADED, LATE"
    }
```

---

## Relational Dependencies & Cardinalities
1. **Teacher to Courses**: One Teacher can teach multiple Courses ($1 : N$). A Course is taught by at most one Teacher ($N : 1$).
2. **Student to Courses (Enrollments)**: Many Students enroll in Many Courses ($M : N$), resolved through the associative entity `enrollments`.
3. **Course to Study Materials**: One Course contains multiple study materials ($1 : N$).
4. **Course to Assignments**: One Course contains multiple assignments ($1 : N$).
5. **Student to Assignment Submissions**: Each Student can submit work for each Assignment once ($1 : 1$ per assignment), which carries grades and teacher feedback.
