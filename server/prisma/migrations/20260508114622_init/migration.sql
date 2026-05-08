-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "surname" TEXT DEFAULT '',
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "mobile" TEXT DEFAULT '',
    "country" TEXT DEFAULT '',
    "city" TEXT DEFAULT '',
    "region" TEXT DEFAULT '',
    "role" TEXT NOT NULL DEFAULT 'sales',
    "roleId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLogin" TIMESTAMP(3),
    "avatar" TEXT,
    "preferences" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Role" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT DEFAULT '',
    "permissions" JSONB,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT,
    "segment" TEXT,
    "gst" TEXT,
    "pan" TEXT,
    "contact" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "city" TEXT,
    "region" TEXT,
    "creditLimit" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "payTerms" INTEGER NOT NULL DEFAULT 30,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "rating" TEXT NOT NULL DEFAULT 'B+ (Good)',
    "notes" TEXT,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "customer" TEXT NOT NULL,
    "customerId" TEXT,
    "contact" TEXT,
    "segment" TEXT,
    "region" TEXT,
    "category" TEXT,
    "sku" TEXT,
    "skuId" TEXT,
    "qty" DOUBLE PRECISION,
    "unit" TEXT,
    "source" TEXT,
    "tenderRef" TEXT,
    "bidDate" TIMESTAMP(3),
    "estValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "stage" TEXT NOT NULL DEFAULT 'New Enquiry',
    "priority" TEXT NOT NULL DEFAULT 'Medium',
    "salesRep" TEXT,
    "salesRepId" TEXT,
    "followUp" TIMESTAMP(3),
    "notes" TEXT,
    "stageHistory" JSONB,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdById" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Quotation" (
    "id" TEXT NOT NULL,
    "quoteId" TEXT NOT NULL,
    "customer" TEXT NOT NULL,
    "customerId" TEXT,
    "leadId" TEXT,
    "leadRefId" TEXT,
    "items" JSONB,
    "sku" TEXT,
    "product" TEXT,
    "category" TEXT,
    "qty" DOUBLE PRECISION,
    "unit" TEXT,
    "make" TEXT,
    "unitCost" DOUBLE PRECISION,
    "unitPrice" DOUBLE PRECISION,
    "discount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "gstRate" TEXT NOT NULL DEFAULT '18%',
    "netPrice" DOUBLE PRECISION,
    "lineTotal" DOUBLE PRECISION,
    "gstAmt" DOUBLE PRECISION,
    "total" DOUBLE PRECISION,
    "margin" DOUBLE PRECISION,
    "marginPct" DOUBLE PRECISION,
    "validity" INTEGER NOT NULL DEFAULT 30,
    "status" TEXT NOT NULL DEFAULT 'Draft',
    "salesRep" TEXT,
    "salesRepId" TEXT,
    "delivTerms" TEXT,
    "payTerms" TEXT,
    "incoterm" TEXT,
    "warranty" TEXT,
    "notes" TEXT,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdById" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Quotation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalesPO" (
    "id" TEXT NOT NULL,
    "spoId" TEXT NOT NULL,
    "customer" TEXT NOT NULL,
    "customerId" TEXT,
    "quoteId" TEXT,
    "quoteRefId" TEXT,
    "items" JSONB,
    "sku" TEXT,
    "product" TEXT,
    "category" TEXT,
    "qty" DOUBLE PRECISION,
    "unit" TEXT,
    "make" TEXT,
    "unitPrice" DOUBLE PRECISION,
    "unitCost" DOUBLE PRECISION,
    "gstRate" TEXT NOT NULL DEFAULT '18%',
    "rev" DOUBLE PRECISION,
    "gst" DOUBLE PRECISION,
    "totalWithGst" DOUBLE PRECISION,
    "cost" DOUBLE PRECISION,
    "margin" DOUBLE PRECISION,
    "marginPct" DOUBLE PRECISION,
    "freightCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "ldDeduction" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "incoterm" TEXT,
    "poDate" TIMESTAMP(3),
    "delivDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'Order Confirmed',
    "salesRep" TEXT,
    "salesRepId" TEXT,
    "paymentTerms" TEXT,
    "ldTerms" TEXT,
    "warrantyTerms" TEXT,
    "inspectionTerms" TEXT,
    "qualityStds" TEXT,
    "notes" TEXT,
    "statusHistory" JSONB,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalesPO_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vendor" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT,
    "category" TEXT,
    "brands" TEXT,
    "gst" TEXT,
    "pan" TEXT,
    "contact" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "city" TEXT,
    "region" TEXT,
    "leadTime" INTEGER NOT NULL DEFAULT 30,
    "payTerms" INTEGER NOT NULL DEFAULT 30,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "rating" TEXT NOT NULL DEFAULT 'B+ (Good)',
    "notes" TEXT,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vendor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Inventory" (
    "id" TEXT NOT NULL,
    "invId" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "skuId" TEXT,
    "product" TEXT,
    "category" TEXT,
    "make" TEXT,
    "unit" TEXT NOT NULL DEFAULT 'Nos.',
    "warehouse" TEXT,
    "location" TEXT,
    "openingQty" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "receivedQty" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "issuedQty" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reservedQty" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reorderLevel" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reorderQty" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "notes" TEXT,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Inventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Catalog" (
    "id" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "subCat" TEXT,
    "segment" TEXT,
    "make" TEXT,
    "unit" TEXT NOT NULL DEFAULT 'Nos.',
    "hsn" TEXT,
    "gstRate" TEXT NOT NULL DEFAULT '18%',
    "costPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "listPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "minPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "warranty" TEXT,
    "specs" TEXT,
    "priceHistory" JSONB,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Catalog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tender" (
    "id" TEXT NOT NULL,
    "tenderId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "tenderNo" TEXT,
    "customer" TEXT,
    "customerId" TEXT,
    "type" TEXT NOT NULL DEFAULT 'Open Tender',
    "segment" TEXT,
    "region" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Pre-Bid Prep',
    "salesRep" TEXT,
    "salesRepId" TEXT,
    "linkedLead" TEXT,
    "leadRefId" TEXT,
    "estimatedValue" DOUBLE PRECISION,
    "ourBidValue" DOUBLE PRECISION,
    "emdAmount" DOUBLE PRECISION,
    "emdMode" TEXT,
    "emdRef" TEXT,
    "bidDate" TIMESTAMP(3),
    "openDate" TIMESTAMP(3),
    "resultDate" TIMESTAMP(3),
    "linkedBG" TEXT,
    "checklist" JSONB,
    "notes" TEXT,
    "tags" TEXT[],
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tender_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "docId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'Other',
    "linkedType" TEXT,
    "linkedTo" TEXT,
    "fileName" TEXT,
    "originalName" TEXT,
    "mimeType" TEXT,
    "fileSize" DOUBLE PRECISION,
    "filePath" TEXT,
    "uploadedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "tags" TEXT[],
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Procurement" (
    "id" TEXT NOT NULL,
    "procId" TEXT NOT NULL,
    "vendor" TEXT NOT NULL,
    "vendorId" TEXT,
    "salesPORef" TEXT,
    "salesPOId" TEXT,
    "items" JSONB,
    "sku" TEXT,
    "product" TEXT,
    "category" TEXT,
    "qty" DOUBLE PRECISION,
    "unit" TEXT,
    "make" TEXT,
    "unitCost" DOUBLE PRECISION,
    "gstRate" TEXT NOT NULL DEFAULT '18%',
    "purDate" TIMESTAMP(3),
    "expDelivery" TIMESTAMP(3),
    "actualDelivery" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'Enquiry Sent',
    "buyer" TEXT,
    "buyerId" TEXT,
    "notes" TEXT,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Procurement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_userId_key" ON "User"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Role_name_key" ON "Role"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_customerId_key" ON "Customer"("customerId");

-- CreateIndex
CREATE UNIQUE INDEX "Lead_leadId_key" ON "Lead"("leadId");

-- CreateIndex
CREATE UNIQUE INDEX "Quotation_quoteId_key" ON "Quotation"("quoteId");

-- CreateIndex
CREATE UNIQUE INDEX "SalesPO_spoId_key" ON "SalesPO"("spoId");

-- CreateIndex
CREATE UNIQUE INDEX "Vendor_vendorId_key" ON "Vendor"("vendorId");

-- CreateIndex
CREATE UNIQUE INDEX "Inventory_invId_key" ON "Inventory"("invId");

-- CreateIndex
CREATE UNIQUE INDEX "Catalog_sku_key" ON "Catalog"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "Tender_tenderId_key" ON "Tender"("tenderId");

-- CreateIndex
CREATE UNIQUE INDEX "Document_docId_key" ON "Document"("docId");

-- CreateIndex
CREATE UNIQUE INDEX "Procurement_procId_key" ON "Procurement"("procId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Role" ADD CONSTRAINT "Role_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_skuId_fkey" FOREIGN KEY ("skuId") REFERENCES "Catalog"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_salesRepId_fkey" FOREIGN KEY ("salesRepId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quotation" ADD CONSTRAINT "Quotation_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quotation" ADD CONSTRAINT "Quotation_leadRefId_fkey" FOREIGN KEY ("leadRefId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quotation" ADD CONSTRAINT "Quotation_salesRepId_fkey" FOREIGN KEY ("salesRepId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quotation" ADD CONSTRAINT "Quotation_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesPO" ADD CONSTRAINT "SalesPO_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesPO" ADD CONSTRAINT "SalesPO_quoteRefId_fkey" FOREIGN KEY ("quoteRefId") REFERENCES "Quotation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesPO" ADD CONSTRAINT "SalesPO_salesRepId_fkey" FOREIGN KEY ("salesRepId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesPO" ADD CONSTRAINT "SalesPO_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vendor" ADD CONSTRAINT "Vendor_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inventory" ADD CONSTRAINT "Inventory_skuId_fkey" FOREIGN KEY ("skuId") REFERENCES "Catalog"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inventory" ADD CONSTRAINT "Inventory_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Catalog" ADD CONSTRAINT "Catalog_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tender" ADD CONSTRAINT "Tender_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tender" ADD CONSTRAINT "Tender_salesRepId_fkey" FOREIGN KEY ("salesRepId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tender" ADD CONSTRAINT "Tender_leadRefId_fkey" FOREIGN KEY ("leadRefId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tender" ADD CONSTRAINT "Tender_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Procurement" ADD CONSTRAINT "Procurement_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Procurement" ADD CONSTRAINT "Procurement_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Procurement" ADD CONSTRAINT "Procurement_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
