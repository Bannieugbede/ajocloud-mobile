import { environment } from '@/config/environment';

/**
 * Links members send to other people, on the website.
 *
 * A website link rather than the app's scheme, because it works for everyone:
 * with the app installed it opens the app, and without it the page describes
 * what was shared and lets them join on the web or get the app. Null when no
 * web address is configured, so a half-built link never goes into a message
 * that cannot be taken back.
 */
function webBase(): string | null {
  const base = environment.EXPO_PUBLIC_WEB_URL;
  return base ? base.replace(/\/+$/, '') : null;
}

/** `/akawo/join/<code>`, the website's page for an Akawo pool. */
export function poolLink(joinCode: string): string | null {
  const base = webBase();
  return base ? `${base}/akawo/join/${encodeURIComponent(joinCode)}` : null;
}

/** `/food/<id>`, the website's page for a Food Ajo programme. */
export function foodProgrammeLink(programmeId: string): string | null {
  const base = webBase();
  return base ? `${base}/food/${encodeURIComponent(programmeId)}` : null;
}

export function poolShareMessage(poolName: string, joinCode: string): string {
  const link = poolLink(joinCode);
  return [
    `Join "${poolName}" on Ajo Cloud.`,
    link ? link : '',
    `Or enter code ${joinCode} in the app.`,
  ]
    .filter((line) => line !== '')
    .join('\n');
}

export function foodShareMessage(programmeName: string, programmeId: string): string | null {
  const link = foodProgrammeLink(programmeId);
  return link ? `Save towards "${programmeName}" with me on Ajo Cloud.\n${link}` : null;
}
