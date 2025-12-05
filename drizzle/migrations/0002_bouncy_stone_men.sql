CREATE TYPE "public"."simulation_status" AS ENUM('IN_PROGRESS', 'CONCLUDED');--> statement-breakpoint
ALTER TABLE "simulations" ADD COLUMN "status" "simulation_status" DEFAULT 'IN_PROGRESS' NOT NULL;