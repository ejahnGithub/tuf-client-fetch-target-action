"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core = __importStar(require("@actions/core"));
const fs_1 = __importDefault(require("fs"));
const make_fetch_happen_1 = __importDefault(require("make-fetch-happen"));
const path_1 = __importDefault(require("path"));
const tuf_js_1 = require("tuf-js");
async function initDir(rootMetadataUrl, metadataDir, targetDir) {
    if (!fs_1.default.existsSync(metadataDir)) {
        fs_1.default.mkdirSync(metadataDir);
    }
    if (!fs_1.default.existsSync(path_1.default.join(metadataDir, 'root.json'))) {
        // install 1.root.json
        const data = await (await (0, make_fetch_happen_1.default)(rootMetadataUrl)).json();
        fs_1.default.writeFileSync(path_1.default.join(metadataDir, 'root.json'), JSON.stringify(data));
    }
    if (!fs_1.default.existsSync(targetDir)) {
        fs_1.default.mkdirSync(targetDir);
    }
}
async function downloadTarget(targetFile, metadataBaseUrl, targetBaseUrl, metadataDir, targetDir) {
    const updater = new tuf_js_1.Updater({
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
    const targetFile = core.getInput('target-file');
    const metadataBaseUrl = core.getInput('metadata-base-url');
    const targetBaseUrl = core.getInput('target-base-url');
    const rootMetadataUrl = core.getInput('root-metadata-url');
    const metadataDir = './metadata';
    const targetDir = './targets';
    await initDir(rootMetadataUrl, metadataDir, targetDir);
    await downloadTarget(targetFile, metadataBaseUrl, targetBaseUrl, metadataDir, targetDir);
}
try {
    run();
}
catch (err) {
    core.setFailed(`Action failed with error ${err}`);
}
