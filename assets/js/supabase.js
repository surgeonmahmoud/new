const SUPABASE_URL = "https://elfbznxexpwmdhouspkk.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVsZmJ6bnhleHB3bWRob3VzcGtrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE0NzU0NjgsImV4cCI6MjA5NzA1MTQ2OH0.THIfFu6qZJJPVzSf_trPQpg7BcQTPQ2OfB_m851oLFI";

if (!window.supabaseClient) {
    window.supabaseClient = supabase.createClient(
        SUPABASE_URL,
        SUPABASE_ANON_KEY
    );
}