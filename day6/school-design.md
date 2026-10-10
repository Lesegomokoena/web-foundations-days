School Database Design

Tables

* Students: Stores each student’s ID, name and email. The student ID is the primary key, and the email is unique so that two students cannot use the same email address.
* Courses: Stores each course’s ID, name and optional description.
* Enrolments: Connects students to courses and stores each student’s grade. Foreign keys link to the students and courses tables. A unique combination of student ID and course ID prevents duplicate enrolments.

Relationships

* Students to enrolments — one-to-many: One student can have several enrolment records, but each enrolment belongs to one student.
* Courses to enrolments — one-to-many: One course can have many enrolment records, but each enrolment refers to one course.
* Students to courses — many-to-many: A student can take many courses, and each course can have many students. The enrolments table connects the two tables and stores the grade for each student-course combination.

Index

An index on the course ID in the enrolments table can help the database find students enrolled in a particular course more efficiently.

CREATE INDEX idx_enrolments_course_id
ON enrolments(course_id);

SQL vs NoSQL

I would choose a relational SQL database for this school system because students, courses and enrolments have clear relationships and structured data. Primary keys, foreign keys and unique constraints help maintain data accuracy and prevent duplicate enrolments. SQL joins make it easier to find a student’s courses, list students taking a particular course and count enrolments. Although NoSQL databases can also store this information, SQL is a better fit for these structured relationships.