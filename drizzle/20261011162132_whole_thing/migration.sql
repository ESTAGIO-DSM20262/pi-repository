-- Migration idempotente: so renomeia o que ainda estiver com o nome antigo.
DO $migration$
BEGIN
  IF to_regclass('public."account"') IS NOT NULL AND to_regclass('public."accounts"') IS NULL THEN
    ALTER TABLE "account" RENAME TO "accounts";
  END IF;

  IF to_regclass('public."session"') IS NOT NULL AND to_regclass('public."sessions"') IS NULL THEN
    ALTER TABLE "session" RENAME TO "sessions";
  END IF;

  IF to_regclass('public."user"') IS NOT NULL AND to_regclass('public."users"') IS NULL THEN
    ALTER TABLE "user" RENAME TO "users";
  END IF;

  IF to_regclass('public."verification"') IS NOT NULL AND to_regclass('public."verifications"') IS NULL THEN
    ALTER TABLE "verification" RENAME TO "verifications";
  END IF;

  IF to_regclass('public."account_user_id_idx"') IS NOT NULL AND to_regclass('public."accounts_user_id_idx"') IS NULL THEN
    ALTER INDEX "account_user_id_idx" RENAME TO "accounts_user_id_idx";
  END IF;

  IF to_regclass('public."session_user_id_idx"') IS NOT NULL AND to_regclass('public."sessions_user_id_idx"') IS NULL THEN
    ALTER INDEX "session_user_id_idx" RENAME TO "sessions_user_id_idx";
  END IF;

  IF to_regclass('public."verification_identifier_idx"') IS NOT NULL AND to_regclass('public."verifications_identifier_idx"') IS NULL THEN
    ALTER INDEX "verification_identifier_idx" RENAME TO "verifications_identifier_idx";
  END IF;
END
$migration$;
