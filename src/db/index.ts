import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'

const connectionString = process.env.DATABASE_URL
if (!connectionString) throw new Error('DATABASE_URL is not set')

const sql = neon(connectionString)

// Relational queries (`db.query.*`) require a `relations` config built from the
// schema once tables are added — see drizzle-orm's `buildRelations` helper.
export const db = drizzle({ client: sql })
