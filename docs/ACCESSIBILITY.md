# Accessibility

Accessibility is a release requirement, not polish. Use native semantics first. Every control has a
role, concise label, useful hint only when the result is unclear, state (disabled/selected/checked/
busy/expanded), and at least a 48dp target. Icon-only controls require labels. Reading/focus order
matches visual/task order; native headers announce route changes; modals trap then restore focus.

Allow font scaling and content reflow without fixed text heights. Test small phones at maximum
supported text size, landscape where supported, and keyboard avoidance. Normal text targets 4.5:1;
large text and UI boundaries 3:1. Pair status color with text/icon/shape. Announce form summary and
focus the first invalid field; announce asynchronous success/failure without stealing focus
unnecessarily. Respect reduced motion and provide equivalent static feedback.

Before a screen is complete, test iOS VoiceOver and Android TalkBack, dynamic/large text, switch or
keyboard navigation where applicable, reduced motion, light/dark contrast, error/loading/empty/
offline states, and permission denial. Record accepted exceptions with owner and remediation date.
