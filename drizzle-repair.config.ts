import 'dotenv/config'
import { defineConfig } from 'drizzle-kit'

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) throw new Error('DATABASE_URL is not set')

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/db/schema.ts',
  out: './drizzle-repair',
  dbCredentials: {
    url: databaseUrl,
  },
  migrations: {
    table: '__drizzle_repair_migrations',
    schema: 'public',
  },
})
