const SUPABASE_URL = "https://ptuuzdfjvrjmhztraewq.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_tUzQMC_WxknaajS80Tvfkg_O2HsrBG-";
const now = new Date();
const currentHour = now.getHours();
let dynamicGreeting = "Hello";
if (currentHour >= 5 && currentHour < 12) {
  dynamicGreeting = "Good Morning";
} else if (currentHour >= 12 && currentHour < 17) {
  dynamicGreeting = "Good Afternoon";
} else if (currentHour >= 17 && currentHour < 21) {
  dynamicGreeting = "Good Evening";
} else {
  dynamicGreeting = "Good Night";
}

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

(async () => {
  const greetingEl = document.getElementById("greeting");

  const { data: { session } } = await supabaseClient.auth.getSession();
  if (!session) {
    if (greetingEl) greetingEl.textContent = `${dynamicGreeting}!`;
    return;
  }

  const username = session.user.user_metadata?.username || "there";
  if (greetingEl) greetingEl.textContent = `${dynamicGreeting}, ${username}!`;
  await loadFriendsOnline(session.user.id);
})();

async function loadFriendsOnline(myId) {
  const countEl = document.getElementById("numboffriendsonline");
  if (!countEl) return;

  const { data: friendships, error } = await supabaseClient
    .from("friendships")
    .select(`
        id,
        requester_id,
        addressee_id,
        requester:profiles!friendships_requester_id_fkey ( username, user_number, last_seen ),
        addressee:profiles!friendships_addressee_id_fkey ( username, user_number, last_seen )
    `)
    .eq("status", "accepted")
    .or(`requester_id.eq.${myId},addressee_id.eq.${myId}`);

  if (error) {
    console.error("Failed to load friends online count:", error.message);
    return;
  }

  let onlineCount = 0;

  (friendships || []).forEach((f) => {
    const friend = f.requester_id === myId ? f.addressee : f.requester;
    if (!friend.last_seen) return;

    const secondsSinceSeen = (Date.now() - new Date(friend.last_seen).getTime()) / 1000;
    if (secondsSinceSeen < 60) onlineCount++;
  });

  const label = onlineCount === 1 ? "Friend" : "Friends";
  countEl.textContent = `${onlineCount} ${label} Online`;
}
