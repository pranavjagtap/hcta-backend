# HCTA API Postman Collection Setup Guide

## 📋 Overview

This Postman collection provides comprehensive API testing for the HCTA (Home Coaching & Tutoring Application) backend. The collection includes all endpoints with proper authentication, example requests, and environment variables.

## 🚀 Quick Start

### 1. Import the Collection

1. Open Postman
2. Click "Import" button
3. Select the `postman_collection.json` file
4. The collection will be imported with all endpoints organized by module

### 2. Set Up Environment Variables

The collection uses the following environment variables:

| Variable | Description | Default Value |
|----------|-------------|---------------|
| `base_url` | API base URL | `http://localhost:4000/api` |
| `auth_token` | JWT authentication token | (auto-populated after login) |
| `user_id` | Current user ID | (auto-populated after login) |
| `batch_id` | Batch ID for testing | (manual) |
| `student_id` | Student ID for testing | (manual) |
| `assignment_id` | Assignment ID for testing | (manual) |
| `subject_id` | Subject ID for testing | (manual) |
| `note_id` | Note ID for testing | (manual) |
| `submission_id` | Submission ID for testing | (manual) |

### 3. Authentication Setup

1. **Test Login (Development)**
   - Use the "Test Login" request in the Authentication folder
   - Send with email: `admin@hcta.com`
   - The response will automatically set the `auth_token` and `user_id` variables

2. **Firebase Login (Production)**
   - Use the "Firebase Login" request
   - Replace `your_firebase_id_token_here` with actual Firebase ID token

## 📚 Collection Structure

### Authentication
- Test Login (Development)
- Firebase Login (Production)

### Health Check
- Health Status

### User Management
- Get All Users
- Create User
- Get User by ID
- Update User
- Get User Stats
- Delete User

### Dashboard
- Get Teacher Dashboard
- Get Analytics
- Get Batch Dashboard

### Batch Management
- Get All Batches
- Create Batch
- Get Batch by ID
- Update Batch
- Add Students to Batch
- Get Batch Dashboard

### Student Management
- Get All Students
- Create Student
- Get Student by ID
- Update Student
- Get Student Stats

### Subject Management
- Get All Subjects
- Create Subject
- Get Subject by ID

### Assignment Management
- Get All Assignments
- Create Assignment
- Get Assignment by ID
- Get Upcoming Assignments
- Get Assignment Stats

### Note Management
- Get All Notes
- Create Note
- Get Note by ID
- Search Notes

### Performance Management
- Get All Performances
- Create Performance
- Bulk Create Performances
- Get Performance Stats

### Submission Management
- Get All Submissions
- Create Submission
- Get Submission by ID

### Teaching Log
- Get All Teaching Logs
- Create Teaching Log

### Fee Management
- Get All Fees
- Create Fee

### Topic Management
- Get All Topics
- Create Topic
- Get Topics by Board and Class
- Search Topics by Keywords

## 🔧 Testing Workflow

### 1. Initial Setup
```bash
# Start the backend server
cd hcta-backend
npm run dev
```

### 2. Authentication
1. Run "Test Login" with `admin@hcta.com`
2. Verify token is automatically saved
3. Check that subsequent requests include the Authorization header

### 3. Data Creation Flow
1. **Create Subject** → Get `subject_id`
2. **Create Batch** → Get `batch_id`
3. **Create Student** → Get `student_id`
4. **Create Assignment** → Get `assignment_id`
5. **Test other endpoints** using the created IDs

### 4. Testing Scenarios

#### Scenario 1: Complete Student Lifecycle
1. Create a student
2. Add student to a batch
3. Create an assignment for the batch
4. Submit assignment as student
5. Grade the submission
6. View performance analytics

#### Scenario 2: Teaching Session
1. Create a teaching log
2. Upload notes for the session
3. Create assignments based on topics covered
4. Track student attendance and performance

#### Scenario 3: Fee Management
1. Create fee records for students
2. Track payment status
3. Generate reports

## 🛠️ Environment Setup

### Local Development
```json
{
  "base_url": "http://localhost:4000/api",
  "auth_token": "",
  "user_id": "",
  "batch_id": "",
  "student_id": "",
  "assignment_id": "",
  "subject_id": "",
  "note_id": "",
  "submission_id": ""
}
```

### Production
```json
{
  "base_url": "https://your-production-domain.com/api",
  "auth_token": "",
  "user_id": "",
  "batch_id": "",
  "student_id": "",
  "assignment_id": "",
  "subject_id": "",
  "note_id": "",
  "submission_id": ""
}
```

## 📝 Example Requests

### Create a New Batch
```json
POST {{base_url}}/batches
Authorization: Bearer {{auth_token}}
Content-Type: application/json

{
  "name": "Advanced Mathematics",
  "description": "Advanced mathematics for class 10 students",
  "subjectIds": ["{{subject_id}}"],
  "maxStudents": 20,
  "schedule": {
    "days": ["monday", "wednesday", "friday"],
    "time": "10:00",
    "duration": 60
  },
  "fees": {
    "amount": 1000,
    "currency": "INR",
    "frequency": "monthly"
  }
}
```

### Create a New Student
```json
POST {{base_url}}/students
Authorization: Bearer {{auth_token}}
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john.doe@example.com",
  "phone": "+1234567890",
  "parentName": "Jane Doe",
  "parentPhone": "+1234567891",
  "dateOfBirth": "2010-01-01",
  "address": "123 Main Street, City, State",
  "emergencyContact": "+1234567892"
}
```

## 🔍 Troubleshooting

### Common Issues

1. **401 Unauthorized**
   - Check if token is valid
   - Re-run the login request
   - Verify token is being sent in Authorization header

2. **403 Forbidden**
   - Check user permissions
   - Verify user role has required access
   - Check if resource belongs to the authenticated user

3. **404 Not Found**
   - Verify the endpoint URL is correct
   - Check if the resource ID exists
   - Ensure the backend server is running

4. **422 Validation Error**
   - Check request body format
   - Verify all required fields are present
   - Check data types and constraints

### Debug Tips

1. **Enable Console Logging**
   - Open Postman Console (View → Show Postman Console)
   - Monitor request/response details

2. **Check Response Headers**
   - Look for error details in response headers
   - Check for rate limiting information

3. **Validate JSON**
   - Use JSON validators for request bodies
   - Check for syntax errors

## 📊 Performance Testing

### Load Testing Setup
1. Use Postman's Collection Runner
2. Set iterations and delay
3. Monitor response times
4. Check for errors under load

### Example Load Test
- **Iterations**: 100
- **Delay**: 1000ms
- **Concurrent**: 10
- **Monitor**: Response time, error rate

## 🔐 Security Testing

### Authentication Tests
1. Test without token
2. Test with invalid token
3. Test with expired token
4. Test with different user roles

### Authorization Tests
1. Test access to other users' resources
2. Test admin-only endpoints
3. Test role-based permissions

## 📈 Monitoring

### Key Metrics to Track
- Response times
- Error rates
- Authentication success rate
- API usage patterns

### Logging
- Enable detailed logging in Postman
- Monitor backend server logs
- Track database query performance

## 🚀 Next Steps

1. **Automated Testing**
   - Convert Postman tests to automated scripts
   - Integrate with CI/CD pipeline
   - Set up monitoring and alerting

2. **API Documentation**
   - Generate OpenAPI/Swagger docs
   - Create interactive documentation
   - Maintain API versioning

3. **Performance Optimization**
   - Implement caching strategies
   - Optimize database queries
   - Add rate limiting

---

## 📞 Support

For issues or questions:
1. Check the backend server logs
2. Review the API documentation
3. Test with the provided examples
4. Contact the development team

---

**Last Updated**: January 2024
**Version**: 1.0.0


