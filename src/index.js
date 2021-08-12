class HTMLFetch extends HTMLElement {
  constructor() {
    super();
  }

  async connectedCallback() {
    const path = this.getAttribute("path");
    const headers = this.getAttribute("headers");
    try {
      const resp = await fetch(path, {
        method: "GET",
        headers: headers ? JSON.parse(headers) : undefined,
      });
      const text = await resp?.text();
      this.innerHTML = resp?.status + " " + text;
    } catch (e) {
      this.innerHTML = JSON.stringify(e);
    }
  }
}
customElements.define("x-fetch", HTMLFetch);
