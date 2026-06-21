/**
 * Faithful reproduction of the input-purpose escape (WCAG 1.3.5): a personal-data field
 * with no autocomplete token, so it offers no autofill and no programmatic purpose.
 * Grounded in cal.com's autocomplete cluster — "add autocomplete for inputs — name, phone,
 * location" (#24422), "add autocomplete to login and signup" (#21065), "Disable
 * autocomplete on password field" (#6705), "Enable Autocomplete" (#2645).
 *
 * A signup form: name, email, phone, password — plus a search box that is NOT personal
 * data. GOOD declares autocomplete on every personal field AND leaves the search box alone
 * (proving the criterion never false-alarms on an opaque field). Each mutant strips the
 * autocomplete off exactly one personal field:
 *   good           : name/email/phone/password all declare autocomplete; search ignored
 *   email-missing  : the email input has no autocomplete
 *   password-missing: the password input has no autocomplete
 *   phone-missing  : the tel input has no autocomplete
 *   name-missing   : the given-name input has no autocomplete
 */
export type SignupVariant = 'good' | 'email-missing' | 'password-missing' | 'phone-missing' | 'name-missing';

function SignupForm({ variant }: { variant: SignupVariant }) {
  return (
    <form>
      <input name="firstName" type="text" placeholder="First name" autoComplete={variant === 'name-missing' ? undefined : 'given-name'} />
      <input name="email" type="email" placeholder="Email" autoComplete={variant === 'email-missing' ? undefined : 'email'} />
      <input name="phone" type="tel" placeholder="Phone" autoComplete={variant === 'phone-missing' ? undefined : 'tel'} />
      <input name="password" type="password" placeholder="Password" autoComplete={variant === 'password-missing' ? undefined : 'current-password'} />
      {/* a non-personal field — must NEVER be flagged even with no autocomplete */}
      <input name="query" type="search" placeholder="Search events" />
    </form>
  );
}

export const buildSignupForm = (variant: SignupVariant) => () => <SignupForm variant={variant} />;
