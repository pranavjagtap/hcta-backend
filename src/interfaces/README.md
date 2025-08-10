# API Interface Contracts

This folder contains TypeScript interfaces that define the contract between frontend and backend APIs.

## Structure

```
interfaces/
├── index.ts              # Common interfaces and re-exports
├── user.interface.ts     # User module API contracts
├── batch.interface.ts    # Batch module API contracts
├── student.interface.ts  # Student module API contracts
├── subject.interface.ts  # Subject module API contracts
├── fee.interface.ts      # Fee module API contracts
├── dashboard.interface.ts # Dashboard module API contracts
├── note.interface.ts      # Note module API contracts
├── performance.interface.ts # Performance module API contracts
├── teachingLog.interface.ts # TeachingLog module API contracts
└── README.md            # This file
```

## Usage

### Backend (Controller)
```typescript
import { CreateUserRequest, UserResponse, ApiResponse } from '../interfaces/user.interface';

export const create = async (
  req: Request<{}, {}, CreateUserRequest>, 
  res: Response<ApiResponse<UserResponse>>
): Promise<void> => {
  // Implementation
};
```

### Frontend (TypeScript)
```typescript
import { CreateUserRequest, UserResponse, ApiResponse } from './interfaces/user.interface';
import { CreateBatchRequest, BatchResponse } from './interfaces/batch.interface';
import { CreateStudentRequest, StudentResponse } from './interfaces/student.interface';
import { CreateSubjectRequest, SubjectResponse } from './interfaces/subject.interface';
import { CreateFeeRequest, FeeResponse, FeePaymentRequest } from './interfaces/fee.interface';
import { TeacherDashboardResponse, BatchDashboardResponse } from './interfaces/dashboard.interface';
import { CreateNoteRequest, NoteResponse, SearchNotesRequest } from './interfaces/note.interface';
import { CreatePerformanceRequest, PerformanceResponse, StudentPerformanceSummary } from './interfaces/performance.interface';
import { CreateTeachingLogRequest, TeachingLogResponse, DailySchedule } from './interfaces/teachingLog.interface';

// User API call with proper typing
const createUser = async (userData: CreateUserRequest): Promise<ApiResponse<UserResponse>> => {
  const response = await fetch('/api/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData)
  });
  return response.json();
};

// Batch API call with proper typing
const createBatch = async (batchData: CreateBatchRequest): Promise<ApiResponse<BatchResponse>> => {
  const response = await fetch('/api/batches', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(batchData)
  });
  return response.json();
};

// Student API call with proper typing
const createStudent = async (studentData: CreateStudentRequest): Promise<ApiResponse<StudentResponse>> => {
  const response = await fetch('/api/students', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(studentData)
  });
  return response.json();
};

// Subject API call with proper typing
const createSubject = async (subjectData: CreateSubjectRequest): Promise<ApiResponse<SubjectResponse>> => {
  const response = await fetch('/api/subjects', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(subjectData)
  });
  return response.json();
};

// Fee API call with proper typing
const createFee = async (feeData: CreateFeeRequest): Promise<ApiResponse<FeeResponse>> => {
  const response = await fetch('/api/fees', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(feeData)
  });
  return response.json();
};

const processPayment = async (paymentData: FeePaymentRequest): Promise<ApiResponse<FeeResponse>> => {
  const response = await fetch('/api/fees/payment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(paymentData)
  });
  return response.json();
};

// Performance API call with proper typing
const createPerformance = async (performanceData: CreatePerformanceRequest): Promise<ApiResponse<PerformanceResponse>> => {
  const response = await fetch('/api/performances', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(performanceData)
  });
  return response.json();
};

const getStudentPerformanceSummary = async (studentId: string): Promise<ApiResponse<StudentPerformanceSummary>> => {
  const response = await fetch(`/api/performances/student/${studentId}/summary`);
  return response.json();
};

// TeachingLog API call with proper typing
const createTeachingLog = async (teachingLogData: CreateTeachingLogRequest): Promise<ApiResponse<TeachingLogResponse>> => {
  const response = await fetch('/api/teaching-logs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(teachingLogData)
  });
  return response.json();
};

const getDailySchedule = async (date?: string): Promise<ApiResponse<DailySchedule>> => {
  const response = await fetch(`/api/teaching-logs/schedule${date ? `?date=${date}` : ''}`);
  return response.json();
};

// Dashboard API call with proper typing
const getTeacherDashboard = async (): Promise<ApiResponse<TeacherDashboardResponse>> => {
  const response = await fetch('/api/dashboard', {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
  });
  return response.json();
};

const getBatchDashboard = async (batchId: string): Promise<ApiResponse<BatchDashboardResponse>> => {
  const response = await fetch(`/api/dashboard/batch/${batchId}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
  });
  return response.json();
};

// Note API call with proper typing
const createNote = async (noteData: CreateNoteRequest): Promise<ApiResponse<NoteResponse>> => {
  const response = await fetch('/api/notes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(noteData)
  });
  return response.json();
};

const searchNotes = async (searchData: SearchNotesRequest): Promise<ApiResponse<NoteResponse[]>> => {
  const queryParams = new URLSearchParams();
  Object.entries(searchData).forEach(([key, value]) => {
    if (value !== undefined) {
      queryParams.append(key, value.toString());
    }
  });
  
  const response = await fetch(`/api/notes/search?${queryParams}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
  });
  return response.json();
};

// Usage with full type safety
const handleCreateUser = async () => {
  const result = await createUser({
    uid: 'user123',
    name: 'John Doe',
    email: 'john@example.com',
    role: 'roleId123'
  });
  
  if (result.success) {
    // result.data is fully typed as UserResponse
    console.log(result.data.name);
  } else {
    // result.error is available
    console.error(result.error);
  }
};

const handleCreateBatch = async () => {
  const result = await createBatch({
    name: 'Math Class 10A',
    classDays: ['Monday', 'Wednesday', 'Friday'],
    maxStudents: 25,
    location: 'Room 101'
  });
  
  if (result.success) {
    // result.data is fully typed as BatchResponse
    console.log(result.data.name);
    console.log(result.data.tutorId.name); // Populated tutor info
  } else {
    console.error(result.error);
  }
};

const handleCreateStudent = async () => {
  const result = await createStudent({
    name: 'John Smith',
    parentName: 'Mike Smith',
    parentPhone: '+1234567890',
    schoolName: 'ABC School',
    board: 'CBSE',
    classLevel: '10th',
    weaknesses: ['Mathematics', 'Physics'],
    rollNumber: 'STU001'
  });
  
  if (result.success) {
    // result.data is fully typed as StudentResponse
    console.log(result.data.name);
    console.log(result.data.batchId?.name); // Populated batch info
    console.log(result.data.weaknesses); // Array of weaknesses
  } else {
    console.error(result.error);
  }
};

const handleCreateSubject = async () => {
  const result = await createSubject({
    name: 'Mathematics',
    board: 'CBSE',
    classLevel: '10th',
    topics: ['Algebra', 'Geometry', 'Trigonometry', 'Calculus'],
    syllabusCode: 'MATH-10-CBSE',
    isElective: false
  });
  
  if (result.success) {
    // result.data is fully typed as SubjectResponse
    console.log(result.data.name);
    console.log(result.data.topics); // Array of topics
    console.log(result.data.isElective); // Boolean flag
  } else {
    console.error(result.error);
  }
};

const handleCreateFee = async () => {
  const result = await createFee({
    studentId: 'student123',
    batchId: 'batch456',
    monthYear: '2024-01',
    amountDue: 5000,
    paymentStatus: 'unpaid'
  });
  
  if (result.success) {
    // result.data is fully typed as FeeResponse
    console.log(result.data.amountDue);
    console.log(result.data.studentId.name); // Populated student info
    console.log(result.data.batchId.name); // Populated batch info
  } else {
    console.error(result.error);
  }
};

const handleProcessPayment = async () => {
  const result = await processPayment({
    feeId: 'fee789',
    amount: 2500,
    paymentMode: 'cash',
    receiptNumber: 'RCP001'
  });
  
  if (result.success) {
    // result.data is fully typed as FeeResponse
    console.log(result.data.amountPaid);
    console.log(result.data.paymentStatus); // Updated status
    console.log(result.data.paymentDate); // Payment date
  } else {
    console.error(result.error);
  }
};

const handleGetTeacherDashboard = async () => {
  const result = await getTeacherDashboard();
  
  if (result.success) {
    // result.data is fully typed as TeacherDashboardResponse
    console.log(result.data.overview.totalBatches);
    console.log(result.data.overview.totalStudents);
    console.log(result.data.today.completedSessions);
    console.log(result.data.thisWeek.completionRate);
  } else {
    console.error(result.error);
  }
};

const handleGetBatchDashboard = async () => {
  const result = await getBatchDashboard('batch123');
  
  if (result.success) {
    // result.data is fully typed as BatchDashboardResponse
    console.log(result.data.batch.name);
    console.log(result.data.batch.totalStudents);
    console.log(result.data.performance.stats.averageScore);
    console.log(result.data.quickStats.totalAssignments);
  } else {
    console.error(result.error);
  }
};

const handleCreateNote = async () => {
  const result = await createNote({
    batchId: 'batch123',
    topic: 'Algebra Fundamentals',
    fileURL: 'https://example.com/notes/algebra.pdf',
    subjectId: 'subject456',
    noteType: 'typed',
    isPublic: true
  });
  
  if (result.success) {
    // result.data is fully typed as NoteResponse
    console.log(result.data.topic);
    console.log(result.data.batchId.name); // Populated batch info
    console.log(result.data.subjectId?.name); // Populated subject info
    console.log(result.data.uploadedBy.name); // Populated user info
  } else {
    console.error(result.error);
  }
};

const handleSearchNotes = async () => {
  const result = await searchNotes({
    query: 'algebra',
    batchId: 'batch123',
    noteType: 'typed',
    isPublic: true
  });
  
  if (result.success) {
    // result.data is fully typed as NoteResponse[]
    result.data.forEach(note => {
      console.log(note.topic);
      console.log(note.batchName);
      console.log(note.uploadedByName);
    });
  } else {
    console.error(result.error);
  }
};
```

## Benefits

1. **Type Safety**: Compile-time checking of API contracts
2. **Documentation**: Clear definition of what each API expects/returns
3. **IDE Support**: Autocomplete and IntelliSense for API calls
4. **Refactoring Safety**: Changes to API contracts are caught at compile time
5. **Frontend Integration**: Easy to share types between frontend and backend

## Adding New Modules

1. Create `{module}.interface.ts` in this folder
2. Define request/response interfaces
3. Export from `index.ts`
4. Use in controllers and frontend code

## Common Patterns

- **Request Interfaces**: Define the shape of incoming data
- **Response Interfaces**: Define the shape of outgoing data
- **ApiResponse<T>**: Wrapper for consistent API responses
- **Query Interfaces**: For GET request parameters
- **Controller Interfaces**: For internal type checking
