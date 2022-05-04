const fs = require("fs");
const yaml = require("js-yaml");
const core = require("@actions/core");
const github = require("@actions/github");
const simpleGit = require("simple-git");

// Default Config
let curr_branch_name = process.env.GITHUB_REF_NAME || "main";
let curr_branch_version = "1.0";
let curr_branch_patch_version = 1;
let main_version_file_name = "VERSION";
let branch_version_file_name = "version.yml";

// Write to file
function writeToFile(filename, data) {
  fs.writeFile(filename, yaml.dump(data), (err) => {
    if (err) {
      console.log(err);
    }
  });
}

// Version parser
function versionParser(data) {
  result = data.split(".");
  return {
    major: parseInt(result[0]),
    minor: parseInt(result[1]),
  };
}

// Null checker
function isNotNull(data) {
  return !!data;
}

// Init
function initialize(filename) {
  writeToFile(filename, {
    major_version: 0,
    minor_version: 0,
    branches: [],
  });
}

// Main
async function main() {
  try {
    // Log branch name
    console.log("Working on branch:", curr_branch_name);

    // Get inputs
    const get_major_version = core.getInput("input_major_version");
    const get_minor_version = core.getInput("input_minor_version");
    const get_branch_version_file_name = core.getInput(
      "input_branch_version_file_name"
    );
    const get_main_version_file_name = core.getInput(
      "input_main_version_file_name"
    );

    // Validate values
    if (isNotNull(get_branch_version_file_name)) {
      branch_version_file_name = get_branch_version_file_name;
    }

    if (isNotNull(get_main_version_file_name)) {
      main_version_file_name = get_main_version_file_name;
    }

    if (fs.existsSync(branch_version_file_name)) {
      console.log("File exists:", branch_version_file_name);
    } else {
      console.log("Creating file:", branch_version_file_name);
      initialize(branch_version_file_name);
      await new Promise((resolve) => setTimeout(resolve, 10000));
    }

    // Load and read yaml file
    file_branch_version = fs.readFileSync(branch_version_file_name, "utf8");
    version_reference_file = yaml.load(file_branch_version);

    if (isNotNull(get_major_version) && isNotNull(get_minor_version)) {
      // Get and consolidate major and minor version from env vars
      version_reference_file.major_version = get_major_version;
      version_reference_file.minor_version = get_minor_version;
    } else {
      // Get and consolidate major and minor version from file
      const file_main_version = fs.readFileSync(main_version_file_name, "utf8");
      if (isNotNull(file_main_version)) {
        parsed_version = versionParser(file_main_version);
        version_reference_file.major_version = parsed_version.major;
        version_reference_file.minor_version = parsed_version.minor;
      }
    }

    // Check if branch exist: create if not, update if exist
    const branch_index = version_reference_file.branches.findIndex(
      (x) => x.name === curr_branch_name
    );

    if (branch_index >= 0) {
      console.log("Updating entry in yaml");
      if (
        version_reference_file.branches[branch_index].major ===
          version_reference_file.major_version &&
        version_reference_file.branches[branch_index].minor ===
          version_reference_file.minor_version
      ) {
        curr_branch_patch_version =
          version_reference_file.branches[branch_index].patch + 1;
      }

      version_reference_file.branches[branch_index].patch =
        curr_branch_patch_version;
      version_reference_file.branches[branch_index].major =
        version_reference_file.major_version;
      version_reference_file.branches[branch_index].minor =
        version_reference_file.minor_version;
      writeToFile(branch_version_file_name, version_reference_file);
    } else {
      console.log("Adding entry to yaml");
      version_reference_file.branches.push({
        name: curr_branch_name,
        major: version_reference_file.major_version,
        minor: version_reference_file.minor_version,
        patch: curr_branch_patch_version,
      });
      writeToFile(branch_version_file_name, version_reference_file);
    }

    // Push updated file to repo
    await simpleGit()
      .addConfig("user.name", "Branch-Auto-Versioning")
      .addConfig("user.email", "branch-auto-versioning@github-action.com")
      .add(branch_version_file_name)
      .commit(["Updated version file", "[skip ci]"])
      .push(["--set-upstream", "origin", curr_branch_name], () =>
        console.log("File updated!")
      );

    // Merge major, minor and patch version
    curr_branch_version = [
      version_reference_file.major_version.toString(),
      ".",
      version_reference_file.minor_version.toString(),
      ".",
      curr_branch_patch_version.toString(),
    ].join("");

    // Get and trim branch name
    let trimmed_feature_branch_name = null;
    let custom_feature_version = null;
    if (curr_branch_name.startsWith("features")) {
      trimmed_feature_branch_name = curr_branch_name.split("/")[1];
      custom_feature_version =
        curr_branch_version + "-" + trimmed_feature_branch_name;
    }

    // Output the version using setOutput
    core.setOutput("branch_version", curr_branch_version);
    core.setOutput("feature_branch_name", trimmed_feature_branch_name);
    core.setOutput("feature_branch_version", custom_feature_version);
  } catch (error) {
    core.setFailed(error.message);
  }
}

// Let's Go!!!
main();
