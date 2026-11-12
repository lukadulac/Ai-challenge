# Express is the only Supabase client

The mobile app never talks to Supabase directly: every read and write goes through the Express API, which holds the Supabase credentials server-side. We chose this over calling `supabase-js` from the app so that business rules and authorization live in one place and we don't have to write and maintain Row Level Security policies.
