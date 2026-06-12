CREATE TABLE "users" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "password" TEXT NOT NULL,
  "role" TEXT NOT NULL DEFAULT 'Employee',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "employees" (
  "id" TEXT NOT NULL,
  "employeeCode" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "role" TEXT NOT NULL DEFAULT '',
  "department" TEXT NOT NULL DEFAULT '',
  "email" TEXT NOT NULL,
  "phone" TEXT NOT NULL DEFAULT '',
  "location" TEXT NOT NULL DEFAULT '',
  "status" TEXT NOT NULL DEFAULT 'Active',
  "salary" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "performanceScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "attendanceRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "sentimentScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "skills" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "workload" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "attritionRisk" TEXT NOT NULL DEFAULT 'Low',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "employees_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "attendance" (
  "id" TEXT NOT NULL,
  "attendanceCode" TEXT NOT NULL,
  "employeeCode" TEXT NOT NULL,
  "date" TEXT NOT NULL,
  "checkIn" TEXT,
  "checkOut" TEXT,
  "status" TEXT NOT NULL DEFAULT 'Present',
  "geo" TEXT NOT NULL DEFAULT '',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "attendance_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "leaves" (
  "id" TEXT NOT NULL,
  "leaveCode" TEXT NOT NULL,
  "employeeCode" TEXT NOT NULL,
  "type" TEXT NOT NULL DEFAULT 'Casual',
  "from" TEXT NOT NULL,
  "to" TEXT NOT NULL,
  "reason" TEXT NOT NULL DEFAULT '',
  "status" TEXT NOT NULL DEFAULT 'Pending',
  "balanceAfter" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "leaves_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "payrolls" (
  "id" TEXT NOT NULL,
  "payrollCode" TEXT NOT NULL,
  "employeeCode" TEXT NOT NULL,
  "month" TEXT NOT NULL,
  "base" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "bonus" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "deductions" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "net" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "benchmark" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "payrolls_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "recruitment" (
  "id" TEXT NOT NULL,
  "jobCode" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "department" TEXT NOT NULL DEFAULT '',
  "status" TEXT NOT NULL DEFAULT 'Open',
  "applicants" INTEGER NOT NULL DEFAULT 0,
  "priority" TEXT NOT NULL DEFAULT 'Medium',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "recruitment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "applications" (
  "id" TEXT NOT NULL,
  "applicationCode" TEXT NOT NULL,
  "jobCode" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "score" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "stage" TEXT NOT NULL DEFAULT 'New',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "applications_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "notifications" (
  "id" TEXT NOT NULL,
  "type" TEXT NOT NULL DEFAULT 'info',
  "severity" TEXT NOT NULL DEFAULT 'low',
  "title" TEXT NOT NULL,
  "detail" TEXT NOT NULL DEFAULT '',
  "message" TEXT NOT NULL DEFAULT '',
  "employeeId" TEXT,
  "read" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "employees_employeeCode_key" ON "employees"("employeeCode");
CREATE UNIQUE INDEX "attendance_attendanceCode_key" ON "attendance"("attendanceCode");
CREATE INDEX "attendance_employeeCode_idx" ON "attendance"("employeeCode");
CREATE UNIQUE INDEX "leaves_leaveCode_key" ON "leaves"("leaveCode");
CREATE INDEX "leaves_employeeCode_idx" ON "leaves"("employeeCode");
CREATE UNIQUE INDEX "payrolls_payrollCode_key" ON "payrolls"("payrollCode");
CREATE INDEX "payrolls_employeeCode_idx" ON "payrolls"("employeeCode");
CREATE UNIQUE INDEX "recruitment_jobCode_key" ON "recruitment"("jobCode");
CREATE UNIQUE INDEX "applications_applicationCode_key" ON "applications"("applicationCode");
CREATE INDEX "applications_jobCode_idx" ON "applications"("jobCode");
CREATE INDEX "notifications_employeeId_idx" ON "notifications"("employeeId");

ALTER TABLE "attendance" ADD CONSTRAINT "attendance_employeeCode_fkey" FOREIGN KEY ("employeeCode") REFERENCES "employees"("employeeCode") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "leaves" ADD CONSTRAINT "leaves_employeeCode_fkey" FOREIGN KEY ("employeeCode") REFERENCES "employees"("employeeCode") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "payrolls" ADD CONSTRAINT "payrolls_employeeCode_fkey" FOREIGN KEY ("employeeCode") REFERENCES "employees"("employeeCode") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "applications" ADD CONSTRAINT "applications_jobCode_fkey" FOREIGN KEY ("jobCode") REFERENCES "recruitment"("jobCode") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("employeeCode") ON DELETE SET NULL ON UPDATE CASCADE;
