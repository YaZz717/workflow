-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "clientName" TEXT,
ADD COLUMN     "hourlyRateCents" INTEGER;

-- AlterTable
ALTER TABLE "Subscription" ADD COLUMN     "stripeCustomerId" TEXT,
ADD COLUMN     "stripePriceId" TEXT,
ADD COLUMN     "stripeSubscriptionId" TEXT;

-- AlterTable
ALTER TABLE "TimeEntry" ADD COLUMN     "billable" BOOLEAN NOT NULL DEFAULT true;
