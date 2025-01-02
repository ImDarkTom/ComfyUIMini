/**
 * Compares `version` with `versionRequirement`.
 *
 * @param version The version string, e.g., `v0.2.2-84-gd1cdf51`.
 * @param versionRequirement The required version string, e.g., `0.2.2-49`.
 * @returns True if `version` is greater than or equal to `versionRequirement`.
 */
function versionCheck(version: string, versionRequirement: string): boolean {
    const versionSplit = version.split('.');
    const versionRequirementSplit = versionRequirement.split('.');

    for (const versionPart in versionSplit) {
        if (parseInt(versionSplit[versionPart]) > parseInt(versionRequirementSplit[versionPart])) {
            return true;
        }
    }

    return false;
}

export default versionCheck;
