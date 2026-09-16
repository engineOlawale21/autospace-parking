# CI/CD

Autospace uses GitHub Actions as the repository quality gate and GitHub
Container Registry (GHCR) as the image promotion boundary. Local Git hooks are
not installed or required.

## Continuous integration

`.github/workflows/ci.yml` runs for pull requests and pushes to `main`:

- installs the locked Yarn dependency graph and runs formatting, TypeScript,
  lint, API unit tests, and all Nx builds;
- formats, vets, race-tests, and builds every Go service;
- lints protobuf contracts with the pinned Buf container;
- validates the complete Docker Compose model.

Configure `Node quality and build`, both Go matrix checks, `Protobuf contracts`,
and `Container configuration` as required checks on the protected `main`
branch. CI commands are read-only checks: formatting and lint fixes must be
applied by contributors before pushing.

## Container delivery

`.github/workflows/delivery.yml` runs for version tags such as `v0.1.0` and can
also be started manually. It builds and publishes separate OCI images for the
API, four web applications, search service, and availability service to GHCR.
Every image receives the release tag and an immutable commit-SHA tag, BuildKit
cache metadata, an SBOM, provenance, and a GitHub build attestation.

The workflow intentionally stops at the trusted registry boundary. Deployment
to Kubernetes, ECS, Nomad, or another runtime must be added as an environment-
protected job once the target platform, secret store, migration strategy, and
rollback command are defined. A production deployment must consume immutable
SHA or digest references, run migrations as a one-shot job, verify readiness,
and retain the prior release for rollback.

## Releasing

1. Merge only after all required CI checks pass.
2. Create an annotated semantic-version tag from an approved `main` commit.
3. Push the tag and verify all image attestations and digests.
4. Promote the exact image digests through staging and production; never
   rebuild source separately for each environment.
