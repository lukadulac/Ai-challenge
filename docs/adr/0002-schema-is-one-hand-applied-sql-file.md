# The database schema is one hand-applied SQL file

All tables, indexes and constraints live in a single `schema.sql` that is pasted into the Supabase SQL editor by hand, instead of being managed by a migration tool. This keeps database setup to one copy-paste for a small project; the trade-off is that there is no migration history, so later schema changes have to be applied manually. Tests load the same file into PGlite, so the schema in Supabase and the schema under test always come from the same file.
