I am switching my app from SQLite to PostgreSQL.

Please review my Prisma setup and make the required changes so the project uses PostgreSQL correctly.

Current issue:
Prisma shows this error:

"The datasource provider `postgresql` specified in your schema does not match the one specified in the migration_lock.toml, `sqlite`. Please remove your current migration directory and start a new migration history with prisma migrate dev."

What I need you to do:

1. Update `prisma/schema.prisma` so the datasource uses PostgreSQL:

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

2. Update the `.env` file so `DATABASE_URL` uses a PostgreSQL connection string.

Use a placeholder like:

DATABASE_URL="postgresql://DB_USER:DB_PASSWORD@DB_HOST:DB_PORT/DB_NAME?sslmode=require"

3. Remove or reset the old SQLite migration history.

Delete the old folder:

prisma/migrations

4. Create a new PostgreSQL migration history.

Run:

npx prisma migrate dev --name init

5. Regenerate Prisma Client.

Run:

npx prisma generate

6. Check the codebase for any SQLite-specific settings, files, or references and replace them with PostgreSQL-compatible settings.

7. Make sure the app connects through the backend only and does not expose database credentials in the frontend.

8. Explain each change briefly and list any commands I need to run.

Important:
I am still in development, so it is okay to reset the migration history. Do not preserve old SQLite migrations.