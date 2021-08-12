class HTMLFetch extends HTMLElement {
  constructor() {
    super();
  }

  async connectedCallback() {
    const path = this.getAttribute("path");
    const headers = this.getAttribute("headers");
    const attr = [...this.attributes].map((x) => x.name).join(",");
    console.log(attr);
    console.log(path);
    console.log(headers);
    try {
      const resp = await fetch(path, {
        method: "GET",
        headers: JSON.parse(headers),
      });

      const text = await resp?.text();
      this.innerHTML = resp?.status + " " + text;
    } catch (e) {
      this.innerHTML = JSON.stringify(e);
    }
  }
}
customElements.define("x-fetch", HTMLFetch);
