import {Path, File} from "runtime-compat/filesystem";
import Config from "./Config.js";
import SourceParser from "./SourceParser.js";
import CommentParser from "./CommentParser.js";
import async_array_filter from "./async_array_filter.js";
import create_format from"./create_format.js";

const file_template = {
  kind: "file",
  static: true,
  access: null,
  description: null,
  lineNumber: 1,
};

export default class App {
  #base; #config; #config_object; #files; #plugins; #index;

  constructor(base, config_object) {
    this.#base = base;
    this.#config_object = config_object;
    this.#files = {};
    this.#index = [];
  }

  run() {
    return this.#load_plugins();
  }

  #hook(name, in_data) {
    let out_data = in_data;
    for (const plugin of this.#plugins) {
      out_data = plugin[name](out_data);
    }
    return out_data;
  }

  #load_plugins() {
    console.log("#load_plugins");
    this.#plugins = [];
    // hook
    this.#plugins = this.#hook("plugins", this.#plugins);
    return this.#load_config();
  }

  #load_config() {
    console.log("#load_config");
    this.#config = new Config(this.#base, this.#config_object);
    // hook
    this.#config = this.#hook("config", this.#config);
    return this.#load_files();
  }

  async #load_files() {
    console.log("#load_files");
    // collect files
    await this.#collect_files(this.#config.source);
    // hook
    this.#config = this.#hook("files", this.#config);
    return this.#parse_files();
  }

  async #collect_files(path) {
    const all = await File.list(path);
    const directories = await async_array_filter(all, file =>
      new File(`${path}/${file}`).is_directory);
    const files = all.filter(file => !directories.includes(file)
      && file.endsWith(".js"));

    for (const file of files) {
      const subpath = `${path}/${file}`;
      const key = subpath.replace(`${this.#base}/`, () => "");
      this.#files[key] = await File.read(subpath);
    }
    for (const directory of directories) {
      await this.#collect_files(`${path}/${directory}`);
    }
  }

  #parse_files() {
    console.log("#parse_files");
    for (const [name, content] of Object.entries(this.#files)) {
      this.#parse_file(name, content);
    }
  }

  #parse_file(name, content) {
    const longname = Path.resolve(this.#base, name);
    console.log(`parsing: ${longname}`);
    // add doc entry for file
    this.#index_file_document({name, content, longname, ...file_template})
    // parse source
    this.#parse_source(content, name);
  }

  #parse_source(content, name) {
    const parser = new SourceParser(content);
    parser.parse();
    const {tree, comments} = parser;
    // after parse hook
    this.#hook("source", tree);

    this.#parse_comments(tree, comments, name);
    this.#hook("comments", tree);
  }

  #parse_comments(tree, comments, name) {
    const parser = new CommentParser(tree, comments, name);
    for (const comment of parser.parse().comments) {
      this.#index_comment_document(comment);
    }
  }

  #index_file_document(data) {
    this.#index.push({__docId__: this.#index.length, ...data});
  }

  #index_comment_document(comment) {
    this.#index.push({__docId__: this.#index.length,
      memberof: comment.filename,
      ...create_format(comment)});
  }

  get index() {
    return this.#index;
  }
}
