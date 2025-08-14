# Database Seeding Guide

This guide explains how to seed your HCTA database with test data for development and testing purposes.

## Prerequisites

1. Make sure MongoDB is running
2. Set up your environment variables (`.env` file)
3. Install dependencies: `npm install`

## Available Seed Scripts

### 1. Complete Seeding (Recommended)
Seeds both roles/permissions and test data:
```bash
npm run seed
```

### 2. Test Data Only
Seeds only test data (requires roles to be already seeded):
```bash
npm run seed:test
```

### 3. Roles and Permissions Only
Seeds only roles and permissions:
```bash
npm run seed:roles
```

## What Gets Seeded

### Users (5 users)
- **Admin User**: `admin@hcta.com` - Full system access
- **John Smith**: `john.smith@hcta.com` - Math tutor
- **Sarah Johnson**: `sarah.johnson@hcta.com` - Physics tutor
- **Michael Brown**: `michael.brown@hcta.com` - Chemistry tutor
- **Lisa Davis**: `lisa.davis@hcta.com` - Accountant

### Subjects (7 subjects)
- Mathematics, Physics, Chemistry, Biology, English, History, Computer Science

### Batches (4 batches)
- Advanced Math Batch A (John Smith)
- Physics Fundamentals (Sarah Johnson)
- Chemistry Lab (Michael Brown)
- English Literature (John Smith)

### Students (6 students)
- Emma Wilson, James Anderson, Sophia Martinez, David Thompson, Olivia Garcia, William Lee
- Distributed across different batches

### Assignments (4 assignments)
- Algebra Fundamentals Quiz
- Physics Lab Report
- Chemistry Project
- English Essay

### Fees (3 fee types)
- Tuition fees, Lab fees, Exam fees
- Mix of pending and paid status

### Notes (3 notes)
- Important announcements, schedules, meeting notifications

### Performances (3 records)
- Mid-term, Quiz, and Final exam records

### Teaching Logs (3 logs)
- Different teaching methods and topics covered

### Submissions
- Sample submissions for assignments with grades and feedback

## Test Login Credentials

After seeding, you can use these credentials to test the application:

```
Admin: admin@hcta.com
Tutor: john.smith@hcta.com
Accountant: lisa.davis@hcta.com
```

## Data Relationships

The seeded data maintains proper relationships:
- Students are assigned to batches
- Batches have tutors and subjects
- Assignments are linked to batches and subjects
- Fees are linked to students and batches
- Performances are linked to students, subjects, and batches
- Teaching logs are linked to batches and subjects

## Clearing Test Data

The seed script automatically clears existing test data before creating new ones. If you want to keep existing data, comment out the clearing section in `seedTestData.ts`.

## Troubleshooting

### Error: "Required roles not found"
Run the roles seeding first:
```bash
npm run seed:roles
```

### Error: "MongoDB connection failed"
1. Check if MongoDB is running
2. Verify your `MONGO_URI` environment variable
3. Ensure network connectivity

### Error: "Duplicate key error"
The script handles duplicates automatically, but if you encounter issues:
1. Clear the database manually
2. Run the seed script again

## Customizing Test Data

To modify the test data:
1. Edit the arrays in `src/scripts/seedTestData.ts`
2. Run the seed script again

The script is designed to be idempotent - you can run it multiple times safely.

## Production Warning

⚠️ **Never run these seed scripts in production!** They are designed for development and testing only.
