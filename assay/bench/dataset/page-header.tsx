/**
 * Faithful reproduction of the composition-canonical escape: a screen header whose
 * slots are a hand-rolled fork, missing, or out of order. Grounded in "consolidate
 * hand-rolled tab bars into one <TabBar>" (897c6aa0), "…confirm dialogs into one
 * <ConfirmDialog>" (2c9376e7), "identidade dos títulos — ícone da tela no page header"
 * (c596531b). The canonical header is back · icon · title, each a DS component
 * (carrying its `data-ds` marker).
 *
 * Variants:
 *   good        : <IconButton back> <ScreenIcon> <Heading title> in order
 *   wrong-order : title rendered before the back affordance
 *   missing-icon: the screen icon slot is absent
 *   bespoke-back: the back is a hand-rolled <button> (no data-ds) — a fork
 *   missing-back: no back affordance at all
 */
export type HeaderVariant = 'good' | 'wrong-order' | 'missing-icon' | 'bespoke-back' | 'missing-back';

const Back = () => (
  <button data-ds="IconButton" data-slot="back" aria-label="Voltar">
    ←
  </button>
);
const BespokeBack = () => (
  <button data-slot="back" aria-label="Voltar">
    ←
  </button>
);
const Icon = () => <span data-ds="ScreenIcon" data-slot="icon" aria-hidden />;
const Title = () => (
  <h1 data-ds="Heading" data-slot="title">
    Dashboard
  </h1>
);

function Header({ variant }: { variant: HeaderVariant }) {
  switch (variant) {
    case 'wrong-order':
      return (
        <header>
          <Title />
          <Back />
          <Icon />
        </header>
      );
    case 'missing-icon':
      return (
        <header>
          <Back />
          <Title />
        </header>
      );
    case 'bespoke-back':
      return (
        <header>
          <BespokeBack />
          <Icon />
          <Title />
        </header>
      );
    case 'missing-back':
      return (
        <header>
          <Icon />
          <Title />
        </header>
      );
    case 'good':
      return (
        <header>
          <Back />
          <Icon />
          <Title />
        </header>
      );
  }
}

export const COMPOSITION = [
  { slot: 'back', component: 'IconButton' },
  { slot: 'icon', component: 'ScreenIcon' },
  { slot: 'title', component: 'Heading' },
] as const;

export const buildHeader = (variant: HeaderVariant) => () => <Header variant={variant} />;
