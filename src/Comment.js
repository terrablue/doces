import tags from "./tags.json" assert {"type": "json"}

const trim = (text, tag) => minitrim(text
  .replace(new RegExp(`^${tag}`, "u"), () => ""));

const minitrim = text => text
  .replace("^\n", () => "")
  .replace("\n$", () => "")
  .trim();

export default class Comment {
  #text; #tags;

  constructor(text, type) {
    this.#text = text;
    this.#tags = {...tags.general, ...tags.special[type]};
  }

  parse()  {
    this.#text
      // @link appears in other tags and shouldn't be split into its own tag
      .replaceAll("@link", "&#64;link")
      .split("\n")
      .map(token => token.trim())
      .filter(token => token !== "" && token !== "*")
      .map(token => token.replace("* ", ""))
      .join("\n")
      .split("@")
      .map(tag => tag.replace("&#64;link", () => "@link"))
      .map(tag => this.parse_tag(tag));
    return this;
  }

  call_parse_function(description, default_tag, default_text) {
    const [parse_function, tag = default_tag, text = default_text] = description;
    this[parse_function](default_tag, tag, text);
  }

  parse_tag(text) {
    for (const [tag, description] of Object.entries(this.#tags)) {
      if (text.startsWith(tag)) {
        this.call_parse_function(description, tag, text);
        return;
      }
    }
    if (text.startsWith("param")) {
      this.add_param(text);
    } else {
      this.set_description(text);
    }
  }


  boolean(property) {
    this[property] = true;
  }

  string(tag, property, text) {
    this[property] = trim(text, property);
  }

  type(tag, property, text) {
    this.string(tag, property, text);
  }

  array(tag, property, text) {
    if (this[property] === undefined) {
      this[property] = [];
    }
    this[property].push(trim(text, tag));
  }

  array_identifier_description(tag, property, text) {
    if (this[property] === undefined) {
      this[property] = [];
    }
    this[property].push(this.parse_identifier_description(this.detag(text, tag)));
  }

  detag(text, tag) {
    return text.replace(new RegExp(`^${tag} (.*)`, "u"), (match, p1) => p1).replace("\n", "");
  }

  array_of_identifiers(tag, property, text) {
    if (this[property] === undefined) {
      this[property] = [];
    }
    this[property].push(text.replace(new RegExp(`^${tag}.*\\{(.*)\\}\n`, "u"),
      (match, p1) => p1));
  }

  types(tag, property, text) {
    this.array(tag, property, text);
  }

  parse_identifier_description(text) {
    const re = /^{(.+?)} (.*)$/g;
    const [, identifier, description] = [...text.matchAll(re)][0];
    return {
      types: [identifier],
      description,
    };
  }

  parse_type(text) {
    const re = /^{(\??)(\.\.\.?)(.+?)} (\[?[^-]*\]?)-(.*)$/g;
    const [, nullable, spread, types_string, name, description] = 
      [...text.matchAll(re)][0].map(t => t.trim());
    const types = types_string.split("|");
    const [original, match] = name.match(/^\[(.+?)\]?$/);
    const optional = original !== match;
    return {
      types: types,
      name: optional ? match : original,
      optional,
      spread: spread === "..." ? true : false,
      description,
      nullable: nullable === "?" ? true : null,
    }
  }

  add_param(tag) {
    if (this.params === undefined) {
      this.params = [];
    }
    this.params.push(tag.replace(/^param/u, () => ""));
  }

  add_example(example) {
    if (this.examples === undefined) {
      this.examples = [];
    }
    this.examples.push(example.replace(/^example\n/u, () => ""));
  }

  set_description(description) {
    this.description = minitrim(description);
  }

  static parse(text, type) {
    return new Comment(text, type).parse();
  }
}
