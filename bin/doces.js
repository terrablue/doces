#!/usr/bin/env node

import {Path, File} from "runtime-compat/filesystem";
import {App} from "doces";

const base = Path.resolve();
let config = {};
if (await File.exists(`${base}/doces.json`)) {
  config = (await import(`${base}/doces.json`,
    {assert: {type: "json"}})).default;
}
const app = new App(base, config);
await app.run();
