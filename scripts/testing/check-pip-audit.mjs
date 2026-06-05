#!/usr/bin/env node

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '..', '..');

const [auditPathArg, allowlistPathArg] = process.argv.slice(2);

if (!auditPathArg || !allowlistPathArg) {
  console.error('Usage: node scripts/testing/check-pip-audit.mjs <pip-audit.json> <allowlist.json>');
  process.exit(1);
}

const auditPath = path.resolve(repoRoot, auditPathArg);
const allowlistPath = path.resolve(repoRoot, allowlistPathArg);

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, 'utf8'));
}

function normalizeName(name) {
  return String(name ?? '').trim().toLowerCase();
}

function normalizeId(value) {
  return String(value ?? '').trim();
}

function parseAllowlist(rawAllowlist) {
  const entries = Array.isArray(rawAllowlist) ? rawAllowlist : rawAllowlist?.entries;

  if (!Array.isArray(entries)) {
    throw new Error('Allowlist must be an array or an object with an entries array.');
  }

  const allowlist = new Map();

  for (const entry of entries) {
    if (!entry || typeof entry !== 'object') {
      continue;
    }

    const packageName = normalizeName(entry.package ?? entry.name);
    const vulnerabilities = entry.vulnerabilities ?? entry.vulns ?? entry.ids ?? [];

    if (!packageName) {
      continue;
    }

    if (!Array.isArray(vulnerabilities)) {
      throw new Error(`Allowlist entry for ${packageName} must declare vulnerabilities as an array.`);
    }

    allowlist.set(packageName, new Set(vulnerabilities.map(normalizeId)));
  }

  return allowlist;
}

function extractDependencies(auditReport) {
  if (Array.isArray(auditReport?.dependencies)) {
    return auditReport.dependencies;
  }

  if (Array.isArray(auditReport)) {
    return auditReport;
  }

  throw new Error('Unsupported pip-audit JSON structure. Expected a dependencies array.');
}

const auditReport = readJson(auditPath);
const allowlist = parseAllowlist(readJson(allowlistPath));
const dependencies = extractDependencies(auditReport);

const findings = [];

for (const dependency of dependencies) {
  const packageName = normalizeName(dependency?.name);
  const vulnerabilities = Array.isArray(dependency?.vulns) ? dependency.vulns : [];

  if (!packageName || vulnerabilities.length === 0) {
    continue;
  }

  const allowedIds = allowlist.get(packageName) ?? new Set();
  const blocked = vulnerabilities
    .map((vulnerability) => normalizeId(vulnerability?.id))
    .filter((id) => id && !allowedIds.has(id));

  if (blocked.length > 0) {
    findings.push({ packageName, blocked, total: vulnerabilities.length });
  }
}

if (findings.length > 0) {
  for (const finding of findings) {
    console.error(`${finding.packageName}: ${finding.blocked.join(', ')}`);
  }
  console.error(`Unallowlisted pip-audit findings: ${findings.length} package(s)`);
  process.exit(1);
}

const allowedCount = dependencies.filter((dependency) => Array.isArray(dependency?.vulns) && dependency.vulns.length > 0).length;
console.log(`pip-audit findings are allowlisted for ${allowedCount} package(s).`);