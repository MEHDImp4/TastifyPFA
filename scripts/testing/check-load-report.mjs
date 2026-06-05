import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const artifactsDir = path.resolve(process.argv[2] ?? 'artifacts/load-tests');
const statsPath = path.join(artifactsDir, 'locust_stats.csv');

if (!fs.existsSync(statsPath)) {
  console.error(`Locust stats file not found at ${statsPath}`);
  process.exit(1);
}

const parseNumber = (value) => {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : 0;
};

const lines = fs
  .readFileSync(statsPath, 'utf8')
  .split(/\r?\n/)
  .filter(Boolean);

const [headerLine, ...rowLines] = lines;
const headers = headerLine.split(',');
const rows = rowLines.map((line) => {
  const columns = line.split(',');
  return Object.fromEntries(headers.map((header, index) => [header, columns[index] ?? '']));
});

const aggregatedRow =
  rows.find((row) => String(row.Name).trim() === 'Aggregated') ??
  rows.find((row) => String(row.Type).trim() === 'Aggregated');

if (!aggregatedRow) {
  console.error('Locust aggregated row was not found in locust_stats.csv');
  process.exit(1);
}

const thresholds = {
  p95: parseNumber(process.env.LOAD_MAX_P95_MS ?? '1500'),
  avg: parseNumber(process.env.LOAD_MAX_AVG_MS ?? '800'),
  failRatio: parseNumber(process.env.LOAD_MAX_FAIL_RATIO ?? '0.02'),
  minRequests: parseNumber(process.env.LOAD_MIN_REQUESTS ?? '40'),
};

const metrics = {
  requestCount: parseNumber(aggregatedRow['Request Count']),
  failureCount: parseNumber(aggregatedRow['Failure Count']),
  avgResponseTime: parseNumber(aggregatedRow['Average Response Time']),
  p95ResponseTime: parseNumber(aggregatedRow['95%']),
  requestsPerSecond: parseNumber(aggregatedRow['Requests/s']),
};

const failRatio = metrics.requestCount > 0 ? metrics.failureCount / metrics.requestCount : 1;

console.log('Load test summary:');
console.log(
  JSON.stringify(
    {
      thresholds,
      metrics: {
        ...metrics,
        failRatio,
      },
    },
    null,
    2,
  ),
);

const failures = [];

if (metrics.requestCount < thresholds.minRequests) {
  failures.push(`request volume ${metrics.requestCount} is below minimum ${thresholds.minRequests}`);
}

if (metrics.avgResponseTime > thresholds.avg) {
  failures.push(`average response time ${metrics.avgResponseTime}ms exceeded ${thresholds.avg}ms`);
}

if (metrics.p95ResponseTime > thresholds.p95) {
  failures.push(`p95 response time ${metrics.p95ResponseTime}ms exceeded ${thresholds.p95}ms`);
}

if (failRatio > thresholds.failRatio) {
  failures.push(`failure ratio ${failRatio.toFixed(4)} exceeded ${thresholds.failRatio}`);
}

if (failures.length > 0) {
  console.error('Load thresholds failed:');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log('Load thresholds passed.');
