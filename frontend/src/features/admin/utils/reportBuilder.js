export const REPORT_TYPES = {
  users: {
    label: 'Users',
    columns: [
      { label: 'Created', getValue: (item) => item.createdAt },
      { label: 'Role', getValue: (item) => item.role || 'Unknown' },
      { label: 'Status', getValue: (item) => item.status || 'active' },
    ],
  },
  reports: {
    label: 'Moderation reports',
    columns: [
      { label: 'Submitted', getValue: (item) => item.createdAt },
      { label: 'Category', getValue: (item) => item.targetType || 'Other' },
      { label: 'Status', getValue: (item) => item.status || 'Unknown' },
    ],
  },
  activity: {
    label: 'Admin activity',
    columns: [
      { label: 'Date', getValue: (item) => item.timestamp || item.createdAt },
      { label: 'Action', getValue: (item) => item.action || 'Unknown' },
      { label: 'Target type', getValue: (item) => item.targetType || 'Other' },
    ],
  },
};

export const REPORT_PERIODS = [
  { value: 'all', label: 'All time' },
  { value: '7', label: '7 days' },
  { value: '30', label: '30 days' },
  { value: '90', label: '90 days' },
];

const getRecordDate = (item, reportType) => {
  const dateValue =
    reportType === 'activity'
      ? item.timestamp || item.createdAt
      : item.createdAt;
  const date = dateValue ? new Date(dateValue) : null;
  return date && !Number.isNaN(date.getTime()) ? date : null;
};

export const getReportStatus = (item, reportType) =>
  item.status || (reportType === 'users' ? 'active' : 'Unknown');

export const filterReportRecords = (
  records,
  reportType,
  period,
  status,
  now = new Date()
) => {
  const startDate =
    period === 'all'
      ? null
      : new Date(now.getTime() - Number(period) * 24 * 60 * 60 * 1000);

  return records.filter((item) => {
    if (status !== 'all' && getReportStatus(item, reportType) !== status) {
      return false;
    }

    if (!startDate) {
      return true;
    }

    const date = getRecordDate(item, reportType);
    return date !== null && date >= startDate && date <= now;
  });
};

export const getReportStatuses = (records, reportType) =>
  [...new Set(records.map((item) => getReportStatus(item, reportType)))].sort();

export const buildCsvReport = ({
  reportType,
  periodLabel,
  statusLabel,
  records,
}) => {
  const config = REPORT_TYPES[reportType];
  const escapeCell = (value) => {
    const text = value == null ? '' : String(value);
    const safeText = /^[\s]*[=+\-@]/.test(text) ? `'${text}` : text;
    return `"${safeText.replace(/"/g, '""')}"`;
  };
  const lines = [
    [escapeCell('MindMatter report'), escapeCell(config.label)].join(','),
    [escapeCell('Period'), escapeCell(periodLabel)].join(','),
    [escapeCell('Status'), escapeCell(statusLabel)].join(','),
    '',
    config.columns.map((column) => escapeCell(column.label)).join(','),
    ...records.map((item) =>
      config.columns
        .map((column) => {
          const value = column.getValue(item);
          if (
            column.label === 'Created' ||
            column.label === 'Submitted' ||
            column.label === 'Date'
          ) {
            const date = value ? new Date(value) : null;
            return escapeCell(
              date && !Number.isNaN(date.getTime())
                ? date.toISOString().slice(0, 10)
                : ''
            );
          }
          return escapeCell(value);
        })
        .join(',')
    ),
  ];

  return lines.join('\r\n');
};

const toPdfText = (value) =>
  String(value)
    .normalize('NFKD')
    .replace(/[^\x20-\x7E]/g, '?')
    .replace(/([\\()])/g, '\\$1');

const wrapPdfLine = (line, maxLength = 84) => {
  const words = String(line).split(/\s+/);
  const wrapped = [];
  let current = '';

  words.forEach((word) => {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxLength && current) {
      wrapped.push(current);
      current = word;
    } else {
      current = next;
    }
  });

  if (current) wrapped.push(current);
  return wrapped;
};

export const buildPdfReport = ({
  reportLabel,
  periodLabel,
  statusLabel,
  records,
  reportType,
  generatedAt = new Date(),
}) => {
  const statusCounts = records.reduce((counts, item) => {
    const status = getReportStatus(item, reportType);
    counts[status] = (counts[status] || 0) + 1;
    return counts;
  }, {});
  const lines = [
    'MindMatter - Stakeholder Summary',
    `Report: ${reportLabel}`,
    `Period: ${periodLabel}`,
    `Status filter: ${statusLabel}`,
    `Generated: ${generatedAt.toISOString().slice(0, 16).replace('T', ' ')} UTC`,
    `Records included: ${records.length}`,
    '',
    'Breakdown by status',
    ...Object.entries(statusCounts).map(
      ([status, count]) => `${status}: ${count}`
    ),
  ].flatMap((line) => wrapPdfLine(line));
  const pages = [];
  for (let index = 0; index < lines.length; index += 48) {
    pages.push(lines.slice(index, index + 48));
  }
  if (pages.length === 0) pages.push(['No records match the selected filters.']);

  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    `<< /Type /Pages /Kids [${pages
      .map((_, index) => `${3 + index * 2} 0 R`)
      .join(' ')}] /Count ${pages.length} >>`,
  ];

  pages.forEach((pageLines, index) => {
    const pageObjectId = 3 + index * 2;
    const contentObjectId = pageObjectId + 1;
    const textCommands = pageLines
      .map(
        (line, lineIndex) =>
          `1 0 0 1 48 ${744 - lineIndex * 14} Tm (${toPdfText(line)}) Tj`
      )
      .join('\n');
    const stream = `BT\n/F1 11 Tf\n${textCommands}\nET`;
    objects.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 ${3 + pages.length * 2} 0 R >> >> /Contents ${contentObjectId} 0 R >>`,
      `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`
    );
  });
  objects.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');

  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, '0')} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return pdf;
};

export const toBase64 = (value) => {
  const binary = encodeURIComponent(value).replace(
    /%([0-9A-F]{2})/g,
    (_, hex) => String.fromCharCode(parseInt(hex, 16))
  );
  const alphabet =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let encoded = '';

  for (let index = 0; index < binary.length; index += 3) {
    const first = binary.charCodeAt(index);
    const hasSecond = index + 1 < binary.length;
    const hasThird = index + 2 < binary.length;
    const second = hasSecond ? binary.charCodeAt(index + 1) : 0;
    const third = hasThird ? binary.charCodeAt(index + 2) : 0;
    encoded += alphabet[first >> 2];
    encoded += alphabet[((first & 3) << 4) | (second >> 4)];
    encoded += hasSecond ? alphabet[((second & 15) << 2) | (third >> 6)] : '=';
    encoded += hasThird ? alphabet[third & 63] : '=';
  }

  return encoded;
};
