import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const VALID_BUILD_TYPES = new Set(["dev", "pretest", "prod"]);

function fail(message, error) {
  console.error(`[zip-build] ${message}`);

  if (error) {
    console.error(error.message);
  }

  process.exit(1);
}

function formatDate(date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const year = String(date.getFullYear());

  return `${month}-${day}-${year}`;
}

function getBuildType() {
  const buildType = process.argv[2];

  if (!VALID_BUILD_TYPES.has(buildType)) {
    fail('Invalid build type. Use "dev", "pretest" or "prod".');
  }

  return buildType;
}

function getProjectPaths() {
  const scriptFilePath = fileURLToPath(import.meta.url);
  const scriptDirectory = path.dirname(scriptFilePath);
  const projectRoot = path.resolve(scriptDirectory, "..");
  const distDirectory = path.join(projectRoot, "dist");
  const buildsDirectory = path.join(projectRoot, "builds");

  return {
    projectRoot,
    distDirectory,
    buildsDirectory,
  };
}

function ensureDistDirectory(distDirectory) {
  let distStats;

  try {
    distStats = fs.statSync(distDirectory);
  } catch (error) {
    fail(`Build output directory not found: ${distDirectory}`, error);
  }

  if (!distStats.isDirectory()) {
    fail(`Build output path is not a directory: ${distDirectory}`);
  }
}

function ensureBuildsDirectory(buildsDirectory) {
  try {
    fs.mkdirSync(buildsDirectory, { recursive: true });
  } catch (error) {
    fail(`Unable to create builds directory: ${buildsDirectory}`, error);
  }
}

function removeExistingArchive(archivePath) {
  if (!fs.existsSync(archivePath)) {
    return;
  }

  const archiveStats = fs.statSync(archivePath);

  if (!archiveStats.isFile()) {
    fail(`Archive destination exists but is not a file: ${archivePath}`);
  }

  try {
    fs.unlinkSync(archivePath);
  } catch (error) {
    fail(`Unable to overwrite existing archive: ${archivePath}`, error);
  }
}

function runCommand(command, args, options = {}) {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    ...options,
  });

  if (result.error) {
    fail(`Failed to start "${command}".`, result.error);
  }

  if (result.status !== 0) {
    fail(`"${command}" exited with code ${result.status}.`);
  }
}

function createArchive(distDirectory, archivePath) {
  if (process.platform === "win32") {
    const entries = fs.readdirSync(distDirectory);

    if (entries.length === 0) {
      fail(`Build output directory is empty: ${distDirectory}`);
    }

    runCommand("tar", [
      "-a",
      "-c",
      "-f",
      archivePath,
      "-C",
      distDirectory,
      ...entries,
    ]);
    return;
  }

  runCommand("zip", ["-r", archivePath, "."], { cwd: distDirectory });
}

function main() {
  const buildType = getBuildType();
  const { distDirectory, buildsDirectory } = getProjectPaths();
  const archiveDate = formatDate(new Date());
  const archiveName = `${buildType}_build-${archiveDate}.zip`;
  const archivePath = path.join(buildsDirectory, archiveName);

  ensureDistDirectory(distDirectory);
  ensureBuildsDirectory(buildsDirectory);
  removeExistingArchive(archivePath);
  createArchive(distDirectory, archivePath);

  console.log(`[zip-build] Archive created: ${archivePath}`);
}

main();
