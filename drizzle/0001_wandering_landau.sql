CREATE TABLE "email_drafts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"processed_email_id" uuid,
	"gmail_account_id" uuid,
	"original_from_email" varchar(255) NOT NULL,
	"original_from_name" varchar(255),
	"original_subject" varchar(500),
	"original_body" text,
	"original_received_at" timestamp,
	"gmail_thread_id" varchar(255),
	"gmail_message_id" varchar(255),
	"draft_subject" varchar(500),
	"draft_body" text NOT NULL,
	"tone" varchar(50) DEFAULT 'professional' NOT NULL,
	"status" varchar(50) DEFAULT 'pending' NOT NULL,
	"contact_id" uuid,
	"deal_id" uuid,
	"sent_at" timestamp,
	"sent_gmail_message_id" varchar(255),
	"error_message" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "gmail_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"name" varchar(255),
	"access_token" text NOT NULL,
	"refresh_token" text NOT NULL,
	"expiry_date" timestamp NOT NULL,
	"label_filter" varchar(100),
	"is_active" boolean DEFAULT true,
	"last_sync_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "gmail_accounts_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "processed_emails" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"gmail_account_id" uuid,
	"gmail_message_id" varchar(255) NOT NULL,
	"from_email" varchar(255),
	"subject" varchar(500),
	"processed_at" timestamp DEFAULT now() NOT NULL,
	"contact_id" uuid,
	"deal_id" uuid,
	CONSTRAINT "processed_emails_gmail_message_id_unique" UNIQUE("gmail_message_id")
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" varchar(100) NOT NULL,
	"value" text,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "settings_key_unique" UNIQUE("key")
);
--> statement-breakpoint
ALTER TABLE "deals" ADD COLUMN "property_count_range" varchar(20);--> statement-breakpoint
ALTER TABLE "deals" ADD COLUMN "current_system" varchar(100);--> statement-breakpoint
ALTER TABLE "deals" ADD COLUMN "pain_point" varchar(255);--> statement-breakpoint
ALTER TABLE "deals" ADD COLUMN "lead_source" varchar(50);--> statement-breakpoint
ALTER TABLE "deals" ADD COLUMN "next_step" text;--> statement-breakpoint
ALTER TABLE "deals" ADD COLUMN "follow_up_date" timestamp;--> statement-breakpoint
ALTER TABLE "deals" ADD COLUMN "gmail_account_id" uuid;--> statement-breakpoint
ALTER TABLE "email_drafts" ADD CONSTRAINT "email_drafts_processed_email_id_processed_emails_id_fk" FOREIGN KEY ("processed_email_id") REFERENCES "public"."processed_emails"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_drafts" ADD CONSTRAINT "email_drafts_gmail_account_id_gmail_accounts_id_fk" FOREIGN KEY ("gmail_account_id") REFERENCES "public"."gmail_accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_drafts" ADD CONSTRAINT "email_drafts_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_drafts" ADD CONSTRAINT "email_drafts_deal_id_deals_id_fk" FOREIGN KEY ("deal_id") REFERENCES "public"."deals"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "processed_emails" ADD CONSTRAINT "processed_emails_gmail_account_id_gmail_accounts_id_fk" FOREIGN KEY ("gmail_account_id") REFERENCES "public"."gmail_accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "processed_emails" ADD CONSTRAINT "processed_emails_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "processed_emails" ADD CONSTRAINT "processed_emails_deal_id_deals_id_fk" FOREIGN KEY ("deal_id") REFERENCES "public"."deals"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "email_drafts_status_idx" ON "email_drafts" USING btree ("status");--> statement-breakpoint
CREATE INDEX "email_drafts_contact_idx" ON "email_drafts" USING btree ("contact_id");--> statement-breakpoint
CREATE INDEX "email_drafts_deal_idx" ON "email_drafts" USING btree ("deal_id");--> statement-breakpoint
CREATE INDEX "email_drafts_created_idx" ON "email_drafts" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "gmail_accounts_email_idx" ON "gmail_accounts" USING btree ("email");--> statement-breakpoint
CREATE INDEX "gmail_accounts_active_idx" ON "gmail_accounts" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "processed_emails_gmail_id_idx" ON "processed_emails" USING btree ("gmail_message_id");--> statement-breakpoint
CREATE INDEX "processed_emails_from_idx" ON "processed_emails" USING btree ("from_email");--> statement-breakpoint
CREATE INDEX "processed_emails_account_idx" ON "processed_emails" USING btree ("gmail_account_id");--> statement-breakpoint
ALTER TABLE "deals" ADD CONSTRAINT "deals_gmail_account_id_gmail_accounts_id_fk" FOREIGN KEY ("gmail_account_id") REFERENCES "public"."gmail_accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "deals_follow_up_idx" ON "deals" USING btree ("follow_up_date");--> statement-breakpoint
CREATE INDEX "deals_gmail_account_idx" ON "deals" USING btree ("gmail_account_id");