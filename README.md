# TODO
1. create guarantees, like type annotations, for custom element. like for `HTMLGroupElement`, somehow guarantee that it when `connectedCallback` is called, `this.object` is a javascript object.
2. now all thw type branching is done in runtime. I have to add annotations, for strings that are actually image URLs. in the future, type branching can also be done in compile time.
