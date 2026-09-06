import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

import type { OrganiserPoolView } from '@/api/endpoints/akawo-pools';
import { longDate } from '@/utils/dates';
import { formatMinorAmount } from '@/utils/money';
import { statusLabel } from '@/utils/status';

/** Escapes values before they reach the HTML the PDF is rendered from. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatDate(value: string | null): string {
  const label = longDate(value);
  // An em dash rather than "No date": this is a table cell in a printed record,
  // where a blank-looking mark reads better than a sentence.
  return label === 'No date' ? '—' : label;
}

/**
 * Builds the organiser's record as HTML for printing. The backend returns rows
 * rather than a document deliberately (ADR-007), so the layout lives here where
 * it can change without a deployment.
 */
export function buildPoolRecordHtml(pool: OrganiserPoolView): string {
  const rows = pool.members
    .map(
      (member, index) => `
        <tr>
          <td>${index + 1}</td>
          <td>${escapeHtml(member.fullName)}</td>
          <td>${escapeHtml(member.reference)}</td>
          <td>${member.due ? escapeHtml(statusLabel(member.due.status)) : '—'}</td>
          <td>${member.due?.paidAt ? formatDate(member.due.paidAt) : '—'}</td>
        </tr>`,
    )
    .join('');

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <style>
      body { font-family: -apple-system, Roboto, sans-serif; color: #212B36; padding: 24px; }
      h1 { color: #0D47A1; font-size: 20px; margin: 0 0 4px; }
      .meta { color: #637280; font-size: 12px; margin: 0 0 16px; }
      .totals { background: #E3F6FA; border-radius: 8px; padding: 12px; margin-bottom: 16px; }
      table { border-collapse: collapse; width: 100%; font-size: 12px; }
      th { background: #0D47A1; color: #fff; text-align: left; padding: 8px; }
      td { border-bottom: 1px solid #E3E8EF; padding: 8px; }
      tr:nth-child(even) td { background: #F7F9FC; }
    </style>
  </head>
  <body>
    <h1>${escapeHtml(pool.name)}</h1>
    <p class="meta">
      ${pool.purpose ? `${escapeHtml(pool.purpose)} &middot; ` : ''}
      ${escapeHtml(statusLabel(pool.status))} &middot; generated ${formatDate(new Date().toISOString())}
    </p>
    <div class="totals">
      <strong>${formatMinorAmount(pool.collectedMinor, pool.currency)}</strong>
      collected of ${formatMinorAmount(pool.expectedMinor, pool.currency)} expected
      &middot; ${pool.paidCount} of ${pool.memberCount} paid
    </div>
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Name</th>
          <th>${escapeHtml(pool.referenceLabel)}</th>
          <th>Status</th>
          <th>Paid on</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  </body>
</html>`;
}

/**
 * Renders the record to a PDF and hands it to the share sheet. Falls back to the
 * system print dialog where sharing is unavailable, so the action never silently
 * does nothing.
 */
export async function exportPoolRecord(pool: OrganiserPoolView): Promise<void> {
  const html = buildPoolRecordHtml(pool);
  const { uri } = await Print.printToFileAsync({ html });

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: `${pool.name} record`,
      UTI: 'com.adobe.pdf',
    });
    return;
  }
  await Print.printAsync({ uri });
}
