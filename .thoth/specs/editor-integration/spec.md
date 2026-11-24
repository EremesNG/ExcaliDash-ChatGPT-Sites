# Editor Integration Specification

## Purpose

Durable behavior for editor-integration.

## Requirements

### Requirement: Pinned editor build

The frontend MUST depend on the exact published editor version `0.18.0-9c2e462`, with full commit, integrity and production provenance recorded in `upstream.json`; offline consistency validation MUST reject disagreement among the manifest, lockfile and provenance.

#### Scenario: Pinned editor build

- **GIVEN** the current production editor is `0.18.0-9c2e462`
- **WHEN** the update is installed and built
- **THEN** the exact version and matching full commit/integrity are recorded and the offline consistency check passes

### Requirement: Editor upstream drift status

Authenticated users MUST be able to see the built editor version and production drift status through Settings Advanced and the server-side comparison, preserving equal/newer/different/unavailable behavior for the updated pin without browser requests to third-party hosts.

#### Scenario: Editor upstream drift status

- **GIVEN** the pinned editor is `0.18.0-9c2e462`
- **WHEN** excalidraw.com reports a later build with another hash
- **THEN** `/api/system/editor` returns `newer` and Advanced shows an update
