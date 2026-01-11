CREATE TABLE "activities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"deal_id" uuid,
	"contact_id" uuid,
	"type" varchar(50) NOT NULL,
	"subject" varchar(255),
	"description" text,
	"outcome" varchar(50),
	"scheduled_at" timestamp,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255),
	"phone" varchar(50),
	"company" varchar(255),
	"title" varchar(100),
	"property_type" varchar(50),
	"website" text,
	"linkedin_url" text,
	"notes" text,
	"source" varchar(50),
	"tags" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "deals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contact_id" uuid,
	"title" varchar(255) NOT NULL,
	"stage" varchar(50) DEFAULT 'lead' NOT NULL,
	"tier" varchar(50),
	"value" numeric(10, 2),
	"billing_period" varchar(20) DEFAULT 'monthly',
	"property_count" integer DEFAULT 1,
	"probability" integer DEFAULT 10,
	"expected_close_date" timestamp,
	"closed_at" timestamp,
	"lost_reason" varchar(255),
	"notes" text,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reminders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"deal_id" uuid,
	"contact_id" uuid,
	"title" varchar(255) NOT NULL,
	"description" text,
	"due_at" timestamp NOT NULL,
	"is_completed" boolean DEFAULT false,
	"completed_at" timestamp,
	"priority" varchar(20) DEFAULT 'medium',
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_deal_id_deals_id_fk" FOREIGN KEY ("deal_id") REFERENCES "public"."deals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deals" ADD CONSTRAINT "deals_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_deal_id_deals_id_fk" FOREIGN KEY ("deal_id") REFERENCES "public"."deals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "activities_deal_idx" ON "activities" USING btree ("deal_id");--> statement-breakpoint
CREATE INDEX "activities_contact_idx" ON "activities" USING btree ("contact_id");--> statement-breakpoint
CREATE INDEX "activities_scheduled_idx" ON "activities" USING btree ("scheduled_at");--> statement-breakpoint
CREATE INDEX "activities_created_idx" ON "activities" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "contacts_email_idx" ON "contacts" USING btree ("email");--> statement-breakpoint
CREATE INDEX "contacts_company_idx" ON "contacts" USING btree ("company");--> statement-breakpoint
CREATE INDEX "contacts_created_idx" ON "contacts" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "deals_contact_idx" ON "deals" USING btree ("contact_id");--> statement-breakpoint
CREATE INDEX "deals_stage_idx" ON "deals" USING btree ("stage");--> statement-breakpoint
CREATE INDEX "deals_expected_close_idx" ON "deals" USING btree ("expected_close_date");--> statement-breakpoint
CREATE INDEX "deals_created_idx" ON "deals" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "reminders_deal_idx" ON "reminders" USING btree ("deal_id");--> statement-breakpoint
CREATE INDEX "reminders_contact_idx" ON "reminders" USING btree ("contact_id");--> statement-breakpoint
CREATE INDEX "reminders_due_idx" ON "reminders" USING btree ("due_at");--> statement-breakpoint
CREATE INDEX "reminders_completed_idx" ON "reminders" USING btree ("is_completed");