-- ============================================================
-- Migration 001: Relax NOT NULL constraints on Contacts,
--   add WorkPhone/CellPhone, verify JourneyLog.ContactID
-- Run once against Azure SQL: industryrelations-coe.database.windows.net
-- ============================================================

-- 1. Probe current nullable status (run SELECT first to verify)
-- SELECT COLUMN_NAME, IS_NULLABLE, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH
-- FROM INFORMATION_SCHEMA.COLUMNS
-- WHERE TABLE_SCHEMA = 'dbo' AND TABLE_NAME = 'Contacts'
-- ORDER BY ORDINAL_POSITION;

-- 2. Relax NOT NULL on optional Contact fields
--    Only FirstName and LastName should remain NOT NULL.
IF EXISTS (
  SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA='dbo' AND TABLE_NAME='Contacts'
    AND COLUMN_NAME='Title' AND IS_NULLABLE='NO'
)
  ALTER TABLE dbo.Contacts ALTER COLUMN Title NVARCHAR(200) NULL;
GO

IF EXISTS (
  SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA='dbo' AND TABLE_NAME='Contacts'
    AND COLUMN_NAME='Email' AND IS_NULLABLE='NO'
)
  ALTER TABLE dbo.Contacts ALTER COLUMN Email NVARCHAR(200) NULL;
GO

IF EXISTS (
  SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA='dbo' AND TABLE_NAME='Contacts'
    AND COLUMN_NAME='Phone' AND IS_NULLABLE='NO'
)
  ALTER TABLE dbo.Contacts ALTER COLUMN Phone NVARCHAR(50) NULL;
GO

IF EXISTS (
  SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA='dbo' AND TABLE_NAME='Contacts'
    AND COLUMN_NAME='OrganizationID' AND IS_NULLABLE='NO'
)
  ALTER TABLE dbo.Contacts ALTER COLUMN OrganizationID INT NULL;
GO

-- 3. Add WorkPhone and CellPhone columns (idempotent)
IF NOT EXISTS (
  SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA='dbo' AND TABLE_NAME='Contacts' AND COLUMN_NAME='WorkPhone'
)
  ALTER TABLE dbo.Contacts ADD WorkPhone NVARCHAR(50) NULL;
GO

IF NOT EXISTS (
  SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA='dbo' AND TABLE_NAME='Contacts' AND COLUMN_NAME='CellPhone'
)
  ALTER TABLE dbo.Contacts ADD CellPhone NVARCHAR(50) NULL;
GO

-- 4. Migrate existing Phone data into WorkPhone (one-time, safe to re-run)
UPDATE dbo.Contacts
SET WorkPhone = Phone
WHERE Phone IS NOT NULL AND WorkPhone IS NULL;
GO

-- 5. Ensure JourneyLog has ContactID column
IF NOT EXISTS (
  SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA='dbo' AND TABLE_NAME='JourneyLog' AND COLUMN_NAME='ContactID'
)
  ALTER TABLE dbo.JourneyLog ADD ContactID INT NULL;
GO

-- 6. Ensure JourneyLog has all columns the API expects
IF NOT EXISTS (
  SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA='dbo' AND TABLE_NAME='JourneyLog' AND COLUMN_NAME='EventType'
)
  ALTER TABLE dbo.JourneyLog ADD EventType NVARCHAR(100) NULL;
GO

IF NOT EXISTS (
  SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA='dbo' AND TABLE_NAME='JourneyLog' AND COLUMN_NAME='Summary'
)
  ALTER TABLE dbo.JourneyLog ADD Summary NVARCHAR(MAX) NULL;
GO

IF NOT EXISTS (
  SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA='dbo' AND TABLE_NAME='JourneyLog' AND COLUMN_NAME='Owner'
)
  ALTER TABLE dbo.JourneyLog ADD Owner NVARCHAR(200) NULL;
GO

PRINT 'Migration 001 complete.';
GO
