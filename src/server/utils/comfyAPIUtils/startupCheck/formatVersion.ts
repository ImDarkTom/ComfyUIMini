/**
 * Converts a ComfyUI version string to a semver-compatible version string.
 *
 * E.g. `v0.2.2-84-gd1cdf51` becomes `0.2.2.84`.
 *
 * @param versionString The input version string.
 * @returns The semver-compatible version string.
 */
function formatVersion(versionString: string): string {
    return versionString
        .replace('v', '')
        .replace(/-[a-z0-9]+$/, '')
        .replace(/-/g, '.');
}

export default formatVersion;
