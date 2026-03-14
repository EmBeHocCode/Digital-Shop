-- Migration: update UserRole enum values
-- Old: USER, ADMIN
-- New: CUSTOMER, STAFF, MANAGER, ADMIN, SUPERADMIN

-- Step 1: Rename old enum to temp
ALTER TYPE "UserRole" RENAME TO "UserRole_old";

-- Step 2: Create new enum with correct values
CREATE TYPE "UserRole" AS ENUM ('CUSTOMER', 'STAFF', 'MANAGER', 'ADMIN', 'SUPERADMIN');

-- Step 3: Migrate existing data (USER -> CUSTOMER, ADMIN -> ADMIN)
ALTER TABLE "User" ALTER COLUMN role DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN role TYPE "UserRole" USING (
  CASE role::text
    WHEN 'USER' THEN 'CUSTOMER'::"UserRole"
    WHEN 'ADMIN' THEN 'ADMIN'::"UserRole"
    ELSE 'CUSTOMER'::"UserRole"
  END
);
ALTER TABLE "User" ALTER COLUMN role SET DEFAULT 'CUSTOMER';

-- Step 4: Drop old enum
DROP TYPE "UserRole_old";
