-- Migration idempotente: se o banco ja possui o schema (tabelas "user"/"users"), nada e criado.
DO $migration$
BEGIN
  IF to_regclass('public."user"') IS NOT NULL OR to_regclass('public.users') IS NOT NULL THEN
    RETURN;
  END IF;

  CREATE TABLE "account" (
  	"id" text PRIMARY KEY,
  	"account_id" text NOT NULL,
  	"provider_id" text NOT NULL,
  	"user_id" text NOT NULL,
  	"access_token" text,
  	"refresh_token" text,
  	"id_token" text,
  	"access_token_expires_at" timestamp,
  	"refresh_token_expires_at" timestamp,
  	"scope" text,
  	"password" text,
  	"created_at" timestamp DEFAULT now() NOT NULL,
  	"updated_at" timestamp DEFAULT now() NOT NULL
  );
  CREATE TABLE "session" (
  	"id" text PRIMARY KEY,
  	"expires_at" timestamp NOT NULL,
  	"token" text NOT NULL UNIQUE,
  	"created_at" timestamp DEFAULT now() NOT NULL,
  	"updated_at" timestamp DEFAULT now() NOT NULL,
  	"ip_address" text,
  	"user_agent" text,
  	"user_id" text NOT NULL
  );
  CREATE TABLE "user" (
  	"id" text PRIMARY KEY,
  	"name" text NOT NULL,
  	"email" text NOT NULL UNIQUE,
  	"email_verified" boolean DEFAULT false NOT NULL,
  	"image" text,
  	"role" text NOT NULL,
  	"created_at" timestamp DEFAULT now() NOT NULL,
  	"updated_at" timestamp DEFAULT now() NOT NULL
  );
  CREATE TABLE "verification" (
  	"id" text PRIMARY KEY,
  	"identifier" text NOT NULL,
  	"value" text NOT NULL,
  	"expires_at" timestamp NOT NULL,
  	"created_at" timestamp DEFAULT now() NOT NULL,
  	"updated_at" timestamp DEFAULT now() NOT NULL
  );
  CREATE INDEX "account_user_id_idx" ON "account" ("user_id");
  CREATE INDEX "session_user_id_idx" ON "session" ("user_id");
  CREATE INDEX "verification_identifier_idx" ON "verification" ("identifier");
  ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;
  ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;
END
$migration$;
