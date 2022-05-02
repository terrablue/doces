const accepted = ["ClassDeclaration", "MethodDefinition"];

export default class CommentParser {
  constructor(tree, comments, filename) {
    this.tree = tree;
    this.original_comments = comments;
    this.filename = filename;
    this.comments = [];
    this.i = 0;
  }

  get current() {
    return this.original_comments[this.i];
  }

  parse() {
    this.traverse(this.tree, this.filename);
    return this;
  }

  traverse(node, filename) {
    //console.log("node.type", node.type, node);
    if (accepted.includes(node.type)) {
      const comment = {node, filename};
      if (this.class !== undefined && node.type !== "ClassDeclaration") {
        comment.class = this.class;
      }
      this.comments.push({...comment, ...this.current});
      this.i++;
      if (this.current === undefined) {
        return;
      }
    }

    if (node.type === "Program") {
      this.traverse(node.body[0], filename);
    }
    if (node.type === "ExportDefaultDeclaration") {
      this.traverse(node.declaration, filename);
    }
    if (node.type === "ClassDeclaration") {
      this.class = node;
      this.traverse(node.body, filename);
    }
    if (node.type === "ClassBody") {
      for (const child of node.body) {
        this.traverse(child, filename);
      }
    }
  }
}
