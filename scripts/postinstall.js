/**
 * Cross-platform Prisma junction/symlink fixer.
 *
 * Prisma v7 on Windows fails to create the `.prisma` directory junction
 * inside `node_modules/@prisma/client` during `prisma generate`.
 * Without it, TypeScript cannot resolve `PrismaClient`, `Role`, and other
 * generated types through the re-export chain in `@prisma/client`.
 *
 * On Linux (Vercel, CI, Docker), `prisma generate` creates the symlink
 * automatically — this script is a no-op there.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const prismaClientDir = path.join(__dirname, '..', 'node_modules', '@prisma', 'client');
const junctionTarget = path.join(__dirname, '..', 'node_modules', '.prisma');
const junctionPath = path.join(prismaClientDir, '.prisma');

// Only needed on Windows — Linux prisma generate handles symlinks natively
if (process.platform === 'win32') {
  if (!fs.existsSync(junctionPath)) {
    try {
      execSync(`cmd /c mklink /J "${junctionPath}" "${junctionTarget}"`, { stdio: 'pipe' });
      console.log('[postinstall] Created Prisma client junction for TypeScript resolution.');
    } catch (e) {
      console.warn('[postinstall] Could not create Prisma junction (may need admin rights):', e.message);
    }
  } else {
    console.log('[postinstall] Prisma junction already exists, skipping.');
  }
}
