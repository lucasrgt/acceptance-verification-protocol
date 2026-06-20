/**
 * Faithful reproductions of two persona-scoped-visibility escapes from TWO
 * independent projects — the transfer evidence in code:
 *
 *  - PERSONA (marketplace, commit 16c6cd43): a role-fixed build still rendered the
 *    "switch to the other persona" control. BAD shows it regardless; GOOD hides it
 *    when the build is persona-fixed.
 *
 *  - TIER (SaaS, commit projf:5512811 / eb5a438): a Free-tier surface rendered
 *    a Pro-only data section. BAD shows the Pro section to Free; GOOD shows an
 *    upgrade teaser instead.
 *
 * The SAME criterion (no-cross-persona-affordance) must catch both.
 */

// --- PERSONA (marketplace) ---
function Settings({ buildPersona, variant }: { buildPersona: 'traveler' | null; variant: 'good' | 'bad' }) {
  // A role-fixed build pins a persona; the unfixed superapp leaves it null.
  const roleSwitchAvailable = variant === 'bad' ? true : buildPersona === null;
  return (
    <div>
      <h1>Settings</h1>
      <button type="button">Account</button>
      {roleSwitchAvailable && <button type="button">Switch to host</button>}
    </div>
  );
}
export const GoodSettings = () => <Settings buildPersona="traveler" variant="good" />;
export const BadSettings = () => <Settings buildPersona="traveler" variant="bad" />;

// --- TIER (SaaS) ---
function Dashboard({ tier, variant }: { tier: 'free' | 'pro'; variant: 'good' | 'bad' }) {
  // The Pro-only market-value section must not render for a Free tier.
  const showMarketValue = variant === 'bad' ? true : tier === 'pro';
  return (
    <div>
      <section aria-label="overview">
        <p>12 partners</p>
      </section>
      {showMarketValue ? (
        <section aria-label="market value">
          <p>R$ 1.2M</p>
        </section>
      ) : (
        <div role="note">Unlock market value with Pro</div>
      )}
    </div>
  );
}
export const GoodDashboardFree = () => <Dashboard tier="free" variant="good" />;
export const BadDashboardFree = () => <Dashboard tier="free" variant="bad" />;
