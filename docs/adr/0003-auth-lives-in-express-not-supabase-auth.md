# Authentication lives in Express, not Supabase Auth

Students register and sign in through our own Express endpoints: passwords are stored as bcrypt hashes in our own table and Express issues its own JWTs. We chose this over Supabase Auth, even though the database is on Supabase, because Supabase's built-in email only reaches the project's team members, our schema would depend on Supabase's `auth` schema, and auth couldn't be tested against PGlite. The cost is no email confirmation and no password reset.
