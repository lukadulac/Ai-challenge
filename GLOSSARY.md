# Study Planner

A mobile app that turns a student's exam date and weekly study time into a suggested study plan they can tick off as they go.

## Language

**Student**:
A registered person who signs in to the app and owns their own Study Plans.
_Avoid_: User, customer

**Subject**:
The name of the course a Study Plan prepares for. Subjects are not tracked on their own: two Study Plans may name the same Subject.
_Avoid_: Course, class

**Exam Date**:
The calendar day on which the Student sits the exam for a Subject.
_Avoid_: Deadline, due date

**Weekly Hours**:
The number of hours per week the Student has available for studying for one Study Plan; each Study Plan has its own.
_Avoid_: Availability, budget, capacity

**Study Plan**:
The suggested schedule of Activities that prepares a Student for one Subject's Exam Date. A Student can have many Study Plans, independent of each other.
_Avoid_: Schedule, timetable, roadmap

**Proposal**:
A Study Plan computed from the Student's Subject, Exam Date and Weekly Hours and shown for review before it is saved. Changing an input produces a new Proposal; only a saved Proposal becomes the Student's Study Plan.
_Avoid_: Draft, preview, suggestion

**Activity**:
One day of study in a Study Plan, with a date, a duration and an Activity Type. The Student can mark any Activity as completed, including future ones, and unmark it again.
_Avoid_: Task, todo, item, session

**Missed Activity**:
An Activity whose date has passed without being marked completed.
_Avoid_: Overdue, late, skipped

**Progress**:
How much of a Study Plan is done, counted both in completed Activities and in their hours.
_Avoid_: Completion rate, score

## Activity Types

**Learning**:
An Activity for working through new material.
_Avoid_: Study, new material

**Review**:
An Activity for going back over material already learned.
_Avoid_: Revision, repetition

**Mock Exam**:
An Activity for practising under exam conditions, at the end of a Study Plan.
_Avoid_: Practice test, trial exam
