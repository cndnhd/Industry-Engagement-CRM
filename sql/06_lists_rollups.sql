/*******************************************************************************
 * User lists (contacts/organizations) with process columns and cell completion,
 * plus strategic rollups with components and contact links.
 * Run after 01_create_tables.sql on Azure SQL.
 ******************************************************************************/

SET NOCOUNT ON;
GO

-- ---------------------------------------------------------------------------
-- User-defined lists
-- ---------------------------------------------------------------------------
CREATE TABLE dbo.UserLists (
    ListID                  INT IDENTITY(1,1) NOT NULL,
    Name                    NVARCHAR(200)     NOT NULL,
    EntityType              CHAR(1)           NOT NULL, -- 'C' = Contacts, 'O' = Organizations
    FilterJson              NVARCHAR(MAX)     NULL,
    VisibleColumnKeysJson   NVARCHAR(MAX)     NULL,
    CreatedAt               DATETIME2(2)      NOT NULL DEFAULT SYSUTCDATETIME(),
    UpdatedAt               DATETIME2(2)      NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_UserLists PRIMARY KEY (ListID),
    CONSTRAINT CK_UserLists_EntityType CHECK (EntityType IN (N'C', N'O'))
);
GO

CREATE INDEX IX_UserLists_Name ON dbo.UserLists(Name);
GO

CREATE TABLE dbo.UserListColumns (
    ColumnID     INT IDENTITY(1,1) NOT NULL,
    ListID       INT               NOT NULL,
    Label        NVARCHAR(200)     NOT NULL,
    SortOrder    INT               NOT NULL DEFAULT 0,
    ProcessTier  TINYINT           NOT NULL,
    CreatedAt    DATETIME2(2)      NOT NULL DEFAULT SYSUTCDATETIME(),
    UpdatedAt    DATETIME2(2)      NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_UserListColumns PRIMARY KEY (ColumnID),
    CONSTRAINT FK_UserListColumns_List FOREIGN KEY (ListID) REFERENCES dbo.UserLists(ListID) ON DELETE CASCADE,
    CONSTRAINT CK_UserListColumns_ProcessTier CHECK (ProcessTier BETWEEN 1 AND 5)
);
GO

CREATE INDEX IX_UserListColumns_List ON dbo.UserListColumns(ListID);
GO

CREATE TABLE dbo.UserListMemberships (
    MembershipID   INT IDENTITY(1,1) NOT NULL,
    ListID         INT               NOT NULL,
    ContactID      INT               NULL,
    OrganizationID INT               NULL,
    CreatedAt      DATETIME2(2)      NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_UserListMemberships PRIMARY KEY (MembershipID),
    CONSTRAINT FK_UserListMemberships_List FOREIGN KEY (ListID) REFERENCES dbo.UserLists(ListID) ON DELETE CASCADE,
    CONSTRAINT FK_UserListMemberships_Contact FOREIGN KEY (ContactID) REFERENCES dbo.Contacts(ContactID) ON DELETE CASCADE,
    CONSTRAINT FK_UserListMemberships_Organization FOREIGN KEY (OrganizationID) REFERENCES dbo.Organizations(OrganizationID) ON DELETE CASCADE,
    CONSTRAINT CK_UserListMemberships_OneEntity CHECK (
        (ContactID IS NOT NULL AND OrganizationID IS NULL)
        OR (ContactID IS NULL AND OrganizationID IS NOT NULL)
    )
);
GO

CREATE UNIQUE INDEX UX_UserListMemberships_Contact ON dbo.UserListMemberships(ListID, ContactID) WHERE ContactID IS NOT NULL;
GO
CREATE UNIQUE INDEX UX_UserListMemberships_Org ON dbo.UserListMemberships(ListID, OrganizationID) WHERE OrganizationID IS NOT NULL;
GO

CREATE TABLE dbo.UserListCellValues (
    MembershipID    INT           NOT NULL,
    ColumnID        INT           NOT NULL,
    CompletionLevel TINYINT       NOT NULL,
    UpdatedAt       DATETIME2(2)  NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_UserListCellValues PRIMARY KEY (MembershipID, ColumnID),
    CONSTRAINT FK_UserListCellValues_Membership FOREIGN KEY (MembershipID) REFERENCES dbo.UserListMemberships(MembershipID) ON DELETE CASCADE,
    CONSTRAINT FK_UserListCellValues_Column FOREIGN KEY (ColumnID) REFERENCES dbo.UserListColumns(ColumnID) ON DELETE CASCADE,
    CONSTRAINT CK_UserListCellValues_Level CHECK (CompletionLevel BETWEEN 1 AND 5)
);
GO

-- ---------------------------------------------------------------------------
-- Strategic rollups
-- ---------------------------------------------------------------------------
CREATE TABLE dbo.StrategicRollups (
    RollupID    INT IDENTITY(1,1) NOT NULL,
    Name        NVARCHAR(200)     NOT NULL,
    Description NVARCHAR(MAX)     NULL,
    CreatedAt   DATETIME2(2)      NOT NULL DEFAULT SYSUTCDATETIME(),
    UpdatedAt   DATETIME2(2)      NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_StrategicRollups PRIMARY KEY (RollupID)
);
GO

CREATE INDEX IX_StrategicRollups_Name ON dbo.StrategicRollups(Name);
GO

CREATE TABLE dbo.RollupComponents (
    ComponentID INT IDENTITY(1,1) NOT NULL,
    RollupID      INT               NOT NULL,
    Label         NVARCHAR(200)     NOT NULL,
    SortOrder     INT               NOT NULL DEFAULT 0,
    Notes         NVARCHAR(MAX)     NULL,
    CreatedAt     DATETIME2(2)      NOT NULL DEFAULT SYSUTCDATETIME(),
    UpdatedAt     DATETIME2(2)      NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_RollupComponents PRIMARY KEY (ComponentID),
    CONSTRAINT FK_RollupComponents_Rollup FOREIGN KEY (RollupID) REFERENCES dbo.StrategicRollups(RollupID) ON DELETE CASCADE
);
GO

CREATE INDEX IX_RollupComponents_Rollup ON dbo.RollupComponents(RollupID);
GO

CREATE TABLE dbo.RollupContacts (
    RollupID    INT           NOT NULL,
    ContactID   INT           NOT NULL,
    ComponentID INT           NULL,
    Notes       NVARCHAR(MAX) NULL,
    CreatedAt   DATETIME2(2)  NOT NULL DEFAULT SYSUTCDATETIME(),
    UpdatedAt   DATETIME2(2)  NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_RollupContacts PRIMARY KEY (RollupID, ContactID),
    CONSTRAINT FK_RollupContacts_Rollup FOREIGN KEY (RollupID) REFERENCES dbo.StrategicRollups(RollupID) ON DELETE CASCADE,
    CONSTRAINT FK_RollupContacts_Contact FOREIGN KEY (ContactID) REFERENCES dbo.Contacts(ContactID) ON DELETE CASCADE,
    CONSTRAINT FK_RollupContacts_Component FOREIGN KEY (ComponentID) REFERENCES dbo.RollupComponents(ComponentID) ON DELETE SET NULL
);
GO

CREATE INDEX IX_RollupContacts_Contact ON dbo.RollupContacts(ContactID);
GO
