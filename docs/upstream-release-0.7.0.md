# ExcaliDash v0.7.0 in Sites

Upstream: [ZimengXiong/ExcaliDash v0.7.0](https://github.com/ZimengXiong/ExcaliDash/releases/tag/v0.7.0), published November 22, 2026, commit `b692be20aea76519c19e9874d95163887066f036`. See the [full comparison from v0.6.7](https://github.com/ZimengXiong/ExcaliDash/compare/v0.6.7...v0.7.0).

## Upstream changes

- [v0.6.8](https://github.com/ZimengXiong/ExcaliDash/releases/tag/v0.6.8): fixes for save concurrency, long text, navigation after deletion, link sharing and session recovery, plus SQLite backup and first-admin setup fixes.
- [v0.6.9](https://github.com/ZimengXiong/ExcaliDash/releases/tag/v0.6.9): working collaboration follow mode, system theme, stale-tab library protection, inline rename that saves on blur and cancels on Escape, plus API-key and reverse-proxy fixes.
- [v0.6.10](https://github.com/ZimengXiong/ExcaliDash/releases/tag/v0.6.10): adds the option to append dropped drawings ([#345 by @alexbrasetvik](https://github.com/ZimengXiong/ExcaliDash/pull/345)), improves viewport fitting and shows configured history retention.
- [v0.7.0](https://github.com/ZimengXiong/ExcaliDash/compare/v0.6.10...v0.7.0): improves dashboard rendering, thumbnails and drawing prefetch, editor responsiveness and saves, and backend I/O and query efficiency.

## Adapted for Sites

- Merge applicable dashboard and editor improvements onto the Sites frontend, retaining English and Spanish localization, managed identity and HTTP collaboration. Collaboration follow mode is excluded because the Sites transport and Worker event allowlist do not support `visible-bounds`. The Excalidraw package remains independently pinned.
- Drawing GET supports `omitPreview=1` with `hasPreview`. Drawing, preview and file reads check identity and ownership before evaluating `If-None-Match`; a matching strong, representation-specific ETag returns a bodyless `304`. Responses use `Cache-Control: private, no-cache`. The frontend scopes caches by account, clears them on identity changes and discards late responses for the previous account.
- Drawing PUT accepts gzip JSON up to 16 MiB after decompression and honors `Prefer: return=minimal`, without changing optimistic version checks.
- History lists report `retentionDays: null` (unlimited); Sites does not add a history pruning job. The account preference `appendDroppedDrawings` persists per user.
- An append-only D1 migration adds the `drawings(collectionId, updatedAt)` index without changing existing data.

## Reference only

Sites does not port SQLite backups or WAL handling, first-admin setup, Socket.IO API-key authentication, share-link sessions, nginx or Docker changes, or snapshot coalescing. The Node backend and upstream documentation are retained as references, not run by Sites. The [upstream release notes](https://github.com/ZimengXiong/ExcaliDash/releases) retain contributor credits; the original LGPL-3.0 license is in [LICENSE](../LICENSE).
