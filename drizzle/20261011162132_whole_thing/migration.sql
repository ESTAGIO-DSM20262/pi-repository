ALTER TABLE "account" RENAME TO "accounts";--> statement-breakpoint
ALTER TABLE "session" RENAME TO "sessions";--> statement-breakpoint
ALTER TABLE "user" RENAME TO "users";--> statement-breakpoint
ALTER TABLE "verification" RENAME TO "verifications";--> statement-breakpoint
ALTER INDEX "account_user_id_idx" RENAME TO "accounts_user_id_idx";--> statement-breakpoint
ALTER INDEX "session_user_id_idx" RENAME TO "sessions_user_id_idx";--> statement-breakpoint
ALTER INDEX "verification_identifier_idx" RENAME TO "verifications_identifier_idx";