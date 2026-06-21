/**
 * Faithful reproduction of the image-alt escape: an informative image that reaches the
 * accessibility tree with no text alternative. Grounded in cal.com "Add descriptive alt
 * text to images for accessibility" (fa20f19e), "fix alt text in /apps/typeform"
 * (55113f20), documenso "alt text" (df9c603a).
 *
 * A profile card: a logo, an avatar, a role="img" chart, and a purely decorative divider.
 * GOOD gives every informative image a text alternative AND marks the divider decorative
 * (alt="") — proving the criterion does not false-alarm on intentional decoration. Each
 * mutant strips the text alternative off exactly one informative image, a distinct way:
 *   good             : logo+avatar+chart named, divider alt="" (decorative, not flagged)
 *   logo-no-alt      : the logo <img> has no alt attribute at all
 *   avatar-no-alt    : the avatar <img> has no alt attribute at all
 *   chart-no-name    : the role="img" chart has no aria-label
 *   empty-aria-label : the logo has no alt and an EMPTY aria-label (present but nameless)
 */
export type ImagesVariant = 'good' | 'logo-no-alt' | 'avatar-no-alt' | 'chart-no-name' | 'empty-aria-label';

function ImagesPage({ variant }: { variant: ImagesVariant }) {
  return (
    <div>
      {/* informative logo — named by alt unless a mutant strips it */}
      <img
        src="/acme-logo.png"
        alt={variant === 'logo-no-alt' || variant === 'empty-aria-label' ? undefined : 'Acme logo'}
        aria-label={variant === 'empty-aria-label' ? '' : undefined}
      />

      {/* informative avatar — named by alt unless the avatar mutant strips it */}
      <img src="/jane.jpg" alt={variant === 'avatar-no-alt' ? undefined : 'Jane Doe'} />

      {/* a role="img" graphic — named by aria-label unless the chart mutant strips it */}
      <span role="img" aria-label={variant === 'chart-no-name' ? undefined : 'Revenue chart'}>
        📊
      </span>

      {/* deliberately decorative divider — alt="" must NEVER be flagged */}
      <img src="/divider.png" alt="" />
    </div>
  );
}

export const buildImagesPage = (variant: ImagesVariant) => () => <ImagesPage variant={variant} />;
