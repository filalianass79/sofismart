-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'COMMERCIAL', 'DEPOT_MANAGER', 'ACCOUNTANT');

-- CreateEnum
CREATE TYPE "EmployeeJobFunction" AS ENUM ('ADMINISTRATEUR', 'GERANT', 'DIRECTEUR', 'COMMERCIAL', 'EMPLOYE', 'CHAUFFEUR', 'MAGASINIER', 'COMPTABLE', 'RESPONSABLE_DEPOT', 'AUTRE');

-- CreateEnum
CREATE TYPE "EmployeeStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('ACTIVE', 'DISABLED', 'PENDING', 'BLOCKED');

-- CreateEnum
CREATE TYPE "EmployeeDocumentType" AS ENUM ('CONTRACT', 'CIN_COPY', 'DIPLOMA', 'MEDICAL', 'OTHER');

-- CreateEnum
CREATE TYPE "VehicleOrigin" AS ENUM ('NEW', 'USED', 'IMPORTED');

-- CreateEnum
CREATE TYPE "VehicleStatus" AS ENUM ('IN_STOCK', 'RESERVED', 'EXIT_PENDING', 'SOLD', 'DELIVERED', 'IN_REPAIR', 'IN_TRANSIT', 'PREPARATION');

-- CreateEnum
CREATE TYPE "FuelType" AS ENUM ('DIESEL', 'ESSENCE', 'HYBRIDE', 'ELECTRIQUE');

-- CreateEnum
CREATE TYPE "TransmissionType" AS ENUM ('MANUELLE', 'AUTOMATIQUE');

-- CreateEnum
CREATE TYPE "SupplierType" AS ENUM ('DEALERSHIP', 'COMPANY', 'INDIVIDUAL', 'IMPORTER', 'GARAGE', 'TRANSPORTER', 'OTHER');

-- CreateEnum
CREATE TYPE "DepotType" AS ENUM ('MAIN', 'SECONDARY', 'TRANSIT', 'PREPARATION', 'REPAIR');

-- CreateEnum
CREATE TYPE "DepotStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "SaleType" AS ENUM ('CASH', 'CREDIT', 'LEASING', 'TRADE_IN', 'OTHER');

-- CreateEnum
CREATE TYPE "SaleRecordStatus" AS ENUM ('DRAFT', 'PENDING_VALIDATION', 'VALIDATED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "DeliveryStatus" AS ENUM ('NOT_STARTED', 'EXIT_PENDING', 'DELIVERED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ExitVoucherStatus" AS ENUM ('PENDING', 'DELIVERED', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "DeliveryNoteStatus" AS ENUM ('DRAFT', 'GENERATED', 'DELIVERED', 'SIGNED_UPLOADED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "DeliveryDocumentType" AS ENUM ('SIGNED_DELIVERY_NOTE', 'DELIVERY_PHOTO', 'OTHER');

-- CreateEnum
CREATE TYPE "GeneratedDocumentType" AS ENUM ('EXIT_VOUCHER', 'DELIVERY_NOTE', 'SALES_INVOICE');

-- CreateEnum
CREATE TYPE "GeneratedDocumentStatus" AS ENUM ('DRAFT', 'GENERATED', 'SENT', 'DOWNLOADED', 'PRINTED', 'SIGNED_UPLOADED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AppNotificationStatus" AS ENUM ('UNREAD', 'READ', 'PROCESSED');

-- CreateEnum
CREATE TYPE "SupplierRecordStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "PaymentValidationStatus" AS ENUM ('PENDING', 'VALIDATED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentCategory" AS ENUM ('CLIENT', 'SUPPLIER', 'PURCHASE', 'SALE', 'MISC');

-- CreateEnum
CREATE TYPE "PurchaseType" AS ENUM ('LOCAL', 'IMPORT', 'DEALERSHIP', 'INDIVIDUAL', 'GROUP');

-- CreateEnum
CREATE TYPE "Currency" AS ENUM ('MAD', 'EUR', 'USD');

-- CreateEnum
CREATE TYPE "PurchaseStatus" AS ENUM ('DRAFT', 'VALIDATED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PurchasePaymentStatus" AS ENUM ('UNPAID', 'PARTIAL', 'PAID');

-- CreateEnum
CREATE TYPE "VehicleCondition" AS ENUM ('EXCELLENT', 'GOOD', 'AVERAGE', 'NEEDS_REPAIR');

-- CreateEnum
CREATE TYPE "StockMovementType" AS ENUM ('INITIAL', 'TRANSFER', 'ADJUSTMENT', 'SALE_EXIT_PENDING', 'SALE_EXIT_CONFIRMED');

-- CreateEnum
CREATE TYPE "StockMovementStatus" AS ENUM ('PENDING', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ClientType" AS ENUM ('INDIVIDUAL', 'COMPANY', 'RESELLER');

-- CreateEnum
CREATE TYPE "Civility" AS ENUM ('MR', 'MRS', 'MISS');

-- CreateEnum
CREATE TYPE "AcquisitionSource" AS ENUM ('SOCIAL_MEDIA', 'WEBSITE', 'REFERRAL', 'ADVERTISING', 'PHONE_CALL', 'SHOWROOM', 'OTHER');

-- CreateEnum
CREATE TYPE "FinancialStatus" AS ENUM ('GOOD_PAYER', 'AVERAGE', 'RISK', 'BLOCKED');

-- CreateEnum
CREATE TYPE "RelationshipStatus" AS ENUM ('PROSPECT', 'ACTIVE', 'LOYAL', 'INACTIVE', 'VIP');

-- CreateEnum
CREATE TYPE "ClientDocumentType" AS ENUM ('CIN', 'PASSPORT', 'PROOF_OF_ADDRESS', 'SALE_CONTRACT', 'PURCHASE_ORDER', 'PAYMENT_RECEIPT', 'FINANCING', 'INSURANCE', 'ICE_DOC', 'RC_DOC', 'TAX_ID_DOC', 'PATENT', 'COMPANY_STATUTES', 'INVOICE', 'BANK_DOCUMENT', 'OTHER');

-- CreateEnum
CREATE TYPE "InteractionType" AS ENUM ('NOTE', 'CALL', 'TASK', 'FOLLOW_UP', 'MEETING');

-- CreateEnum
CREATE TYPE "ReminderStatus" AS ENUM ('PENDING', 'DONE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'TRANSFER', 'CHECK', 'CREDIT', 'BILL_OF_EXCHANGE', 'OTHER');

-- CreateEnum
CREATE TYPE "PaymentDirection" AS ENUM ('TO_SUPPLIER', 'FROM_CLIENT');

-- CreateEnum
CREATE TYPE "SalePaymentStatus" AS ENUM ('UNPAID', 'PARTIAL', 'PAID', 'OVERDUE');

-- CreateEnum
CREATE TYPE "DocumentCategory" AS ENUM ('PURCHASE_INVOICE', 'SALE_INVOICE', 'REGISTRATION_CARD', 'CONTRACT', 'CUSTOMS', 'VEHICLE_PHOTO', 'PAYMENT_RECEIPT', 'CLIENT_DOC', 'SUPPLIER_DOC', 'PURCHASE_ORDER', 'CONFORMITY_CERT', 'TRANSIT_DOC', 'FINANCING_CONTRACT', 'EXPERTISE_REPORT', 'PROVISIONAL_INSURANCE', 'OTHER');

-- CreateEnum
CREATE TYPE "PurchaseFeeType" AS ENUM ('TRANSPORT', 'CUSTOMS', 'TRANSIT', 'HOMOLOGATION', 'REPAIR', 'CLEANING', 'REGISTRATION', 'INSURANCE', 'EXPERTISE', 'COMMISSION', 'OTHER');

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "Employee" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "cin" TEXT,
    "personalEmail" TEXT,
    "professionalEmail" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "city" TEXT,
    "birthDate" TIMESTAMP(3),
    "hireDate" TIMESTAMP(3),
    "jobFunction" "EmployeeJobFunction" NOT NULL,
    "department" TEXT,
    "depotId" TEXT,
    "contractType" TEXT,
    "salary" DECIMAL(14,2),
    "status" "EmployeeStatus" NOT NULL DEFAULT 'ACTIVE',
    "profilePhotoUrl" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Employee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployeeDocument" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "type" "EmployeeDocumentType" NOT NULL DEFAULT 'OTHER',
    "title" TEXT,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileMimeType" TEXT,
    "fileSize" INTEGER,
    "uploadedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmployeeDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Role" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Permission" (
    "id" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RolePermission" (
    "id" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,
    "allowed" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserPermission" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,
    "allowed" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "UserPermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorUserId" TEXT,
    "action" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "targetType" TEXT,
    "targetId" TEXT,
    "oldValues" JSONB,
    "newValues" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "UserSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT,
    "username" TEXT,
    "email" TEXT NOT NULL,
    "recoveryEmail" TEXT,
    "emailVerified" TIMESTAMP(3),
    "name" TEXT,
    "image" TEXT,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'COMMERCIAL',
    "roleId" TEXT,
    "accountStatus" "AccountStatus" NOT NULL DEFAULT 'ACTIVE',
    "passwordMustChange" BOOLEAN NOT NULL DEFAULT false,
    "temporaryPassword" BOOLEAN NOT NULL DEFAULT false,
    "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
    "lastLoginAt" TIMESTAMP(3),
    "depotId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Depot" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL DEFAULT 'DEP-LEGACY',
    "name" TEXT NOT NULL,
    "address" TEXT,
    "city" TEXT,
    "phone" TEXT,
    "managerId" TEXT,
    "maxCapacity" INTEGER NOT NULL DEFAULT 50,
    "depotType" "DepotType" NOT NULL DEFAULT 'MAIN',
    "status" "DepotStatus" NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Depot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Supplier" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL DEFAULT 'FRN-LEGACY',
    "type" "SupplierType" NOT NULL,
    "name" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "companyName" TEXT,
    "tradeName" TEXT,
    "ice" TEXT,
    "cin" TEXT,
    "rc" TEXT,
    "taxId" TEXT,
    "patent" TEXT,
    "phone" TEXT,
    "secondaryPhone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "city" TEXT,
    "country" TEXT DEFAULT 'Maroc',
    "contactName" TEXT,
    "contactRole" TEXT,
    "contactPhone" TEXT,
    "preferredPaymentMethod" "PaymentMethod",
    "paymentDelay" INTEGER,
    "bankName" TEXT,
    "iban" TEXT,
    "balance" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "status" "SupplierRecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Client" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL DEFAULT 'CLI-LEGACY',
    "type" "ClientType" NOT NULL,
    "name" TEXT NOT NULL,
    "civility" "Civility",
    "firstName" TEXT,
    "lastName" TEXT,
    "companyName" TEXT,
    "tradeName" TEXT,
    "cin" TEXT,
    "ice" TEXT,
    "rc" TEXT,
    "taxId" TEXT,
    "patent" TEXT,
    "activity" TEXT,
    "birthDate" TIMESTAMP(3),
    "phone" TEXT,
    "secondaryPhone" TEXT,
    "email" TEXT,
    "website" TEXT,
    "address" TEXT,
    "city" TEXT,
    "country" TEXT DEFAULT 'Maroc',
    "profession" TEXT,
    "mainContactName" TEXT,
    "mainContactRole" TEXT,
    "mainContactPhone" TEXT,
    "mainContactEmail" TEXT,
    "assignedCommercialId" TEXT,
    "acquisitionSource" "AcquisitionSource",
    "preferredPaymentMethod" "PaymentMethod",
    "paymentTerms" TEXT,
    "paymentDelay" INTEGER,
    "bankName" TEXT,
    "iban" TEXT,
    "creditLimit" DECIMAL(14,2),
    "currentBalance" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "outstandingAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "vatExempt" BOOLEAN NOT NULL DEFAULT false,
    "financialStatus" "FinancialStatus" NOT NULL DEFAULT 'GOOD_PAYER',
    "relationshipStatus" "RelationshipStatus" NOT NULL DEFAULT 'PROSPECT',
    "notes" TEXT,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientDocument" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "type" "ClientDocumentType" NOT NULL DEFAULT 'OTHER',
    "title" TEXT,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileMimeType" TEXT,
    "fileSize" INTEGER,
    "notes" TEXT,
    "uploadedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClientDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientInteraction" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "type" "InteractionType" NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "employeeId" TEXT,
    "summary" TEXT NOT NULL,
    "nextAction" TEXT,
    "nextFollowUpDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClientInteraction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientReminder" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "status" "ReminderStatus" NOT NULL DEFAULT 'PENDING',
    "assignedToId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClientReminder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Brand" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "logo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Brand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VehicleModel" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "photo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VehicleModel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vehicle" (
    "id" TEXT NOT NULL,
    "internalRef" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,
    "version" TEXT,
    "year" INTEGER NOT NULL,
    "firstRegistrationDate" TIMESTAMP(3),
    "mileage" INTEGER NOT NULL DEFAULT 0,
    "fuel" "FuelType",
    "transmission" "TransmissionType",
    "color" TEXT,
    "interiorColor" TEXT,
    "fiscalPower" INTEGER,
    "engineSize" TEXT,
    "vin" TEXT,
    "plate" TEXT,
    "matriculeW" TEXT,
    "origin" "VehicleOrigin" NOT NULL,
    "originCountry" TEXT,
    "vehicleCondition" "VehicleCondition",
    "conditionNotes" TEXT,
    "purchasePrice" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "extraFeesTotal" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "costPrice" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "targetSalePrice" DECIMAL(14,2),
    "finalSalePrice" DECIMAL(14,2),
    "status" "VehicleStatus" NOT NULL DEFAULT 'IN_STOCK',
    "depotId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vehicle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VehiclePhoto" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VehiclePhoto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Purchase" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "vehicleId" TEXT,
    "supplierId" TEXT NOT NULL,
    "invoiceNumber" TEXT,
    "purchaseDate" TIMESTAMP(3) NOT NULL,
    "invoiceDate" TIMESTAMP(3),
    "purchaseType" "PurchaseType" NOT NULL DEFAULT 'LOCAL',
    "currency" "Currency" NOT NULL DEFAULT 'MAD',
    "amountHT" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "taxAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "amountTTC" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "discount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "totalPurchasePrice" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "totalExpenses" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "costPrice" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "basePrice" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "advancePaid" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "paymentMethod" "PaymentMethod",
    "paymentStatus" "PurchasePaymentStatus" NOT NULL DEFAULT 'UNPAID',
    "status" "PurchaseStatus" NOT NULL DEFAULT 'DRAFT',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Purchase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseFee" (
    "id" TEXT NOT NULL,
    "purchaseId" TEXT NOT NULL,
    "type" "PurchaseFeeType" NOT NULL DEFAULT 'OTHER',
    "amount" DECIMAL(14,2) NOT NULL,
    "label" TEXT,
    "expenseDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "documentId" TEXT,

    CONSTRAINT "PurchaseFee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sale" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL DEFAULT 'VTE-LEGACY',
    "vehicleId" TEXT NOT NULL,
    "clientId" TEXT,
    "depotId" TEXT,
    "commercialId" TEXT,
    "validatedById" TEXT,
    "validatedAt" TIMESTAMP(3),
    "saleDate" TIMESTAMP(3) NOT NULL,
    "price" DECIMAL(14,2) NOT NULL,
    "discount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "taxAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "finalPrice" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "costPrice" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "margin" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "marginRate" DECIMAL(8,4),
    "advanceReceived" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "saleType" "SaleType" NOT NULL DEFAULT 'CASH',
    "paymentMethod" "PaymentMethod",
    "paymentStatus" "SalePaymentStatus" NOT NULL DEFAULT 'UNPAID',
    "status" "SaleRecordStatus" NOT NULL DEFAULT 'VALIDATED',
    "deliveryStatus" "DeliveryStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "warranty" BOOLEAN NOT NULL DEFAULT false,
    "warrantyDurationMonths" INTEGER,
    "specialConditions" TEXT,
    "draftClient" JSONB,
    "cancelReason" TEXT,
    "notes" TEXT,
    "invoiceNumber" TEXT,
    "invoicePdfPath" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Sale_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExitVoucher" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "saleId" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "depotId" TEXT NOT NULL,
    "assignedWarehouseUserId" TEXT,
    "secureToken" TEXT NOT NULL,
    "pdfPath" TEXT,
    "status" "ExitVoucherStatus" NOT NULL DEFAULT 'PENDING',
    "message" TEXT,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deliveredAt" TIMESTAMP(3),
    "deliveredById" TEXT,
    "deliveryNotes" TEXT,
    "deliveryPhotoUrl" TEXT,
    "cancelledAt" TIMESTAMP(3),
    "cancelledById" TEXT,
    "cancellationReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExitVoucher_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeliveryNote" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "saleId" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "depotId" TEXT NOT NULL,
    "exitVoucherId" TEXT,
    "generatedById" TEXT,
    "deliveredById" TEXT,
    "qrToken" TEXT NOT NULL,
    "pdfUrl" TEXT,
    "signedDocumentUrl" TEXT,
    "status" "DeliveryNoteStatus" NOT NULL DEFAULT 'GENERATED',
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deliveredAt" TIMESTAMP(3),
    "deliveryDate" TIMESTAMP(3),
    "deliveryTime" TEXT,
    "mileageAtDelivery" INTEGER,
    "checklist" JSONB,
    "observations" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeliveryNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeliveryDocument" (
    "id" TEXT NOT NULL,
    "deliveryNoteId" TEXT NOT NULL,
    "saleId" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "type" "DeliveryDocumentType" NOT NULL DEFAULT 'SIGNED_DELIVERY_NOTE',
    "title" TEXT,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileMimeType" TEXT,
    "fileSize" INTEGER,
    "uploadedById" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DeliveryDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppNotification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "link" TEXT,
    "status" "AppNotificationStatus" NOT NULL DEFAULT 'UNREAD',
    "type" TEXT NOT NULL DEFAULT 'EXIT_VOUCHER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" TIMESTAMP(3),

    CONSTRAINT "AppNotification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "paymentReference" TEXT,
    "category" "PaymentCategory",
    "amount" DECIMAL(14,2) NOT NULL,
    "currency" "Currency" NOT NULL DEFAULT 'MAD',
    "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "method" "PaymentMethod" NOT NULL,
    "direction" "PaymentDirection" NOT NULL,
    "validationStatus" "PaymentValidationStatus" NOT NULL DEFAULT 'VALIDATED',
    "reference" TEXT,
    "bank" TEXT,
    "checkNumber" TEXT,
    "transferReference" TEXT,
    "dueDate" TIMESTAMP(3),
    "cancelReason" TEXT,
    "notes" TEXT,
    "supplierId" TEXT,
    "purchaseId" TEXT,
    "saleId" TEXT,
    "clientId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "category" "DocumentCategory" NOT NULL,
    "title" TEXT,
    "originalName" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "mimeType" TEXT,
    "size" INTEGER,
    "notes" TEXT,
    "vehicleId" TEXT,
    "clientId" TEXT,
    "supplierId" TEXT,
    "purchaseId" TEXT,
    "saleId" TEXT,
    "paymentId" TEXT,
    "uploadedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentTemplate" (
    "id" TEXT NOT NULL,
    "type" "GeneratedDocumentType" NOT NULL,
    "name" TEXT NOT NULL,
    "version" TEXT NOT NULL DEFAULT '1.0',
    "layoutConfig" JSONB,
    "isDefault" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocumentTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GeneratedDocument" (
    "id" TEXT NOT NULL,
    "type" "GeneratedDocumentType" NOT NULL,
    "reference" TEXT NOT NULL,
    "saleId" TEXT,
    "vehicleId" TEXT,
    "clientId" TEXT,
    "depotId" TEXT,
    "exitVoucherId" TEXT,
    "deliveryNoteId" TEXT,
    "pdfUrl" TEXT,
    "status" "GeneratedDocumentStatus" NOT NULL DEFAULT 'GENERATED',
    "generatedById" TEXT,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentAt" TIMESTAMP(3),
    "downloadedAt" TIMESTAMP(3),
    "printedAt" TIMESTAMP(3),
    "signedUploadedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GeneratedDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentHistory" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "userId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompanyProfile" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "legalName" TEXT NOT NULL DEFAULT '',
    "tradeName" TEXT,
    "legalForm" TEXT,
    "ice" TEXT,
    "rc" TEXT,
    "taxId" TEXT,
    "patent" TEXT,
    "cnss" TEXT,
    "capital" TEXT,
    "address" TEXT,
    "city" TEXT,
    "postalCode" TEXT,
    "country" TEXT DEFAULT 'Maroc',
    "phone" TEXT,
    "fax" TEXT,
    "email" TEXT,
    "website" TEXT,
    "bankName" TEXT,
    "bankAccount" TEXT,
    "logoUrl" TEXT,
    "headerImageUrl" TEXT,
    "footerImageUrl" TEXT,
    "headerText" TEXT,
    "footerText" TEXT,
    "documentNotes" TEXT,
    "signedDeliveryRequired" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanyProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Expense" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "category" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Expense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockMovement" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "movementType" "StockMovementType" NOT NULL DEFAULT 'INITIAL',
    "status" "StockMovementStatus" NOT NULL DEFAULT 'COMPLETED',
    "fromDepotId" TEXT,
    "toDepotId" TEXT,
    "purchaseId" TEXT,
    "saleId" TEXT,
    "reason" TEXT,
    "movementDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "userId" TEXT,
    "completedById" TEXT,

    CONSTRAINT "StockMovement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_reference_key" ON "Employee"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_cin_key" ON "Employee"("cin");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_professionalEmail_key" ON "Employee"("professionalEmail");

-- CreateIndex
CREATE UNIQUE INDEX "Role_code_key" ON "Role"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Permission_module_action_key" ON "Permission"("module", "action");

-- CreateIndex
CREATE UNIQUE INDEX "RolePermission_roleId_permissionId_key" ON "RolePermission"("roleId", "permissionId");

-- CreateIndex
CREATE UNIQUE INDEX "UserPermission_userId_permissionId_key" ON "UserPermission"("userId", "permissionId");

-- CreateIndex
CREATE INDEX "AuditLog_module_createdAt_idx" ON "AuditLog"("module", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_actorUserId_createdAt_idx" ON "AuditLog"("actorUserId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "UserSession_sessionToken_key" ON "UserSession"("sessionToken");

-- CreateIndex
CREATE INDEX "UserSession_userId_idx" ON "UserSession"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "User_employeeId_key" ON "User"("employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Depot_reference_key" ON "Depot"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "Supplier_reference_key" ON "Supplier"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "Supplier_ice_key" ON "Supplier"("ice");

-- CreateIndex
CREATE UNIQUE INDEX "Supplier_cin_key" ON "Supplier"("cin");

-- CreateIndex
CREATE UNIQUE INDEX "Client_reference_key" ON "Client"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "Client_cin_key" ON "Client"("cin");

-- CreateIndex
CREATE UNIQUE INDEX "Client_ice_key" ON "Client"("ice");

-- CreateIndex
CREATE INDEX "Client_assignedCommercialId_isArchived_idx" ON "Client"("assignedCommercialId", "isArchived");

-- CreateIndex
CREATE INDEX "Client_relationshipStatus_idx" ON "Client"("relationshipStatus");

-- CreateIndex
CREATE UNIQUE INDEX "Brand_label_key" ON "Brand"("label");

-- CreateIndex
CREATE UNIQUE INDEX "VehicleModel_brandId_label_key" ON "VehicleModel"("brandId", "label");

-- CreateIndex
CREATE UNIQUE INDEX "Vehicle_internalRef_key" ON "Vehicle"("internalRef");

-- CreateIndex
CREATE UNIQUE INDEX "Vehicle_vin_key" ON "Vehicle"("vin");

-- CreateIndex
CREATE UNIQUE INDEX "Vehicle_plate_key" ON "Vehicle"("plate");

-- CreateIndex
CREATE INDEX "Vehicle_status_depotId_idx" ON "Vehicle"("status", "depotId");

-- CreateIndex
CREATE INDEX "Vehicle_depotId_createdAt_idx" ON "Vehicle"("depotId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Purchase_reference_key" ON "Purchase"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "Purchase_vehicleId_key" ON "Purchase"("vehicleId");

-- CreateIndex
CREATE UNIQUE INDEX "Sale_reference_key" ON "Sale"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "Sale_vehicleId_key" ON "Sale"("vehicleId");

-- CreateIndex
CREATE UNIQUE INDEX "Sale_invoiceNumber_key" ON "Sale"("invoiceNumber");

-- CreateIndex
CREATE INDEX "Sale_status_saleDate_idx" ON "Sale"("status", "saleDate");

-- CreateIndex
CREATE INDEX "Sale_commercialId_status_idx" ON "Sale"("commercialId", "status");

-- CreateIndex
CREATE INDEX "Sale_clientId_idx" ON "Sale"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "ExitVoucher_reference_key" ON "ExitVoucher"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "ExitVoucher_saleId_key" ON "ExitVoucher"("saleId");

-- CreateIndex
CREATE UNIQUE INDEX "ExitVoucher_secureToken_key" ON "ExitVoucher"("secureToken");

-- CreateIndex
CREATE INDEX "ExitVoucher_depotId_status_idx" ON "ExitVoucher"("depotId", "status");

-- CreateIndex
CREATE INDEX "ExitVoucher_secureToken_idx" ON "ExitVoucher"("secureToken");

-- CreateIndex
CREATE UNIQUE INDEX "DeliveryNote_reference_key" ON "DeliveryNote"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "DeliveryNote_saleId_key" ON "DeliveryNote"("saleId");

-- CreateIndex
CREATE UNIQUE INDEX "DeliveryNote_exitVoucherId_key" ON "DeliveryNote"("exitVoucherId");

-- CreateIndex
CREATE UNIQUE INDEX "DeliveryNote_qrToken_key" ON "DeliveryNote"("qrToken");

-- CreateIndex
CREATE INDEX "DeliveryNote_depotId_status_idx" ON "DeliveryNote"("depotId", "status");

-- CreateIndex
CREATE INDEX "DeliveryNote_qrToken_idx" ON "DeliveryNote"("qrToken");

-- CreateIndex
CREATE INDEX "DeliveryDocument_deliveryNoteId_idx" ON "DeliveryDocument"("deliveryNoteId");

-- CreateIndex
CREATE INDEX "DeliveryDocument_saleId_idx" ON "DeliveryDocument"("saleId");

-- CreateIndex
CREATE INDEX "AppNotification_userId_status_createdAt_idx" ON "AppNotification"("userId", "status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_paymentReference_key" ON "Payment"("paymentReference");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentTemplate_type_version_key" ON "DocumentTemplate"("type", "version");

-- CreateIndex
CREATE UNIQUE INDEX "GeneratedDocument_exitVoucherId_key" ON "GeneratedDocument"("exitVoucherId");

-- CreateIndex
CREATE UNIQUE INDEX "GeneratedDocument_deliveryNoteId_key" ON "GeneratedDocument"("deliveryNoteId");

-- CreateIndex
CREATE INDEX "GeneratedDocument_type_saleId_idx" ON "GeneratedDocument"("type", "saleId");

-- CreateIndex
CREATE INDEX "GeneratedDocument_reference_idx" ON "GeneratedDocument"("reference");

-- CreateIndex
CREATE INDEX "DocumentHistory_documentId_createdAt_idx" ON "DocumentHistory"("documentId", "createdAt");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_depotId_fkey" FOREIGN KEY ("depotId") REFERENCES "Depot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeDocument" ADD CONSTRAINT "EmployeeDocument_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeDocument" ADD CONSTRAINT "EmployeeDocument_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPermission" ADD CONSTRAINT "UserPermission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPermission" ADD CONSTRAINT "UserPermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSession" ADD CONSTRAINT "UserSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_depotId_fkey" FOREIGN KEY ("depotId") REFERENCES "Depot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Depot" ADD CONSTRAINT "Depot_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Client" ADD CONSTRAINT "Client_assignedCommercialId_fkey" FOREIGN KEY ("assignedCommercialId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientDocument" ADD CONSTRAINT "ClientDocument_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientDocument" ADD CONSTRAINT "ClientDocument_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientInteraction" ADD CONSTRAINT "ClientInteraction_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientInteraction" ADD CONSTRAINT "ClientInteraction_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientReminder" ADD CONSTRAINT "ClientReminder_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientReminder" ADD CONSTRAINT "ClientReminder_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehicleModel" ADD CONSTRAINT "VehicleModel_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "VehicleModel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_depotId_fkey" FOREIGN KEY ("depotId") REFERENCES "Depot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehiclePhoto" ADD CONSTRAINT "VehiclePhoto_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Purchase" ADD CONSTRAINT "Purchase_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Purchase" ADD CONSTRAINT "Purchase_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseFee" ADD CONSTRAINT "PurchaseFee_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "Purchase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_depotId_fkey" FOREIGN KEY ("depotId") REFERENCES "Depot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_commercialId_fkey" FOREIGN KEY ("commercialId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_validatedById_fkey" FOREIGN KEY ("validatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExitVoucher" ADD CONSTRAINT "ExitVoucher_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExitVoucher" ADD CONSTRAINT "ExitVoucher_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExitVoucher" ADD CONSTRAINT "ExitVoucher_depotId_fkey" FOREIGN KEY ("depotId") REFERENCES "Depot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExitVoucher" ADD CONSTRAINT "ExitVoucher_assignedWarehouseUserId_fkey" FOREIGN KEY ("assignedWarehouseUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExitVoucher" ADD CONSTRAINT "ExitVoucher_deliveredById_fkey" FOREIGN KEY ("deliveredById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExitVoucher" ADD CONSTRAINT "ExitVoucher_cancelledById_fkey" FOREIGN KEY ("cancelledById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliveryNote" ADD CONSTRAINT "DeliveryNote_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliveryNote" ADD CONSTRAINT "DeliveryNote_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliveryNote" ADD CONSTRAINT "DeliveryNote_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliveryNote" ADD CONSTRAINT "DeliveryNote_depotId_fkey" FOREIGN KEY ("depotId") REFERENCES "Depot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliveryNote" ADD CONSTRAINT "DeliveryNote_exitVoucherId_fkey" FOREIGN KEY ("exitVoucherId") REFERENCES "ExitVoucher"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliveryNote" ADD CONSTRAINT "DeliveryNote_generatedById_fkey" FOREIGN KEY ("generatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliveryNote" ADD CONSTRAINT "DeliveryNote_deliveredById_fkey" FOREIGN KEY ("deliveredById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliveryDocument" ADD CONSTRAINT "DeliveryDocument_deliveryNoteId_fkey" FOREIGN KEY ("deliveryNoteId") REFERENCES "DeliveryNote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliveryDocument" ADD CONSTRAINT "DeliveryDocument_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliveryDocument" ADD CONSTRAINT "DeliveryDocument_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliveryDocument" ADD CONSTRAINT "DeliveryDocument_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliveryDocument" ADD CONSTRAINT "DeliveryDocument_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppNotification" ADD CONSTRAINT "AppNotification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "Purchase"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "Purchase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GeneratedDocument" ADD CONSTRAINT "GeneratedDocument_generatedById_fkey" FOREIGN KEY ("generatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentHistory" ADD CONSTRAINT "DocumentHistory_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "GeneratedDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentHistory" ADD CONSTRAINT "DocumentHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_fromDepotId_fkey" FOREIGN KEY ("fromDepotId") REFERENCES "Depot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_toDepotId_fkey" FOREIGN KEY ("toDepotId") REFERENCES "Depot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "Purchase"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
