/**
 * Faithful reproduction of the render-resilience escape (`survives-malformed-data`):
 * a surface fed the data it can actually receive — a null user, a missing array, a
 * non-string field, an absent nested object — must degrade, not white-screen. Mined
 * from cal.com "a.trim is not a function" (000324c0), "handle empty location"
 * (013e6143); documenso "prevent crash when removing last dropdown option"
 * (43fe5584), "handle empty object as fieldMeta" (0ef85b47).
 *
 * Every variant is fed the SAME degenerate payload; `good` guards every access and
 * shows a fallback, each mutant omits one guard and crashes on its field.
 *
 * Variants:
 *   good           : guards user / items / title / meta → fallback, no crash
 *   null-user      : reads data.user.name when user is null
 *   undef-items    : maps data.items when items is undefined
 *   nonstring-title: calls data.title.trim() when title is a number
 *   missing-meta   : reads data.meta.tags when meta is undefined
 */
export type ResilienceVariant = 'good' | 'null-user' | 'undef-items' | 'nonstring-title' | 'missing-meta';

interface CardData {
  user: { name: string } | null;
  items?: string[];
  title: unknown;
  meta?: { tags: string[] };
}

// The data the surface can actually receive — not the happy fixture.
const EDGE: CardData = { user: null, items: undefined, title: 42, meta: undefined };

function ProfileCard({ variant }: { variant: ResilienceVariant }) {
  const data = EDGE;
  switch (variant) {
    case 'good':
      return (
        <div>
          {data.user ? <h1>{data.user.name}</h1> : <p>No profile data</p>}
          <ul>{(data.items ?? []).map((it, i) => <li key={i}>{it}</li>)}</ul>
          <p>{typeof data.title === 'string' ? data.title.trim() : ''}</p>
          <p>{(data.meta?.tags ?? []).join(', ')}</p>
        </div>
      );
    case 'null-user':
      return <div><p>No profile data</p><h1>{(data.user as { name: string }).name}</h1></div>;
    case 'undef-items':
      return <div><p>No profile data</p><ul>{(data.items as string[]).map((it, i) => <li key={i}>{it}</li>)}</ul></div>;
    case 'nonstring-title':
      return <div><p>No profile data</p><p>{(data.title as string).trim()}</p></div>;
    case 'missing-meta':
      return <div><p>No profile data</p><p>{(data.meta as { tags: string[] }).tags.join(', ')}</p></div>;
  }
}

export const buildProfileCard = (variant: ResilienceVariant) => () => <ProfileCard variant={variant} />;
