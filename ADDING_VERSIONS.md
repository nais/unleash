# Adding New Unleash Versions

This guide explains how to add support for new major Unleash versions (v6, v7, etc.) to the monorepo.

## Step 1: Create Version Package

Create a new package directory for the version:

```bash
mkdir -p packages/unleash-v6
```

## Step 2: Create package.json

Create `packages/unleash-v6/package.json`:

```json
{
  "name": "unleash-v6",
  "version": "6.x.x",
  "description": "NAIS Unleash v6 server with custom authentication",
  "main": "dist/index.js",
  "scripts": {
    "build": "tsc",
    "start": "node dist/index.js",
    "test": "jest --coverage --no-cache",
    "lint": "eslint 'src/**/*.ts'"
  },
  "dependencies": {
    "@nais/unleash-shared": "workspace:*",
    "unleash-server": "6.x.x"
  },
  "devDependencies": {
    "@types/node": "20.14.10",
    "@types/supertest": "6.0.2",
    "nock": "^13.5.4",
    "supertest": "^7.0.0"
  }
}
```

**Important**: Update the `unleash-server` dependency to the target v6 version.

## Step 3: Create TypeScript Configuration

Create `packages/unleash-v6/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "baseUrl": ".",
    "paths": {
      "@nais/unleash-shared": ["../shared/dist/src/index.d.ts"],
      "@nais/unleash-shared/*": ["../shared/dist/src/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts", "../shared"]
}
```

## Step 4: Create Jest Configuration

Create `packages/unleash-v6/jest.config.ts`:

```typescript
import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/*.test.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.test.ts'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
};

export default config;
```

## Step 5: Copy and Adapt Application Code

Copy the v5 source files as a starting point:

```bash
cp -r packages/unleash-v5/src packages/unleash-v6/
```

### Adapt server.ts for v6 Changes

Review the Unleash v6 release notes for breaking changes. Common areas that may need adaptation:

1. **Authentication API changes**: Check if the custom authentication hook interface has changed
2. **Configuration structure**: Verify if IUnleashOptions structure has changed
3. **Type imports**: Update any changed type import paths
4. **Deprecated APIs**: Replace any deprecated APIs with v6 equivalents

Example adaptation pattern if authentication changed:

```typescript
// If v6 has a different auth handler signature
import { AuthHandler } from "unleash-server/v6/types/auth";

// Create adapter in shared package
export function createV6AuthAdapter(v5Handler: any): AuthHandler {
  // Adapt v5 handler to v6 interface
  return async (req, res, next) => {
    // Implementation
  };
}
```

## Step 6: Handle Version-Specific Differences

If there are significant breaking changes between versions, consider:

### Option A: Create Version Adapters in Shared Package

Create `packages/shared/src/adapters/v6-adapter.ts`:

```typescript
import { TeamsService } from "../nais-teams";

export async function createV6AuthHandler(
  teamsService: TeamsService,
  authType: "iap" | "oauth"
) {
  // V6-specific auth handler implementation
}
```

### Option B: Version-Specific Implementation

Keep version-specific code in the version package if changes are substantial.

## Step 7: Update Tests

Adapt `server.test.ts` for any v6-specific changes:

```bash
# Copy and adapt tests
cp packages/unleash-v5/src/server.test.ts packages/unleash-v6/src/
```

Update mock objects and assertions based on v6 API changes.

## Step 8: Verify Build

```bash
# Install dependencies
pnpm install

# Build the new version
mise run build:v6

# Or
pnpm --filter unleash-v6 build
```

## Step 9: Test with Database

```bash
# Start database
mise run db:start

# Run tests
pnpm --filter unleash-v6 test
```

## Step 10: Build Docker Image

```bash
# Build v6 Docker image
mise run docker:build:v6

# Or manually
docker build --build-arg UNLEASH_VERSION=v6 -t nais-unleash:v6-local .
```

## Step 11: Update Documentation

Add v6 references to:

1. Root README.md - mention v6 support
2. Mise tasks - already done automatically
3. CI/CD - automatically detects new versions

## Testing the New Version

### Local Testing

```bash
# Start v6 server
mise run start:v6

# Or manually
cd packages/unleash-v6
DATABASE_USERNAME=unleash \
DATABASE_PASSWORD=unleash \
DATABASE_NAME=unleash \
DATABASE_HOST=localhost \
DATABASE_SSL=false \
INIT_ADMIN_API_TOKENS="*:*.unleash4all" \
GOOGLE_IAP_AUDIENCE="/projects/123/global/backendServices/123" \
pnpm start
```

### Docker Testing

```bash
docker run -p 4242:4242 \
  -e DATABASE_HOST=host.docker.internal \
  -e DATABASE_USERNAME=unleash \
  -e DATABASE_PASSWORD=unleash \
  -e DATABASE_NAME=unleash \
  -e DATABASE_SSL=false \
  -e INIT_ADMIN_API_TOKENS="*:*.unleash4all" \
  -e GOOGLE_IAP_AUDIENCE="/projects/123/global/backendServices/123" \
  nais-unleash:v6-local
```

## CI/CD Integration

Once you commit the new `packages/unleash-v6` directory:

1. **Automatic Detection**: The workflow automatically detects all `unleash-v*` packages
2. **Parallel Builds**: CI builds all versions in parallel
3. **Version-Specific Tags**: Images tagged as `v6-{version}-{date}-{sha}`
4. **Git Tags**: Automatically creates git tags for each version
5. **ReleaseChannel Chart**: Automatically updated with new version

No workflow changes needed!

## ReleaseChannel Chart

The Helm chart at `charts/unleash-releasechannel` automatically creates ReleaseChannel resources for each version.

### Automatic Version Detection

The chart workflow (`chart.yaml`) automatically:
1. Detects all `packages/unleash-v*` directories
2. Reads the `unleash-server` version from each `package.json`
3. Updates `values.yaml` with timestamped image tags
4. Creates ReleaseChannel resources for each version

### Manual values.yaml Structure

If you need to manually add a version before the workflow runs:

```yaml
# charts/unleash-releasechannel/values.yaml
versions:
  v5:
    enabled: true
    tag: v5-5.12.8-20251214-143749-f21986b
  v6:
    enabled: true
    tag: v6-6.10.1-20251214-143754-f21986b
  v7:  # Add new version
    enabled: true
    tag: v7-7.0.0-20251215-100000-abc1234
```

### Disabling a Version

To temporarily disable a version without removing it:

```yaml
versions:
  v5:
    enabled: false  # This version won't create a ReleaseChannel
    tag: v5-5.12.8-20251214-143749-f21986b
```

### ReleaseChannel Resources Created

For each enabled version, the chart creates:

```yaml
apiVersion: unleash.nais.io/v1
kind: ReleaseChannel
metadata:
  name: unleash-v7
  namespace: <release-namespace>
spec:
  image: "europe-north1-docker.pkg.dev/nais-io/nais/images/nais-unleash:v7-7.0.0-20251215-100000-abc1234"
  strategy:
    maxParallel: 1
    batchInterval: "30s"
  healthChecks:
    enabled: true
    initialDelay: "30s"
    timeout: "5m"
```

### Connecting Unleash Instances

Once the ReleaseChannel exists, connect Unleash instances to it:

```yaml
apiVersion: unleash.nais.io/v1
kind: Unleash
metadata:
  name: my-unleash
spec:
  releaseChannel:
    name: unleash-v7  # References the ReleaseChannel
  database:
    url: "postgres://..."
```

## Version Matrix Testing

The CI workflow tests all versions against the same test suite. If a version has specific requirements:

1. Add version-specific environment variables in `.github/workflows/main.yml`
2. Add conditional test steps if needed

## Maintenance

### Updating Shared Dependencies

When updating `@nais/unleash-shared`, test all versions:

```bash
mise run test:all
```

### Version-Specific Patches

If only one version needs a patch:

```bash
# Update specific version
cd packages/unleash-v6
# Make changes
pnpm build
pnpm test

# Push changes - CI builds only changed versions
git add .
git commit -m "fix: patch unleash-v6 authentication"
git push
```

## Common Issues

### Type Errors After Unleash Update

**Problem**: TypeScript errors after updating unleash-server version

**Solution**:
1. Check Unleash changelog for type changes
2. Update type imports
3. Add version-specific type declarations if needed

### Authentication Hook Not Working

**Problem**: Custom auth handler fails in new version

**Solution**:
1. Review Unleash v6 auth documentation
2. Create version-specific adapter
3. Update shared package exports

### Build Fails in Docker

**Problem**: Docker build fails to find package

**Solution**:
1. Verify package.json exists in new version directory
2. Check pnpm-workspace.yaml includes the package
3. Ensure pnpm install runs before building

## Checklist

- [ ] Created `packages/unleash-vX` directory
- [ ] Added package.json with correct unleash-server version
- [ ] Created tsconfig.json
- [ ] Created jest.config.ts (or vitest.config.ts)
- [ ] Copied and adapted source code
- [ ] Updated authentication handlers if needed
- [ ] Created version-specific adapters if needed
- [ ] Tests pass locally with database
- [ ] Docker image builds successfully
- [ ] Documentation updated
- [ ] Committed and pushed changes
- [ ] CI/CD builds and pushes images
- [ ] Verified images in registry
- [ ] ReleaseChannel chart updated automatically
- [ ] ReleaseChannel deployed to Fasit
- [ ] Verified ReleaseChannel resource exists in cluster

## Future Versions

This same process applies for v7, v8, etc. The infrastructure is version-agnostic and will automatically:
- Detect new versions in CI
- Build Docker images
- Tag appropriately
- Run tests
