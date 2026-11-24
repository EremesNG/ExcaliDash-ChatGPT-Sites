# Drawing Api Specification

## Purpose

Durable behavior for drawing-api.

## Requirements

### Requirement: Conditional drawing reads

Drawing GET MUST support `omitPreview=1` with a `hasPreview` flag and return a strong ETag derived from the selected representation with `Cache-Control: private, no-cache`, evaluating `If-None-Match` only after identity and ownership checks so that 304 is returned only to the owning user.

#### Scenario: Conditional drawing reads

- **GIVEN** an owner who fetched a drawing and its ETag
- **WHEN** they re-request it with `If-None-Match` unchanged
- **THEN** the Worker returns 304 without a body, while another user replaying that ETag receives 404 and a rename changes the ETag

### Requirement: Compact and compressed drawing saves

Drawing PUT MUST accept gzip-encoded JSON bodies bounded by the 16 MiB decompressed limit and honor `Prefer: return=minimal` with a reduced response, keeping version-conflict semantics.

#### Scenario: Compact and compressed drawing saves

- **GIVEN** a gzip-encoded PUT with `Prefer: return=minimal` and the current version
- **WHEN** it is saved
- **THEN** the response is the reduced shape with the incremented version, and a stale version still yields 409

### Requirement: Drop-to-append preference

Account preferences MUST persist `appendDroppedDrawings` and report its default when unset.

#### Scenario: Drop-to-append preference

- **GIVEN** a user without stored preferences
- **WHEN** they set `appendDroppedDrawings` to true and reload preferences
- **THEN** the value is true and other users are unaffected
