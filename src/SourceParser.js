import {parse} from "acorn";

const config = {
  ecmaVersion: 2022,
  sourceType: "module",
  locations: true,
};

export default class SourceParser {
  constructor(file) {
    this.file = file;
    this.comments = [];
  }

  parse() {
    this.tree = parse(this.file, this.config);
    //console.log(this.tree, this.comments);
  }

  get config() {
    return {
      ...config,
      "onComment": (...rest) => {
        const [block] = rest;
        if (block) {
          const [, text, start, end] = rest;
          this.comments.push({text, start, end});
        }
      },
    };
  }
}
