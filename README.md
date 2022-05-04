# Branch Auto Versioning

Update and track branch version using yaml file

## Inputs

### `input_branch_version_file_name`

**Required** The name of the person to greet. Default `"version.yml"`.

### `input_main_version_file_name`

**Required** Filename of branch VERSION file (yaml file). Default `"VERSION"`.

### `input_major_version`

**Optional** Major version (will override the major and minor version in file)'.

### `input_minor_version`

**Optional** Minor version (will override the major and minor version in file)'.

## Outputs

### `branch_version`

The updated branch version.

### `feature_branch_name`

The trimmed branch name, set to null if not a feature branch

### `feature_branch_version`

Combination of branch_version and feature_branch_name, set to null if not a feature branch

## Example usage

```yaml
- name: Auto-versioning
  id: autoversioning
  uses: rcablao-kodexa/branch-auto-versioning@main
  with:
    input_branch_version_file_name: "version.yml"
    input_main_version_file_name: "VERSION"
- name: Get the output version
  run: |
    echo "Latest branch version: ${{ steps.autoversioning.outputs.branch_version }}"
```
