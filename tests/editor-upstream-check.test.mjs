import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const repo = new URL('../', import.meta.url);
const checker = fileURLToPath(new URL('scripts/check-editor-upstream.mjs', repo));

for (const { name, field, mutate } of [
  {
    name: 'the pin has no commit suffix',
    field: 'version',
    mutate: (editor) => { editor.version = editor.version.split('-')[0]; },
  },
  {
    name: 'the commit is not a full SHA',
    field: 'commit',
    mutate: (editor) => { editor.commit = editor.version.split('-')[1]; },
  },
  {
    name: 'the full commit has a different prefix',
    field: 'commit',
    mutate: (editor) => {
      editor.commit = (editor.commit[0] === '0' ? '1' : '0') + editor.commit.slice(1);
    },
  },
  {
    name: 'the production hash differs',
    field: 'productionVersion',
    mutate: (editor) => {
      const last = editor.productionVersion.at(-1);
      editor.productionVersion = editor.productionVersion.slice(0, -1) + (last === '0' ? '1' : '0');
    },
  },
  {
    name: 'the production timestamp differs',
    field: 'productionVersion',
    mutate: (editor) => {
      const differentTimestamp = new Date(Date.parse(editor.releasedAt) + 1000).toISOString();
      editor.productionVersion = `${differentTimestamp}-${editor.version.split('-')[1]}`;
    },
  },
]) {
  test(`offline checker rejects inconsistent provenance when ${name}`, (t) => {
    const root = mkdtempSync(join(tmpdir(), 'editor-upstream-check-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    mkdirSync(join(root, 'frontend'));
    for (const file of ['upstream.json', 'frontend/package.json', 'frontend/package-lock.json']) {
      copyFileSync(new URL(file, repo), join(root, file));
    }

    const upstreamPath = join(root, 'upstream.json');
    const upstream = JSON.parse(readFileSync(upstreamPath, 'utf8'));
    const editor = upstream.editor;
    mutate(editor);
    writeFileSync(upstreamPath, JSON.stringify(upstream));

    // Keep the package files in sync so the version case exercises provenance only.
    if (field === 'version') {
      const manifestPath = join(root, 'frontend/package.json');
      const lockPath = join(root, 'frontend/package-lock.json');
      const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
      const lock = JSON.parse(readFileSync(lockPath, 'utf8'));
      manifest.dependencies[editor.package] = editor.version;
      lock.packages[`node_modules/${editor.package}`].version = editor.version;
      writeFileSync(manifestPath, JSON.stringify(manifest));
      writeFileSync(lockPath, JSON.stringify(lock));
    }

    const result = spawnSync(process.execPath, [checker, '--offline', '--root', root], { encoding: 'utf8' });
    assert.ifError(result.error);
    assert.equal(result.status, 1, result.stderr || result.stdout);
    assert.match(result.stderr, new RegExp(`upstream\\.json: editor\\.${field}\\b`));
  });
}
