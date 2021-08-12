class HTMLFetch extends HTMLElement {
				constructor () {
								super();
				}
				
				connectedCallback() {
								const path = this.getAttribute("path");
								const headers = this.getAttribute("headers");
							 const attr = [...this.attributes].map(x => x.name).join(",");
							 console.log(attr)
								console.log(path)
								console.log(headers)
								fetch(path, {
												method: "GET",
												headers: JSON.parse(headers)
								})
								.then(x => x.text())
								.catch(x => x.status)
								.finally(x => this.contentHTML = x || 'ha');
				}
}
customElements.define("x-fetch", HTMLFetch);
