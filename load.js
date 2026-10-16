// Needed here (independent of isloggedin.js) so the profile link works
// correctly even on pages, like profile.html, that don't force a
// logged-out redirect
// Renamed to avoid colliding with the SUPABASE_URL/KEY declared in
// isloggedin.js — both load as plain scripts sharing one global scope
const LOAD_JS_SUPABASE_URL = "https://ptuuzdfjvrjmhztraewq.supabase.co";
const LOAD_JS_SUPABASE_ANON_KEY = "sb_publishable_tUzQMC_WxknaajS80Tvfkg_O2HsrBG-";
const loadJsSupabase = supabase.createClient(LOAD_JS_SUPABASE_URL, LOAD_JS_SUPABASE_ANON_KEY);

async function loadComponent(id, file) {
    const response = await fetch(file);
    const html = await response.text();
    document.getElementById(id).innerHTML = html;
}

// Absolute paths (leading /) so these still resolve correctly from
// pages served at nested URLs like /users/2, not just from the root
loadComponent("navbar", "/navbar.html").then(async () => {
    const blockbucksEl = document.getElementById("blockbucks-amount");
    if (!blockbucksEl) return;

    const { data: { session } } = await loadJsSupabase.auth.getSession();
    if (!session) return; // stays at 0 while logged out

    const { data: profile } = await loadJsSupabase
        .from("profiles")
        .select("blockbucks")
        .eq("id", session.user.id)
        .single();

    if (profile) {
        blockbucksEl.textContent = profile.blockbucks;
    }
});

loadComponent("sidebar", "/sidebar.html").then(async () => {
    const profileLink = document.getElementById("profile-link");
    if (!profileLink) return;

    const { data: { session } } = await loadJsSupabase.auth.getSession();
    if (!session) return; // stays pointed at signup.html

    const { data: profile } = await loadJsSupabase
        .from("profiles")
        .select("user_number")
        .eq("id", session.user.id)
        .single();

    if (profile?.user_number) {
        profileLink.href = `/users/${profile.user_number}`;
    }
});

// Online status heartbeat: while a logged-in user has the site open,
// touch last_seen every 30s. profile.js treats anything within the
// last minute as "Online".
(async () => {
    const { data: { session } } = await loadJsSupabase.auth.getSession();
    if (!session) return;

    const pingLastSeen = () => {
        loadJsSupabase
            .from("profiles")
            .update({ last_seen: new Date().toISOString() })
            .eq("id", session.user.id)
            .then(() => {});
    };

    pingLastSeen();
    setInterval(pingLastSeen, 30000);
})();

loadComponent("footer", "/footer.html");