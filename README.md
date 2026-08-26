# Recipe Planner Consumer

A SvelteKit app that consumes Stencil web components for recipe management backed by Supabase.

## Setup

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project.
2. Copy your **Project URL** and **Anon Public Key** from project settings.

### 2. Set Up Database Tables

Option A: Use the SQL migration file
- In Supabase dashboard, navigate to **SQL Editor**
- Create a new query and paste the contents of `supabase.sql`
- Run the query to create tables and RLS policies

Option B: Manually create tables (see schema below)

### 3. Configure Environment Variables

Copy `.env.example` to `.env` and fill in your Supabase credentials:

```bash
cp .env.example .env
```

Edit `.env`:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Install Dependencies & Run

```bash
npm install
npm run dev
```

The app will start at `http://localhost:5173`

## Features

- ✅ Fetch recipes from Supabase
- ✅ Create, update, and delete recipes
- ✅ Add recipes to favorites (persisted per user)
- ✅ Create and save weekly meal plans
- ✅ Web components UI built with Stencil

## Database Schema

### recipes
- `id` (uuid, primary key)
- `title` (text, required)
- `summary` (text)
- `image` (text)
- `description` (text)
- `ingredients` (text array)
- `steps` (text array)
- `created_by` (text)
- `created_at` (timestamptz)

### favorites
- `id` (uuid, primary key)
- `user_id` (text)
- `recipe_id` (uuid, foreign key to recipes)

### meal_plans
- `user_id` (text, primary key)
- `plan` (jsonb)

## Troubleshooting

### "500 error on page load"

Check the browser console for error messages. Common issues:

1. **Missing Supabase tables** - Run the SQL migration in `supabase.sql`
2. **Wrong environment variables** - Ensure `.env` has correct `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
3. **RLS policies blocking** - The provided SQL allows anon key for development; adjust policies for production security

### "Tables don't exist"

Run this SQL in Supabase SQL Editor:

```sql
-- Run contents of supabase.sql here
```

## Notes

- This demo uses a simple `localStorage` key (`rp_user`) for user identification. Replace with Supabase Auth for production.
- RLS policies in the provided SQL are permissive for development. Implement stricter policies for production.
- The anon key should be restricted in production to only allow authenticated users.

