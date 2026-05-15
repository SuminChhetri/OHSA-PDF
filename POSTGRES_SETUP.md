# How to Connect to a Real PostgreSQL Database

Think of your database like a box where the app keeps all its information.
This app uses PostgreSQL — a proper, production-ready box that can live in the cloud or on your computer.

Here's how to get it connected. You only do this once!

---

## Step 1 — Get a PostgreSQL Database

You need a place to run PostgreSQL. Pick **one** of these:

### Option A — Free cloud database (easiest, nothing to install)

Go to [https://neon.tech](https://neon.tech) and make a free account.
Click **New Project**, give it any name, and click **Create Project**.
It will show you a connection string that looks like this:

```
postgresql://alex:AbC123xYz@ep-cool-fog-123456.us-east-2.aws.neon.tech/neondb?sslmode=require
```

Copy that whole thing. That is your `DATABASE_URL`. Skip to Step 2.

---

### Option B — PostgreSQL already running on your computer

If you have PostgreSQL installed locally, open your terminal and run:

```bash
psql -U postgres -c "CREATE DATABASE osha_recordkeeping;"
```

Your connection string will be:

```
postgresql://postgres:YOUR_POSTGRES_PASSWORD@localhost:5432/osha_recordkeeping
```

Replace `YOUR_POSTGRES_PASSWORD` with the password you set when you installed PostgreSQL.

---

### Option C — Use Docker (no install needed)

If you have Docker, run this one command to start a PostgreSQL container:

```bash
docker run -d \
  --name osha-db \
  -e POSTGRES_PASSWORD=mysecretpassword \
  -e POSTGRES_DB=osha_recordkeeping \
  -p 5432:5432 \
  postgres:16
```

Your connection string will be:

```
postgresql://postgres:mysecretpassword@localhost:5432/osha_recordkeeping
```

---

## Step 2 — Create Your `.env` File

In the root of the project (`OHSA/`) you will see a file called `.env.example`.
Make a copy of it and name the copy `.env`:

```bash
cp .env.example .env
```

Now open `.env` in any text editor (Notepad, VS Code, anything).

Find this line:

```
DATABASE_URL="postgresql://DB_USER:DB_PASSWORD@DB_HOST:5432/DB_NAME?sslmode=require"
```

Replace it with the real connection string you got in Step 1.
For example, if you used Neon it would look like:

```
DATABASE_URL="postgresql://alex:AbC123xYz@ep-cool-fog-123456.us-east-2.aws.neon.tech/neondb?sslmode=require"
```

Save the file.

---

## Step 3 — Fill In the Other Two Required Values

While `.env` is open, fix these two lines too (they must not stay as the example values):

**Line 1 — a secret password for logins:**

```bash
# Run this in your terminal to generate one:
openssl rand -base64 32
```

Copy the output and paste it in:

```
NEXTAUTH_SECRET="paste_the_output_here"
```

**Line 2 — a secret key to protect sensitive data:**

```bash
# Run this in your terminal to generate one:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output and paste it in:

```
FIELD_ENCRYPTION_KEY=paste_the_output_here
```

Your finished `.env` should look something like this:

```
DATABASE_URL="postgresql://alex:AbC123xYz@ep-cool-fog-123456.us-east-2.aws.neon.tech/neondb?sslmode=require"
NEXTAUTH_SECRET="r4nD0mStr1ngHere=="
NEXTAUTH_URL="http://localhost:3000"
FIELD_ENCRYPTION_KEY=a1b2c3d4e5f6...64hexcharshere
NODE_ENV="development"
```

---

## Step 4 — Set Up the Database Tables

The app needs to create its tables in the new database. Run this one command:

```bash
npx prisma migrate deploy --schema=packages/db/prisma/schema.prisma
```

If it prints `All migrations have been applied` (or similar), you are done with this step.

---

## Step 5 — Load the Demo Data (optional but recommended)

This fills the database with sample data so you can log in and try things out:

```bash
npx ts-node packages/db/prisma/seed.ts
```

---

## Step 6 — Start the App

```bash
npm run dev -w @osha/web
```

Open your browser and go to `http://localhost:3000`.
Log in with:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@acme-industrial.example | admin1234 |
| Recordkeeper | safety@acme-industrial.example | safety1234 |
| Executive | vp.ops@acme-industrial.example | vp1234 |

If the login page loads and you can sign in — it is working!

---

## Something Went Wrong?

| What you see | What to do |
|---|---|
| `Can't reach database server` | Check the connection string in `.env` — a typo in the password or host is the most common cause. |
| `The table ... does not exist` | You skipped Step 4. Run the migrate command. |
| `Invalid environment variables` | One of the required `.env` values is still the placeholder text. Fill them all in. |
| `NEXTAUTH_SECRET` error | Make sure `NEXTAUTH_SECRET` is set and is at least 32 characters long. |

---

That is it. Four things to remember:
1. Get a database and copy its URL.
2. Put the URL in `.env`.
3. Run the migrate command once.
4. Start the app.
