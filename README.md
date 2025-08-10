# HCTA Backend - Comprehensive Project Documentation

## �� Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture & Technology Stack](#architecture--technology-stack)
3. [Module Documentation](#module-documentation)
4. [API Endpoints](#api-endpoints)
5. [Database Schema](#database-schema)
6. [Authentication & Authorization](#authentication--authorization)
7. [Development Setup](#development-setup)
8. [Deployment](#deployment)

---

## �� Project Overview

**HCTA (Home Coaching & Tutoring Application)** is a comprehensive backend system designed for educational institutions and individual tutors to manage their teaching operations. The system provides a complete solution for student management, batch administration, fee collection, performance tracking, and teaching analytics.

### 🎯 Key Features
- **Multi-tenant Architecture**: Support for multiple tutors/institutions
- **Comprehensive Student Management**: Complete student lifecycle management
- **Advanced Analytics**: Real-time dashboards and performance insights
- **Fee Management**: Automated fee collection and payment tracking
- **Teaching Tools**: Assignment management, note sharing, and teaching logs
- **Performance Tracking**: Detailed student performance analytics
- **Role-based Access Control**: Secure access management

---

## 🏗️ Architecture & Technology Stack

### **Backend Stack**
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT-based authentication
- **Validation**: Zod schema validation
- **API Documentation**: OpenAPI/Swagger (planned)

### **Project Structure**
```
src/
├── auth/                 # Authentication & authorization
├── config/              # Configuration files
├── controllers/         # Request handlers
├── interfaces/          # API contracts & types
├── middlewares/         # Express middlewares
├── models/             # Database models
├── routes/             # API route definitions
├── services/           # Business logic layer
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
├── validators/         # Input validation schemas
├── app.ts              # Express app configuration
└── server.ts           # Server entry point
```

### **Design Patterns**
- **MVC Architecture**: Separation of concerns
- **Service Layer Pattern**: Business logic isolation
- **Repository Pattern**: Data access abstraction
- **Middleware Pattern**: Request processing pipeline
- **Interface Contracts**: Type-safe API definitions

---

## 📚 Module Documentation

### 1. **User Management Module** 👥

**Purpose**: Manages system users, roles, and permissions

**Key Features**:
- User registration and authentication
- Role-based access control (Admin, Tutor, Student)
- User profile management
- Password management
- User statistics and analytics

**Core Entities**:
- `User`: System users with roles and permissions
- `Role`: User roles and associated permissions
- `Permission`: Granular access controls

**API Endpoints**:
```
POST   /api/auth/login          # User authentication
POST   /api/auth/logout         # User logout
GET    /api/users               # Get all users
POST   /api/users               # Create new user
GET    /api/users/:id           # Get user by ID
PUT    /api/users/:id           # Update user
DELETE /api/users/:id           # Delete user
GET    /api/users/stats         # User statistics
```

---

### 2. **Batch Management Module** 📚

**Purpose**: Manages class batches, student assignments, and batch operations

**Key Features**:
- Batch creation and management
- Student assignment to batches
- Batch statistics and analytics
- Academic year management
- Batch-specific dashboards

**Core Entities**:
- `Batch`: Class batches with tutor assignments
- `Student`: Students assigned to batches
- `Subject`: Subjects taught in batches

**API Endpoints**:
```
GET    /api/batches             # Get all batches
POST   /api/batches             # Create new batch
GET    /api/batches/:id         # Get batch by ID
PUT    /api/batches/:id         # Update batch
DELETE /api/batches/:id         # Delete batch
GET    /api/batches/:id/stats   # Batch statistics
POST   /api/batches/:id/students # Assign students
```

---

### 3. **Student Management Module** 👨‍🎓

**Purpose**: Comprehensive student lifecycle management

**Key Features**:
- Student registration and profiles
- Academic information tracking
- Weakness identification and tracking
- Parent contact management
- Student performance analytics
- Batch assignment management

**Core Entities**:
- `Student`: Student profiles and information
- `StudentPerformance`: Performance tracking
- `StudentWeakness`: Academic weaknesses

**API Endpoints**:
```
GET    /api/students            # Get all students
POST   /api/students            # Create new student
GET    /api/students/:id        # Get student by ID
PUT    /api/students/:id        # Update student
DELETE /api/students/:id        # Delete student
GET    /api/students/:id/stats  # Student statistics
GET    /api/students/:id/performance # Performance data
```

---

### 4. **Subject Management Module** 📖

**Purpose**: Manages curriculum, subjects, and academic content

**Key Features**:
- Subject creation and management
- Topic organization and tracking
- Curriculum structure management
- Board and class level organization
- Subject statistics and analytics

**Core Entities**:
- `Subject`: Academic subjects with topics
- `Topic`: Individual topics within subjects
- `Curriculum`: Curriculum structure and organization

**API Endpoints**:
```
GET    /api/subjects            # Get all subjects
POST   /api/subjects            # Create new subject
GET    /api/subjects/:id        # Get subject by ID
PUT    /api/subjects/:id        # Update subject
DELETE /api/subjects/:id        # Delete subject
GET    /api/subjects/:id/topics # Get subject topics
```

---

### 5. **Fee Management Module** 💰

**Purpose**: Comprehensive fee collection and payment tracking

**Key Features**:
- Fee structure management
- Payment processing and tracking
- Bulk fee operations
- Payment status management
- Fee reports and analytics
- Receipt generation

**Core Entities**:
- `Fee`: Individual fee records
- `FeePayment`: Payment transactions
- `FeeReport`: Fee analytics and reports

**API Endpoints**:
```
GET    /api/fees                # Get all fees
POST   /api/fees                # Create new fee
GET    /api/fees/:id            # Get fee by ID
PUT    /api/fees/:id            # Update fee
DELETE /api/fees/:id            # Delete fee
POST   /api/fees/payment        # Process payment
POST   /api/fees/bulk           # Bulk fee operations
GET    /api/fees/stats          # Fee statistics
GET    /api/fees/reports        # Fee reports
```

---

### 6. **Dashboard Module** ��

**Purpose**: Real-time analytics and insights

**Key Features**:
- Teacher dashboard with overview
- Batch-specific dashboards
- Performance analytics
- Teaching session tracking
- Quick statistics and insights
- Data visualization support

**Core Entities**:
- `Dashboard`: Dashboard configurations
- `DashboardData`: Analytics data
- `TeacherDashboard`: Teacher-specific views
- `BatchDashboard`: Batch-specific views

**API Endpoints**:
```
GET    /api/dashboard           # Teacher dashboard
GET    /api/dashboard/batch/:id # Batch dashboard
GET    /api/dashboard/analytics # Analytics data
POST   /api/dashboard/cache     # Cache dashboard data
```

---

### 7. **Note Management Module** 📝

**Purpose**: Educational content sharing and management

**Key Features**:
- Note creation and sharing
- File upload and management
- Public/private note control
- Note approval workflow
- Search and filtering
- Batch-specific notes

**Core Entities**:
- `Note`: Educational notes and content
- `NoteFile`: File attachments
- `NoteApproval`: Approval workflow

**API Endpoints**:
```
GET    /api/notes               # Get all notes
POST   /api/notes               # Create new note
GET    /api/notes/:id           # Get note by ID
PUT    /api/notes/:id           # Update note
DELETE /api/notes/:id           # Delete note
GET    /api/notes/search        # Search notes
POST   /api/notes/:id/approve   # Approve note
POST   /api/notes/:id/toggle    # Toggle public/private
```

---

### 8. **Assignment Management Module** 📋

**Purpose**: Assignment creation, distribution, and tracking

**Key Features**:
- Assignment creation and management
- Due date tracking
- Assignment locking/unlocking
- Batch-specific assignments
- Assignment statistics

**Core Entities**:
- `Assignment`: Assignment definitions
- `AssignmentSubmission`: Student submissions
- `AssignmentStats`: Assignment analytics

**API Endpoints**:
```
GET    /api/assignments         # Get all assignments
POST   /api/assignments         # Create new assignment
GET    /api/assignments/:id     # Get assignment by ID
PUT    /api/assignments/:id     # Update assignment
DELETE /api/assignments/:id     # Delete assignment
GET    /api/assignments/upcoming # Upcoming assignments
POST   /api/assignments/:id/lock # Lock/unlock assignment
```

---

### 9. **Submission Management Module** 📤

**Purpose**: Student assignment submission and grading

**Key Features**:
- Submission creation and management
- Grading and feedback
- Bulk grading operations
- Submission status tracking
- Performance analytics

**Core Entities**:
- `Submission`: Student submissions
- `SubmissionGrade`: Grading information
- `SubmissionStats`: Submission analytics

**API Endpoints**:
```
GET    /api/submissions         # Get all submissions
POST   /api/submissions         # Create new submission
GET    /api/submissions/:id     # Get submission by ID
PUT    /api/submissions/:id     # Update submission
DELETE /api/submissions/:id     # Delete submission
POST   /api/submissions/:id/grade # Grade submission
POST   /api/submissions/bulk-grade # Bulk grading
GET    /api/submissions/stats   # Submission statistics
```

---

### 10. **Performance Tracking Module** 📈

**Purpose**: Comprehensive student performance analytics

**Key Features**:
- Performance record creation
- Score tracking and analytics
- Performance comparisons
- Heatmap data generation
- Student and batch summaries
- Assessment type management

**Core Entities**:
- `Performance`: Performance records
- `PerformanceStats`: Performance analytics
- `PerformanceComparison`: Comparative analysis

**API Endpoints**:
```
GET    /api/performance         # Get all performances
POST   /api/performance         # Create new performance
GET    /api/performance/:id     # Get performance by ID
PUT    /api/performance/:id     # Update performance
DELETE /api/performance/:id     # Delete performance
POST   /api/performance/bulk    # Bulk performance creation
GET    /api/performance/student/:id/summary # Student summary
GET    /api/performance/batch/:id/summary   # Batch summary
GET    /api/performance/comparison          # Performance comparison
GET    /api/performance/heatmap             # Heatmap data
```

---

### 11. **Teaching Log Module** 📚

**Purpose**: Teaching session tracking and scheduling

**Key Features**:
- Teaching session logging
- Daily schedule management
- Session status tracking
- Teaching statistics
- Batch-specific teaching logs

**Core Entities**:
- `TeachingLog`: Teaching session records
- `DailySchedule`: Daily teaching schedules
- `TeachingStats`: Teaching analytics

**API Endpoints**:
```
GET    /api/teaching-logs       # Get all teaching logs
POST   /api/teaching-logs       # Create new teaching log
GET    /api/teaching-logs/:id   # Get teaching log by ID
PUT    /api/teaching-logs/:id   # Update teaching log
DELETE /api/teaching-logs/:id   # Delete teaching log
PATCH  /api/teaching-logs/:id/status # Update session status
GET    /api/teaching-logs/schedule # Daily schedule
GET    /api/teaching-logs/batch/:id/stats # Batch teaching stats
```

---

## 🔐 Authentication & Authorization

### **Authentication Flow**
1. **Login**: User provides credentials
2. **JWT Generation**: Server generates access token
3. **Token Validation**: Middleware validates tokens
4. **Role-based Access**: Authorization based on user roles

### **User Roles**
- **Admin**: Full system access
- **Tutor**: Batch and student management
- **Student**: Limited access to own data

### **Security Features**
- JWT-based authentication
- Password hashing (bcrypt)
- Role-based access control
- Request validation
- Rate limiting (planned)

---

## ��️ Database Schema

### **Core Collections**
```typescript
// User Management
users: { _id, uid, name, email, role, permissions, isDeleted, timestamps }
roles: { _id, name, permissions, isDeleted, timestamps }
permissions: { _id, name, description, isDeleted, timestamps }

// Academic Management
batches: { _id, name, tutorId, academicYear, maxStudents, isDeleted, timestamps }
students: { _id, name, batchId, parentInfo, academicInfo, isDeleted, timestamps }
subjects: { _id, name, topics, board, classLevel, isDeleted, timestamps }

// Financial Management
fees: { _id, studentId, batchId, amountDue, amountPaid, paymentStatus, isDeleted, timestamps }

// Content Management
notes: { _id, batchId, topic, fileURL, uploadedBy, isPublic, isDeleted, timestamps }
assignments: { _id, batchId, topic, dueDate, maxMarks, isLocked, isDeleted, timestamps }
submissions: { _id, assignmentId, studentId, submittedAt, marksAwarded, isDeleted, timestamps }

// Analytics & Performance
performance: { _id, studentId, subjectId, score, maxScore, assessmentType, isDeleted, timestamps }
teachingLogs: { _id, batchId, topic, date, durationMinutes, status, isDeleted, timestamps }
dashboard: { _id, tutorId, batchId, data, period, lastUpdated, isDeleted, timestamps }
```

### **Indexing Strategy**
- Compound indexes for common queries
- Text indexes for search functionality
- Unique indexes for business constraints
- TTL indexes for data expiration (planned)

---

## 🚀 Development Setup

### **Prerequisites**
- Node.js (v18+)
- MongoDB (v6+)
- TypeScript (v5+)

### **Installation**
```bash
# Clone repository
git clone <repository-url>
cd hcta-backend

# Install dependencies
npm install

# Environment setup
cp .env.example .env
# Configure environment variables

# Database setup
npm run db:setup

# Development server
npm run dev

# Production build
npm run build
npm start
```

### **Environment Variables**
```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/hcta

# JWT Configuration
JWT_SECRET=your-jwt-secret
JWT_EXPIRES_IN=7d

# File Upload (if applicable)
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=10485760
```

### **Available Scripts**
```json
{
  "dev": "nodemon src/server.ts",
  "build": "tsc",
  "start": "node dist/server.js",
  "test": "jest",
  "lint": "eslint src/**/*.ts",
  "format": "prettier --write src/**/*.ts"
}
```

---

## 📊 API Documentation

### **Base URL**
```
Development: http://localhost:3000/api
Production: https://your-domain.com/api
```

### **Response Format**
```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  details?: any;
}
```

### **Pagination Format**
```typescript
interface PaginationInfo {
  current: number;
  pages: number;
  total: number;
  hasNext: boolean;
  hasPrev: boolean;
}
```

### **Error Handling**
- **400**: Bad Request (Validation errors)
- **401**: Unauthorized (Authentication required)
- **403**: Forbidden (Insufficient permissions)
- **404**: Not Found (Resource not found)
- **500**: Internal Server Error (Server errors)

---

## 🔧 Configuration & Customization

### **Database Configuration**
- MongoDB connection with connection pooling
- Automatic reconnection handling
- Query optimization and indexing

### **Security Configuration**
- CORS configuration
- Rate limiting (planned)
- Input sanitization
- SQL injection prevention

### **Performance Optimization**
- Database query optimization
- Caching strategies (planned)
- Response compression
- Connection pooling

---

## �� Deployment

### **Production Deployment**
```bash
# Build application
npm run build

# Set production environment
NODE_ENV=production

# Start production server
npm start
```

### **Docker Deployment**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
EXPOSE 3000
CMD ["node", "dist/server.js"]
```

### **Environment-Specific Configurations**
- **Development**: Local MongoDB, debug logging
- **Staging**: Staging database, limited logging
- **Production**: Production database, error logging only

---

## 📈 Monitoring & Analytics

### **Health Checks**
- Database connectivity
- API endpoint availability
- System resource usage

### **Logging**
- Request/response logging
- Error tracking
- Performance monitoring

### **Metrics**
- API response times
- Database query performance
- User activity tracking

---

## 🔮 Future Enhancements

### **Planned Features**
- Real-time notifications (WebSocket)
- File upload and management
- Advanced reporting and analytics
- Mobile API optimization
- Multi-language support
- Advanced caching (Redis)

### **Scalability Improvements**
- Microservices architecture
- Load balancing
- Database sharding
- CDN integration
- API versioning

---

## 📞 Support & Documentation

### **API Documentation**
- Swagger/OpenAPI documentation (planned)
- Postman collection
- Code examples

### **Developer Resources**
- TypeScript interfaces
- Error code documentation
- Best practices guide
- Code style guide

### **Contact Information**
- Technical support: [support@hcta.com]
- Documentation: [docs.hcta.com]
- GitHub: [github.com/hcta-backend]

---

This comprehensive documentation provides a complete overview of the HCTA backend system, its modules, features, and implementation details. The system is designed to be scalable, maintainable, and extensible for future enhancements.