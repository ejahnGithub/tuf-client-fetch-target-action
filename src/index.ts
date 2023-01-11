import * as core from '@actions/core';
import fs from 'fs';
import fetch from 'make-fetch-happen';
import path from 'path';
import { Updater } from 'tuf-js';

const metadataDir = './metadata';
const targetDir = './targets';

async function initDir(rootMetadataUrl: string) {
  if (!fs.existsSync(metadataDir)) {
    fs.mkdirSync(metadataDir);
  }

  if (!fs.existsSync(path.join(metadataDir, 'root.json'))) {
    // install 1.root.json
    const data = await (await fetch(rootMetadataUrl)).json();
    fs.writeFileSync(path.join(metadataDir, 'root.json'), JSON.stringify(data));
  }

  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir);
  }
}

async function downloadTarget(
  targetFile: string,
  metadataBaseUrl: string,
  targetBaseUrl: string
) {
  const updater = new Updater({
    metadataBaseUrl,
    metadataDir,
    targetDir,
    targetBaseUrl,
  });
  await updater.refresh();
  const targetInfo = await updater.getTargetInfo(targetFile);

  if (!targetInfo) {
    console.log(`Target ${targetFile} doesn't exist`);
    return;
  }
  const targetPath = await updater.findCachedTarget(targetInfo);
  if (targetPath) {
    console.log(`Target ${targetFile} is cached at ${targetPath}`);
    return;
  }

  const downloadedTargetPath = await updater.downloadTarget(targetInfo);
  console.log(`Target ${targetFile} downloaded to ${downloadedTargetPath}`);
}

async function run() {
  const targetFile = core.getInput('targetFile');
  const metadataBaseUrl = core.getInput('metadataBaseUrl');
  const targetBaseUrl = core.getInput('targetBaseUrl');
  const rootMetadataUrl = core.getInput('rootMetadataUrl');

  await initDir(rootMetadataUrl);
  await downloadTarget(targetFile, metadataBaseUrl, targetBaseUrl);
}

try {
  run();
} catch (err) {
  core.setFailed(`Action failed with error ${err}`);
}
