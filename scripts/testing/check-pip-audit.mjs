import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const [reportPath, allowlistPath] = process.argv.slice(2);

if (!reportPath || !allowlistPath) {
  console.error('Usage: node scripts/testing/check-pip-audit.mjs <report.json> <allowlist.json>');
  process.exit(1);
}

const loadJson = (filePath) => JSON.parse(fs.readFileSync(path.resolve(filePath), 'utf8'));

const report = loadJson(reportPath);
const allowlist = loadJson(allowlistPath);
const allowlistKeys = new Map(
  allowlist.map((entry) => [`${entry.package.toLowerCase()}::${entry.id}`, entry.reason]),
);

const findings = [];

for (const dependency of report.dependencies ?? []) {
  for (const vuln of dependency.vulns ?? []) {
    const packageName = String(dependency.name).toLowerCase();
    const key = `${packageName}::${vuln.id}`;
    findings.push({
      packageName,
      packageVersion: dependency.version,
      id: vuln.id,
      fixVersions: vuln.fix_versions ?? [],
      description: vuln.description ?? '',
      allowed: allowlistKeys.has(key),
      reason: allowlistKeys.get(key),
    });
  }
}

if (findings.length === 0) {
  console.log('pip-audit: no known vulnerabilities found.');
  process.exit(0);
}

const actionableFindings = findings.filter((finding) => !finding.allowed);

console.log(`pip-audit findings: ${findings.length} total, ${actionableFindings.length} actionable after allowlist.`);

if (actionableFindings.length === 0) {
  console.log('All remaining vulnerabilities are explicitly allowlisted:');
  for (const finding of findings) {
    console.log(`- ${finding.packageName}@${finding.packageVersion} ${finding.id}: ${finding.reason}`);
  }
  process.exit(0);
}

console.error('Actionable Python vulnerabilities remain:');
for (const finding of actionableFindings) {
  const fixes = finding.fixVersions.length > 0 ? finding.fixVersions.join(', ') : 'no published fixed version';
  console.error(`- ${finding.packageName}@${finding.packageVersion} ${finding.id} (fix: ${fixes})`);
}

process.exit(1);
