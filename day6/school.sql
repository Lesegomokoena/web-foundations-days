
-- Day 6: School Database

-- Remove existing tables so the script can be rerun
DROP TABLE IF EXISTS enrolments;
DROP TABLE IF EXISTS courses;
DROP TABLE IF EXISTS students;

-- Students table
CREATE TABLE students (
    student_id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE
);

-- Courses table
CREATE TABLE courses (
    course_id INTEGER PRIMARY KEY,
    course_name TEXT NOT NULL,
    description TEXT
);

-- Enrolments join table
CREATE TABLE enrolments (
    enrolment_id INTEGER PRIMARY KEY,
    student_id INTEGER NOT NULL,
    course_id INTEGER NOT NULL,
    grade TEXT,
    FOREIGN KEY (student_id) REFERENCES students(student_id),
    FOREIGN KEY (course_id) REFERENCES courses(course_id),
    UNIQUE (student_id, course_id)
);

-- Insert sample students
INSERT INTO students (student_id, name, email) VALUES
(1, 'Lesego Mokoena', 'lesego@example.com'),
(2, 'Thabo Nkosi', 'thabo@example.com'),
(3, 'Naledi Dlamini', 'naledi@example.com'),
(4, 'Kabelo Molefe', 'kabelo@example.com');

-- Insert sample courses
INSERT INTO courses (course_id, course_name, description) VALUES
(1, 'Analytical Chemistry', 'Chemical analysis and laboratory techniques'),
(2, 'Database Systems', 'Relational databases and SQL'),
(3, 'Programming Fundamentals', 'Introduction to programming');

-- Insert sample enrolments
INSERT INTO enrolments
(enrolment_id, student_id, course_id, grade) VALUES
(1, 1, 1, 'A'),
(2, 1, 2, 'B'),
(3, 2, 1, 'B'),
(4, 2, 3, 'A'),
(5, 3, 2, 'A');

-- Query 1: All courses for one student, by name
SELECT
    students.name,
    courses.course_name,
    enrolments.grade
FROM students
JOIN enrolments
    ON students.student_id = enrolments.student_id
JOIN courses
    ON enrolments.course_id = courses.course_id
WHERE students.name = 'Lesego Mokoena';

-- Query 2: All students on one course
SELECT
    courses.course_name,
    students.name,
    enrolments.grade
FROM enrolments
JOIN students
    ON enrolments.student_id = students.student_id
JOIN courses
    ON enrolments.course_id = courses.course_id
WHERE courses.course_name = 'Analytical Chemistry';

-- Query 3: Number of students per course
SELECT
    courses.course_name,
    COUNT(enrolments.student_id) AS student_count
FROM courses
LEFT JOIN enrolments
    ON courses.course_id = enrolments.course_id
GROUP BY courses.course_id, courses.course_name;

-- Query 4: Students who have no enrolments
SELECT
    students.student_id,
    students.name
FROM students
LEFT JOIN enrolments
    ON students.student_id = enrolments.student_id
WHERE enrolments.enrolment_id IS NULL;

-- Query 5: Update one enrolment's grade
UPDATE enrolments
SET grade = 'A'
WHERE enrolment_id = 2;
