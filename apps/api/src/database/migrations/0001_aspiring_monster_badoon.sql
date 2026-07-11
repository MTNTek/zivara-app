ALTER TABLE "applications" ADD COLUMN "version" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "deleted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "employers" ADD COLUMN "deleted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "version" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "deleted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "version" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "professionals" ADD COLUMN "deleted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "shifts" ADD COLUMN "version" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "deleted_at" timestamp with time zone;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_applications_job_id" ON "applications" ("job_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_applications_professional_id" ON "applications" ("professional_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_applications_status" ON "applications" ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_applications_last_reviewed_at" ON "applications" ("last_reviewed_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_applications_deleted_at" ON "applications" ("deleted_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_audit_logs_admin_id" ON "audit_logs" ("admin_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_audit_logs_target_type" ON "audit_logs" ("target_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_audit_logs_target_id" ON "audit_logs" ("target_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_audit_logs_created_at" ON "audit_logs" ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_audit_logs_action" ON "audit_logs" ("action");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_employer_members_user_id" ON "employer_members" ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_employer_members_employer_id" ON "employer_members" ("employer_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_employers_verification_status" ON "employers" ("verification_status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_employers_industry" ON "employers" ("industry");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_employers_country" ON "employers" ("operating_country");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_employers_deleted_at" ON "employers" ("deleted_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_employers_badge" ON "employers" ("is_badge_visible");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_job_required_skills_job_id" ON "job_required_skills" ("job_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_job_required_skills_name" ON "job_required_skills" ("skill_name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_jobs_status" ON "jobs" ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_jobs_industry" ON "jobs" ("industry");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_jobs_city" ON "jobs" ("city");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_jobs_country" ON "jobs" ("country");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_jobs_employment_type" ON "jobs" ("employment_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_jobs_expires_at" ON "jobs" ("expires_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_jobs_employer_id" ON "jobs" ("employer_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_jobs_deleted_at" ON "jobs" ("deleted_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_notifications_user_id" ON "notifications" ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_notifications_user_unread" ON "notifications" ("user_id","is_read");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_notifications_reference_type" ON "notifications" ("reference_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_notifications_reference_id" ON "notifications" ("reference_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_payments_professional_id" ON "payments" ("professional_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_payments_employer_id" ON "payments" ("employer_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_payments_shift_id" ON "payments" ("shift_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_payments_status" ON "payments" ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_payments_completed_at" ON "payments" ("completed_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_professional_documents_professional_id" ON "professional_documents" ("professional_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_professional_documents_verification_status" ON "professional_documents" ("verification_status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_professional_experience_professional_id" ON "professional_experience" ("professional_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_professional_skills_professional_id" ON "professional_skills" ("professional_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_professional_skills_name" ON "professional_skills" ("skill_name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_professionals_industry" ON "professionals" ("primary_industry");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_professionals_city" ON "professionals" ("current_city");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_professionals_country" ON "professionals" ("current_country");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_professionals_verification" ON "professionals" ("verification_status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_professionals_public" ON "professionals" ("is_profile_public");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_professionals_completeness" ON "professionals" ("profile_completeness");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_professionals_gov_id_hash" ON "professionals" ("government_id_hash");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_professionals_deleted_at" ON "professionals" ("deleted_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ratings_reviewee_id" ON "ratings" ("reviewee_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ratings_reviewer_id" ON "ratings" ("reviewer_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ratings_shift_id" ON "ratings" ("shift_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ratings_moderation_status" ON "ratings" ("moderation_status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_shifts_professional_id" ON "shifts" ("professional_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_shifts_employer_id" ON "shifts" ("employer_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_shifts_status" ON "shifts" ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_shifts_shift_date" ON "shifts" ("shift_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_shifts_employer_confirmed" ON "shifts" ("employer_confirmed_completion");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_shifts_professional_confirmed" ON "shifts" ("professional_confirmed_completion");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_refresh_tokens_user_id" ON "refresh_tokens" ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_refresh_tokens_token_hash" ON "refresh_tokens" ("token_hash");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_refresh_tokens_expires_at" ON "refresh_tokens" ("expires_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_users_role" ON "users" ("role");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_users_deleted_at" ON "users" ("deleted_at");