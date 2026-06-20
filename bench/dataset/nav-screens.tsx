/**
 * Faithful reproductions of navigation-integrity escapes from TWO projects:
 *
 *  - WRONG TARGET (marketplace, commit 287ab352): the chat-inbox "Profile" tab
 *    navigated to /account/host — a route that doesn't exist. BAD targets the dead
 *    route; GOOD targets the registered /host/settings.
 *
 *  - ORPHANED ROUTE (SaaS, commit projp:7ba900d): the "Users" link targeted
 *    /settings/users, but that route was deleted/unregistered, so it 404'd. Here
 *    the COMPONENT is identical (same link) — what differs is whether the route is
 *    registered (modelled in the subject's route table).
 */

// --- WRONG TARGET (marketplace) ---
function ChatInbox({ navigate, variant }: { navigate: (p: string) => void; variant: 'good' | 'bad' }) {
  return (
    <div>
      <button type="button" onClick={() => navigate(variant === 'bad' ? '/account/host' : '/host/settings')}>
        Profile
      </button>
    </div>
  );
}
export const GoodInbox = (navigate: (p: string) => void) => <ChatInbox navigate={navigate} variant="good" />;
export const BadInbox = (navigate: (p: string) => void) => <ChatInbox navigate={navigate} variant="bad" />;

// --- ORPHANED ROUTE (SaaS) — identical component; the route table decides ---
export const UsersLink = (navigate: (p: string) => void) => (
  <div>
    <button type="button" onClick={() => navigate('/settings/users')}>
      Users
    </button>
  </div>
);
