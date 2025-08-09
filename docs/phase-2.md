1. 📌 Future (Phase-2) Features for Payroll:
   🔒 Locking Past Months (based on `locked: true` flag)
   🔐 Approval Workflow (based on `approved` flag)
   📁 Payslip Generation as PDF (future utility module)
   📊 Payroll Reports / Exports (CSV, XLS)
   📆 Monthly Payroll Lock & Recalculation Rules
   🧾 Tax Calculations & Deductions (optional schema fields)
   🧠 Role-based Views: Workers can view their own payslips only
2. 🔄 Future Enhancements payslip (Planned for Phase 2):
   - Email payslip PDF to workers
   - Upload payslips to cloud (e.g. AWS S3)
   - Company branding / header/footer templates
   - Payslip access restrictions based on payroll.locked or approval
   - PDF signature / watermark
   - Download multiple payslips (batch mode)
   - Export all payslips for month
3. 🕐 Pending Enhancement (Optional – Soft Delete Optimization):
   Refactor frequent queries (like findOne, findById) to auto-apply { isDeleted: false } using one of the following:
   🔧 Mongoose Middleware (pre('find'), pre('findOne'), etc.)
   ✅ Query Helper (e.g., .find().notDeleted())
   📌 Custom Repository Layer (if you abstract models later)
