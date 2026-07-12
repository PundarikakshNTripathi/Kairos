# Kairos Infrastructure & Scaling Guide

This guide details exactly how to transition Kairos from a local-only IndexedDB architecture to a robust, zero-cost, high-privacy backend using **Supabase** (PostgreSQL + Auth).

## Why Supabase?
Supabase is an open-source Firebase alternative. It provides:
- **Zero Cost**: The free tier generously covers up to 50,000 MAU and 500MB of database storage (plenty for text journaling).
- **High Privacy**: Built on PostgreSQL, you can enforce **Row Level Security (RLS)** so that users can *only* query their own data directly at the database level.
- **High Performance**: Direct connection pooling and global edge functions.

---

## Step-by-Step Implementation Guide

### 1. Provision the Database
1. Go to [Supabase](https://supabase.com/) and create a free account.
2. Create a new Project (name it `kairos-backend`).
3. Once the database is provisioned, go to the **SQL Editor** and run this schema:

```sql
-- Create a table for User Profiles
create table public.profiles (
  id uuid references auth.users not null primary key,
  is_public boolean default false,
  birthdate date,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create a table for Daily Logs (Journal & Priorities)
create table public.daily_logs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  log_date date not null,
  journal_text text,
  priorities jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, log_date)
);
```

### 2. Lock Down Privacy with Row Level Security (RLS)
Security is paramount. By enabling RLS, we ensure hackers cannot scrape the database. Run this in the SQL Editor:

```sql
-- Enable RLS
alter table public.profiles enable row level security;
alter table public.daily_logs enable row level security;

-- Only users can see/edit their OWN profiles, UNLESS is_public is true
create policy "Public profiles are viewable by everyone" on profiles for select using ( is_public = true );
create policy "Users can insert their own profile" on profiles for insert with check ( auth.uid() = id );
create policy "Users can update own profile" on profiles for update using ( auth.uid() = id );

-- Logs are strictly private
create policy "Users can view own logs" on daily_logs for select using ( auth.uid() = user_id );
create policy "Users can insert own logs" on daily_logs for insert with check ( auth.uid() = user_id );
create policy "Users can update own logs" on daily_logs for update using ( auth.uid() = user_id );
```

### 3. Integrate into the Frontend (Kairos)
1. Install the Supabase client:
   ```bash
   npm install @supabase/supabase-js
   ```
2. Create `src/lib/supabase.ts`:
   ```typescript
   import { createClient } from '@supabase/supabase-js'
   
   const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
   const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
   
   export const supabase = createClient(supabaseUrl, supabaseAnonKey)
   ```
3. **Authentication**: Use GitHub OAuth for seamless login.
   ```typescript
   async function signInWithGitHub() {
     const { data, error } = await supabase.auth.signInWithOAuth({
       provider: 'github',
     })
   }
   ```

### 4. Configuring Authentication (Supabase Dashboard)
Kairos uses **Email Magic Links** and **GitHub OAuth** for seamless login. You must configure these in your Supabase Dashboard:

#### A. Enable Email Magic Links
1. Go to **Authentication** > **Providers** > **Email**.
2. Ensure "Enable Email provider" is turned on.
3. This allows users to login without a password by receiving a secure verification link in their email.

#### B. Setup GitHub OAuth
1. Go to your **Supabase Dashboard** > **Authentication** > **Providers** > **GitHub**.
2. Copy the **Callback URL (for OAuth)** (e.g., `https://<ref>.supabase.co/auth/v1/callback`).
3. Log into GitHub, go to **Settings** > **Developer settings** > **OAuth Apps** > **New OAuth App**.
4. Fill in:
   - Application name: `Kairos Journal`
   - Homepage URL: Your Vercel domain (e.g., `https://kairos.vercel.app`)
   - Authorization callback URL: Paste the URL from Supabase.
5. Click **Register application**.
6. Copy the **Client ID** and generate a **Client Secret**.
7. Paste both back into the Supabase GitHub Provider settings and hit **Save**.

### 5. Shareable Profiles & Progress
Since we added an `is_public` boolean to the `profiles` table:
- Users can toggle a switch in their settings.
- If true, their profile URL (e.g., `kairos.app/u/username`) will expose their `birthdate` to render a public "Life Grid", but the `daily_logs` remain completely locked behind the RLS policy!

### 5. Security & Vulnerability Auditing
To ensure the JavaScript ecosystem does not introduce vulnerabilities:
1. **NPM Audit**: We have configured `.npmrc` to strictly log audits. Run `npm audit fix` periodically.
2. **DOMPurify**: We have implemented `DOMPurify` to sanitize all Markdown/HTML injected into the journal's new tab view to prevent Cross-Site Scripting (XSS).
3. **Content-Security-Policy**: We have added a strict CSP meta tag in `index.html` to block unauthorized external scripts from executing.

---

## Infrastructure: Supabase vs. Render
If we are using Supabase as our Backend-as-a-Service (BaaS), **we do not need Render**. 
Supabase handles the Database (PostgreSQL) and the API layer (PostgREST), while GitHub Pages handles hosting the static Vite bundle (the frontend). Render is typically used if you are spinning up a custom Node.js/Express server. Since we are serverless, Render is entirely obsolete for this architecture, achieving zero-cost scaling.

---

## Security Features

To ensure you can develop on this project safely from any device without worrying about dependency vulnerabilities or malicious scripts, several strict security measures have been configured:

1. **Husky Pre-commit Hooks (`.husky/pre-commit`)**: 
   - Every time you attempt to run `git commit`, Husky intercepts it and runs `npm audit --audit-level=high`.
   - If any high-severity vulnerabilities are found in your installed packages, the commit will be blocked, protecting you from pushing vulnerable code.
   - *Note: Because `.husky/` is tracked in Git, this protection works on any device you clone the repo to.*

2. **Strict NPM Configuration (`.npmrc`)**:
   - `audit=true`: Forces NPM to automatically audit packages every time you install something.
   - `strict-peer-deps=true`: Prevents NPM from installing incompatible or conflicting package versions.
   - `save-exact=true`: Forces NPM to save exact version numbers in `package.json` (e.g., `1.2.3` instead of `^1.2.3`). This prevents unexpected malware from sneaking in via automatic minor/patch updates.

3. **Automated Dependabot (`.github/dependabot.yml`)**:
   - GitHub will automatically scan your `package.json` and GitHub Actions weekly.
   - If a security patch is released for any of your dependencies, GitHub will automatically create a Pull Request to update it safely.
