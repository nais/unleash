# Monorepo Multi-Version Readiness Review

## ✅ Structure Ready for Multiple Versions

### Package Organization
- **✅ Workspace configuration**: `pnpm-workspace.yaml` supports `packages/*` pattern
- **✅ Shared package**: `@nais/unleash-shared` contains version-agnostic authentication code
- **✅ Version packages**: Currently `unleash-v5`, ready for `v6`, `v7`, etc.
- **✅ Type safety**: TypeScript configured with proper path mappings and references

### Dockerfile Multi-Version Support
- **✅ Build argument**: `UNLEASH_VERSION` parameter (default: v5)
- **✅ Dynamic package selection**: Copies only target version + shared
- **✅ Optimized builds**: Uses `pnpm deploy` for minimal production images
- **✅ Version labels**: Docker labels include version metadata

**Usage**:
```bash
# Build v5 (default)
docker build -t nais-unleash:v5 .

# Build v6
docker build --build-arg UNLEASH_VERSION=v6 -t nais-unleash:v6 .

# Build v7
docker build --build-arg UNLEASH_VERSION=v7 -t nais-unleash:v7 .
```

## ✅ CI/CD Multi-Version Strategy

### Automatic Version Detection
- **✅ detect-versions job**: Automatically discovers all `packages/unleash-v*` directories
- **✅ Dynamic matrix**: Builds only versions that exist in the repository
- **✅ Parallel builds**: Each version builds independently and in parallel

### Build Strategy
1. **Lint & Test**: All packages tested together (shared + all versions)
2. **Version Detection**: Scans `packages/` for version directories
3. **Matrix Build**: Builds Docker image for each detected version with correct build arg
4. **Version-Specific Tags**:
   - `v5-5.12.8` (version-only tag)
   - `v5-5.12.8-20251213-abc123` (timestamped tag)
5. **Git Tags**: Creates tags per version automatically

### Tag Naming Convention
- **Current**: `v5-{unleash-version}-{date}-{sha}`
- **Extensible**: Works automatically for v6, v7, etc.
- **Example**: `nais-unleash:v6-6.2.0-20251215-def456`

## ✅ Testing Strategy

### Package-Level Testing
- **✅ Shared tests**: Run without database (fast feedback)
- **✅ Version tests**: Run with PostgreSQL service in CI
- **✅ Parallel execution**: All versions tested simultaneously

### Local Testing with Mise
```bash
# Test shared only (no DB)
mise run test:shared

# Test specific version with DB
mise run test:v5
mise run test:v6  # When v6 exists

# Test all versions
mise run test:all
```

### CI Testing Matrix
```yaml
build-and-test:
  - Lint all packages
  - Build all packages (shared + v5, v6, v7)
  - Test all packages (with PostgreSQL)
  → Ensures all versions work before Docker build
```

## ✅ Release Strategy

### Per-Version Releases
Each Unleash version can be released independently:

1. **Update version package**: Bump `unleash-server` dependency
2. **Test**: Run `mise run test:v5` (or v6, v7)
3. **Commit & Push**: CI automatically builds and pushes new image
4. **Git tags**: Auto-created per version

### Image Registry Organization
```
nais-unleash:v5-5.12.8-20251213-123456
nais-unleash:v5-5.12.8
nais-unleash:v6-6.1.0-20251213-123456
nais-unleash:v6-6.1.0
nais-unleash:v7-7.0.0-20251213-123456
nais-unleash:v7-7.0.0
```

### Version Independence
- Each version has its own lifecycle
- Updating v5 doesn't affect v6 or v7
- Shared code updates affect all versions (tested together)

## ✅ Development Workflow

### Adding New Version (v6 Example)

1. **Create package structure**:
   ```bash
   mkdir -p packages/unleash-v6/src
   cp packages/unleash-v5/package.json packages/unleash-v6/
   cp packages/unleash-v5/tsconfig.json packages/unleash-v6/
   cp packages/unleash-v5/jest.config.ts packages/unleash-v6/
   cp -r packages/unleash-v5/src/* packages/unleash-v6/src/
   ```

2. **Update dependencies**:
   ```json
   {
     "name": "unleash-v6",
     "version": "6.1.0",
     "dependencies": {
       "@nais/unleash-shared": "workspace:*",
       "unleash-server": "6.1.0"
     }
   }
   ```

3. **Adapt for breaking changes**:
   - Review Unleash v6 changelog
   - Update authentication hooks if needed
   - Create v6 adapter in shared if necessary

4. **Test locally**:
   ```bash
   mise run build:v6
   mise run test:v6
   mise run docker:build:v6
   ```

5. **Commit and push**:
   - CI automatically detects v6
   - Builds Docker image
   - Pushes with v6 tags
   - Creates git tag

### Shared Code Updates

When updating shared authentication:
```bash
# Make changes in packages/shared/src/
cd packages/shared
pnpm build
pnpm test

# Test impact on all versions
mise run test:all

# If all pass, commit
git add packages/shared
git commit -m "feat(shared): improve authentication caching"
git push
```

CI builds and tests all versions with updated shared code.

## ✅ Deployment Strategy

### Version-Specific Deployments

Each version can have separate deployments:

```yaml
# deployment-v5.yaml
spec:
  template:
    spec:
      containers:
      - name: unleash
        image: nais-unleash:v5-5.12.8

# deployment-v6.yaml
spec:
  template:
    spec:
      containers:
      - name: unleash
        image: nais-unleash:v6-6.1.0
```

### Gradual Migration

1. Deploy v6 alongside v5
2. Route subset of traffic to v6
3. Monitor and validate
4. Gradually increase v6 traffic
5. Decommission v5

### Rollback Strategy

Version-specific tags allow instant rollback:
```bash
# Rollback v6 to previous version
kubectl set image deployment/unleash-v6 \
  unleash=nais-unleash:v6-6.0.5
```

## ✅ Documentation

### Comprehensive Guides
- **✅ README.md**: Quick start, common tasks, workspace structure
- **✅ ADDING_VERSIONS.md**: Complete guide for adding v6, v7, etc.
- **✅ Mise tasks**: Self-documenting with descriptions

### Developer Experience
```bash
# Discover available tasks
mise tasks

# Get started quickly
mise run dev

# Build/test specific version
mise run build:v6
mise run test:v6

# Docker operations
mise run docker:build:all
```

## ✅ Safety Checks

### Pre-Merge Testing
- **Lint**: All packages must pass linting
- **Build**: All packages must compile
- **Test**: All version tests must pass with database
- **Docker**: Docker build validation in PR

### Version Isolation
- Each version in separate package directory
- Shared code in dedicated package
- Version-specific tests
- Independent CI jobs per version

## ✅ Maintenance Considerations

### Shared Package Evolution

When authentication APIs change across versions:

**Option 1: Version Adapters**
```typescript
// packages/shared/src/adapters/v6-adapter.ts
export function adaptAuthHandlerForV6(handler: V5Handler): V6Handler {
  // Adaptation logic
}
```

**Option 2: Version Detection**
```typescript
// packages/shared/src/google-iap.ts
export function createAuthHandler(version: number) {
  if (version >= 6) {
    return createV6Handler();
  }
  return createV5Handler();
}
```

### Dependency Management

- **Shared deps**: Updated in shared package, affects all
- **Version-specific deps**: Updated independently
- **DevDeps**: Centralized in root for consistency

### Database Migrations

Each version may have different Unleash schemas:
- Database isolation recommended
- Or use version-specific prefixes
- Documented in deployment guides

## 🎯 Summary

### Ready for Production ✅
- ✅ Multi-version Dockerfile
- ✅ Automatic version detection in CI
- ✅ Parallel builds and tests
- ✅ Version-specific image tags
- ✅ Shared code reusability
- ✅ Developer-friendly tooling
- ✅ Comprehensive documentation

### Adding v6 Requires
1. Copy v5 package structure
2. Update unleash-server dependency
3. Adapt for v6 breaking changes (if any)
4. Commit and push (CI handles the rest)

### Zero Infrastructure Changes Needed
- Dockerfile: ✅ Already version-agnostic
- CI/CD: ✅ Auto-detects new versions
- Mise tasks: ✅ Auto-generates tasks
- Testing: ✅ Runs all versions

### Migration Path
```
Current:  v5 only
Step 1:   Add v6 (5 minutes to create package)
Step 2:   Test v6 (mise run test:v6)
Step 3:   Push (CI builds automatically)
Step 4:   Deploy v6 alongside v5
Step 5:   Migrate traffic gradually
Step 6:   Add v7 (repeat process)
```

## 📋 Pre-Deployment Checklist

- [x] Workspace structure supports multiple versions
- [x] Shared package extracts common code
- [x] Dockerfile accepts version build arg
- [x] CI detects versions automatically
- [x] CI builds all versions in parallel
- [x] Tests run for all versions
- [x] Image tags include version prefix
- [x] Git tags created per version
- [x] Local development tooling (mise) ready
- [x] Documentation complete (README + ADDING_VERSIONS)
- [x] Examples for adding v6/v7 provided
- [x] Test strategy defined and implemented
- [x] Release strategy documented

## 🚀 Next Steps

1. **Immediate**: Merge to main branch
2. **Short-term**: Monitor v5 builds and deployments
3. **When ready for v6**: Follow ADDING_VERSIONS.md guide
4. **Long-term**: Gradual migration strategy across versions
