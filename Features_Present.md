# CAMPUS RESOURCE MANAGEMENT
## Feature Specification Document (Implemented Features)

### 🏠 HOME PAGE
* Campus-wide announcements (posted by Admin / Sub-admin)
* Quick stats bar — upcoming events, new resources, active Lost & Found listings
* Class-level announcements feed — posted by Teachers and Class Reps

### 📚 STUDENT RESOURCE MANAGEMENT
* Timetables — uploaded by Teachers and Class Reps
* Exam schedule — uploaded by Teachers and Class Reps
* Class and printed notes — uploaded by Teachers and Class Reps
* Assignments — uploaded by Teachers and Class Reps
* Writing material — uploaded by Class Reps and Teacher
* Previous papers — uploaded by Teachers and Class Reps
* Subject / semester filters and global search bar
* Version tracking on resources — students are notified when a file is updated
* Student list per class — visible to Teachers of that class only
* Class-level announcements section

### 🎉 EVENTS MANAGEMENT
* Events list with search and category filters
* Event timing and scheduling details
* Event registration with capacity limits
* Event details page — description, venue, organiser, requirements
* Withdraw from event registration

### 🔍 LOST & FOUND
* Photos of lost or found items (via file uploads)
* Location where item was lost or found
* Item category tags — electronics, stationery, ID cards, clothing, etc.
* Claim / match system — connects finder with the owner
* Activity log per listing — visible to Sub-admin
* Users can delete their own posts

### 🏆 CLUBS & ACTIVITIES
* Clubs list with search and category filters
* Club description, requirements, and member count
* Club application form for students
* Club management panel — create, edit, delete clubs — managed by Club Head
* Club announcements visible to members only
* Club events linked to the Events module
* Member list visible to Club Head

### 📋 REPORT
* Anonymous student report submission
* Conveying reports to management — handled by Sub-admin
* Status tracking: Pending → In Review → Resolved
* Full audit log — covers role changes, resource edits, event changes, Lost & Found actions, and report status updates

### 👤 ROLES
* Developer
* Admin
* Sub-admin
* Teacher
* Event Manager
* Class Rep
* Club Head
* Student

*Note: A user may hold multiple roles simultaneously (e.g. Student + Class Rep + Club Head). Role inheritance applies — higher roles inherit all permissions of lower roles in their chain.*

### ⚙️ PLATFORM-LEVEL FEATURES
* User profile page — shows registrations, downloads, club memberships, role
* System settings panel — accessible to Admin only — site name, toggles, maintenance mode
* Account and password reset managed by Admin
