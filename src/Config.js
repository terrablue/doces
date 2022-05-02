import {Path} from "runtime-compat/filesystem";

export default class {
  #base;

  constructor(base, conf) {
    this.#base = base;
    this.conf = conf;
  }

  #resolve(path) {
    return Path.resolve(this.#base, path);
  }

  get source() {
    return this.#resolve(this.conf.source ?? "src");
  }

  get destination() {
    return this.#resolve(this.conf.destination ?? "destination");
  }
}
