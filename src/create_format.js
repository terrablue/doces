import Comment from "./Comment.js";
import package_json from "../package.json" assert {"type": "json"}

const class_template = {
  kind: "class",
  static: true,
  access: null,
  export: true,
  interface: false,
};

const constructor_template = {
  kind: "constructor",
  name: "constructor",
};

const method_template = {
  generator: false,
  async: false,
  static: false,
  access: null,
};

const MethodDefinition = {
  constructor: comment => ({
    ...constructor_template,
    longname: `${comment.filename}~${comment.class.id.name}#constructor`,
    memberof: `${comment.filename}~${comment.class.id.name}`,
  }),
  method: () => ({}),
};

const types = {
  ClassDeclaration: comment => {
    const {name} = comment.node.id;
    return {
      ...class_template,
      name,
      longname: `${comment.filename}~${name}`,
      importPath: `${package_json.name}/${comment.filename}`,
      importStyle: name,
      lineNumber: comment.node.loc.start.line,
      ...Comment.parse(comment.text, "class"),
    };
  },
  MethodDefinition: comment => ({
    lineNumber: comment.node.loc.start.line,
    ...method_template,
    ...MethodDefinition[comment.node.kind](comment),
    ...Comment.parse(comment.text, "function"),
  }),
};

export default comment => types[comment.node.type](comment);
