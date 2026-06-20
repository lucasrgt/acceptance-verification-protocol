/**
 * Faithful reproduction of the layer-integrity escape: two in-flow regions that should
 * stack instead collide. Grounded in cal.com "onboarding Continue button overlaps Bio
 * textarea on small viewports" (44ccc72f), "textarea resize overlapping buttons"
 * (794046cf), "Upgradetip text overlapping" (0e900a73). Measured in a REAL browser via
 * getBoundingClientRect intersection.
 *
 * Two regions — a "bio" block and a "continue" block — that should sit one below the
 * other. GOOD stacks them; each mutant collides them by a different mechanism.
 *
 * Variants:
 *   good            : the two regions stack, no overlap
 *   absolute-overlap: the continue block is absolutely positioned over the bio
 *   negative-margin : a negative margin pulls the continue block up over the bio
 *   translate-overlap: a transform shifts the continue block up over the bio
 */
export type LayerVariant = 'good' | 'absolute-overlap' | 'negative-margin' | 'translate-overlap';

function continueStyle(variant: LayerVariant): React.CSSProperties {
  switch (variant) {
    case 'absolute-overlap':
      return { position: 'absolute', top: '20px', left: '10px', right: '10px' };
    case 'negative-margin':
      return { marginTop: '-60px' };
    case 'translate-overlap':
      return { transform: 'translateY(-60px)' };
    case 'good':
      return {};
  }
}

function Form({ variant }: { variant: LayerVariant }) {
  return (
    <div style={{ position: 'relative', padding: '10px' }}>
      <div data-region="bio" style={{ height: '80px', border: '1px solid #333', padding: '8px' }}>
        Bio
      </div>
      <div data-region="continue" style={{ height: '40px', border: '1px solid #333', padding: '8px', ...continueStyle(variant) }}>
        Continue
      </div>
    </div>
  );
}

export const buildOverlapForm = (variant: LayerVariant) => () => <Form variant={variant} />;
