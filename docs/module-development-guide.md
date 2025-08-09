# 🛠️ SmartBiz Backend – New Module Development Guide

> ✅ Use this guide to build any new feature/module (e.g., Payroll, Leaves)  
> Ensures consistency, scalability, and code quality.

---

## ✅ Master Checklist: How to Build Any New Module

---

### 1️⃣ Planning & Setup

- Identify module purpose and fields
- Create standard folders (if not already):

  ```
  src/
    ├── models/
    ├── validators/
    ├── controllers/
    ├── services/
    ├── routes/
    ├── types/
  ```

- Register route in `main.ts`:
  ```ts
  import moduleRoutes from "./routes/module.route";
  app.use("/api/module", moduleRoutes);
  ```

---

### 2️⃣ Mongoose Model (`/models/module.model.ts`)

- Use `timestamps: true`
- Add fields: `createdBy`, `updatedBy`, `isDeleted`
- Indexes for uniqueness:

  ```ts
  schema.index({ field1: 1, field2: 1 }, { unique: true });
  ```

- If new index added, temporarily run:
  ```ts
  Model.syncIndexes();
  ```

---

### 3️⃣ Zod Validator (`/validators/module.validator.ts`)

- Use Zod for schema validation
- Handle:
  - Required fields
  - ObjectId format with `.refine()`
  - Enums
  - Dates using `Date.parse()`

```ts
export const moduleSchema = z.object({
  name: z.string().min(1, "Name is required"),
  status: z.enum(["active", "inactive"]),
});
```

---

### 4️⃣ Type Definitions (`/types/module.types.ts`)

- Infer types from Zod:
  ```ts
  export type CreateModuleInput = z.infer<typeof moduleSchema>;
  ```

---

### 5️⃣ Service Layer (`/services/module.service.ts`)

- Pure DB logic
- Validate ObjectId via utility:

  ```ts
  if (workerId && isValidObjectId(workerId)) {
    query.workerId = workerId;
  }
  ```

- Handle:

  - Create/update
  - Get by ID
  - Paginated listing
  - Soft delete

- Normalize date filters:
  ```ts
  date.setUTCHours(0, 0, 0, 0);
  ```

---

### 6️⃣ Controller Layer (`/controllers/module.controller.ts`)

- Validate inputs using:

  ```ts
  const parsed = moduleSchema.safeParse(req.body);
  ```

- Use try/catch for all logic
- Handle pagination & query params
- Add `createdBy`, `updatedBy` via:

  ```ts
  req.user?.uid || "anon";
  ```

- Response helpers:
  ```ts
  sendResponse(res, data, "Success", 200);
  sendError(res, err, "Failure", 500);
  ```

---

### 7️⃣ Routes (`/routes/module.route.ts`)

```ts
import { Router } from "express";
import {
  addEntity,
  fetchAllEntities,
  fetchEntityById,
  updateEntity,
  deleteEntity,
} from "../controllers/module.controller";
import { authenticate } from "../middlewares/auth";

const router = Router();
router.use(authenticate);

router.post("/", addEntity);
router.get("/", fetchAllEntities);
router.get("/:id", fetchEntityById);
router.put("/:id", updateEntity);
router.delete("/:id", deleteEntity);

export default router;
```

---

### 8️⃣ Soft Delete Support

- Model field:

  ```ts
  isDeleted: { type: Boolean, default: false }
  ```

- Delete logic:

  ```ts
  Model.findByIdAndUpdate(id, { isDeleted: true });
  ```

- Filter queries:
  ```ts
  {
    isDeleted: false;
  }
  ```

---

### 9️⃣ Authentication Middleware

- Use Firebase token:

  ```http
  Authorization: Bearer <token>
  ```

- `authenticate` middleware:
  - Verifies token
  - Attaches user info to `req.user`

---

### 🔟 Pagination & Search Support

- Controller should handle:

  ```ts
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
  const search = req.query.search?.toString().trim() || "";
  ```

- Query example:
  ```ts
  { name: { $regex: search, $options: "i" } }
  ```

---

## 🧱 Folder Template Per Module

```
📁 models/
   └─ module.model.ts

📁 validators/
   └─ module.validator.ts

📁 types/
   └─ module.types.ts

📁 services/
   └─ module.service.ts

📁 controllers/
   └─ module.controller.ts

📁 routes/
   └─ module.route.ts
```

---

## 🔁 Reusable Utilities

- ✅ `sendResponse(res, data, message, code)`
- ❌ `sendError(res, error, message, code)`
- ✅ `isValidObjectId(string): boolean`
- ✅ `parsePaginationParams(req.query)`

---

## 📦 Optional Enhancements

| Feature            | Description                             |
| ------------------ | --------------------------------------- |
| 🔐 Auth Middleware | Firebase token verification             |
| 🔄 Soft Deletes    | Use `isDeleted: true` instead of remove |
| 🔎 Search          | Case-insensitive partial match          |
| 📃 Pagination      | Limit results and total count           |
| 🧪 Postman Tests   | Add saved requests for QA               |
| 📚 Swagger Docs    | Auto-generated API docs (optional)      |

---

## ✅ Final Best Practices

| ✅ Recommended       | ❌ Avoid                 |
| -------------------- | ------------------------ |
| Zod for validation   | Skipping input checks    |
| Controller + Service | Mixing DB + HTTP logic   |
| Soft delete pattern  | `deleteOne()`            |
| Try/Catch everywhere | Unhandled Promise errors |
| Typed responses      | `any` types              |

---

> 📝 Save this guide in `docs/module-development-guide.md`
