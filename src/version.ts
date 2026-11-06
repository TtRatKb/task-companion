import packageInfo from '../package.json';

/** Human-readable release number, plus the exact GitHub Pages commit. */
export const appVersion = `v${packageInfo.version}`;
const commit = import.meta.env.VITE_BUILD_SHA?.trim();
export const buildId = commit ? commit.slice(0, 8) : 'lokal';
export const versionLabel = `${appVersion} · Build ${buildId}`;
