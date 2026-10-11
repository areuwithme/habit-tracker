# Habit Tracker - learning project

This is a separate project from the earlier HTML/CSS/JavaScript sample. It is a React single-page app with Supabase email/password authentication, a PostgreSQL database, and row-level security (RLS) so signed-in users only see and change their own habits.

## Features in this starter

- Create an account and sign in with email and password
- Create habits and assign a category
- Mark or unmark a habit for today
- See today's completion count and a seven-day activity chart
- Delete a habit
- Sign out
- Store habits and completion history in Supabase


## 1. Install and start the app

Install Node.js LTS and Git. Then open a terminal in this folder and run:

```bash
npm install
```

Create a Supabase project at https://supabase.com/. In the project settings, copy the Project URL and the publishable key. Create a file named `.env.local` beside `package.json`:

```env
VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR-PUBLISHABLE-KEY
```

Do not put a Supabase secret key or service-role key in this file. The publishable key is designed to be present in a browser app; database RLS policies protect the rows.

## 2. Create the database tables and policies

In Supabase, open **SQL Editor**, create a new query, paste all of `supabase/schema.sql`, and run it. The SQL creates `habits` and `habit_logs`, enables RLS, and adds owner-only policies.

## 3. Configure email sign-in

In Supabase Authentication settings, set the Site URL to `http://localhost:5173` while developing. Add `http://localhost:5173/**` to the allowed redirect URLs. Sign-up may require an email confirmation; follow the confirmation link before signing in.

## 4. Run locally

```bash
npm run dev
```

Open the local address shown in the terminal, usually `http://localhost:5173`. Create an account, confirm it if prompted, sign in, and add a habit.

## 5. Put this new project on GitHub

Create a new, empty GitHub repository named `habit-tracker`. In this project folder, run:

```bash
git init
git add .
git commit -m "Build habit tracker starter"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/habit-tracker.git
git push -u origin main
```

Replace `YOUR-USERNAME` with your GitHub username. Keep `.env.local` out of Git. The included `.gitignore` already excludes it.

## 6. Deploy the app with Vercel

1. Sign in to Vercel and import the new `habit-tracker` GitHub repository.
2. Keep the detected Vite settings. The build command is `npm run build` and the output directory is `dist`.
3. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` under the Vercel project's environment variables.
4. Deploy and open the generated URL.
5. In Supabase Authentication URL settings, change the Site URL to your deployed Vercel URL and add that URL to the allowed redirect list. Keep the local URL there too for development.

Each push to the connected GitHub repository can trigger a new deployment. See [Vercel's Git deployment guide](https://vercel.com/docs/git).

## 7. Check user data separation

Create two test accounts. Add a different habit in each. Sign out and sign in as the other account. Each account should see only its own habits and completion history. This behavior is enforced by the RLS policies in `supabase/schema.sql`, not by hiding records in React.

## Project map

```text
habit-tracker-starter/
|-- index.html
|-- package.json
|-- vite.config.js
|-- src/
|   |-- App.jsx
|   |-- main.jsx
|   |-- index.css
|   `-- supabaseClient.js
`-- supabase/
    `-- schema.sql
```

## Suggested learning order

1. Read `src/App.jsx` and identify the React components, state, and event handlers.
2. Change the colors and spacing in `src/index.css`.
3. Trace how `supabase.auth` signs users in and how `loadDashboard` queries the tables.
4. Read the SQL policies, then test with two accounts.
5. Add one feature at a time: editing a habit, password reset, streak calculation, a monthly calendar, or OAuth.

## Security notes

- Never commit `.env.local`.
- Never expose a Supabase secret or service-role key in a frontend app.
- Keep RLS enabled for every table exposed through the Supabase Data API.
- The browser is an untrusted client. The SQL policies are the data access boundary.

## Official references

- [Supabase React quickstart](https://supabase.com/docs/guides/auth/quickstarts/react)
- [Supabase React user-management tutorial](https://supabase.com/docs/guides/getting-started/tutorials/with-react)
- [Supabase row-level security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Vercel Git deployments](https://vercel.com/docs/git)
