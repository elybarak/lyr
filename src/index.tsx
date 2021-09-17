import { _ } from './utils';

import { h } from './jsx';

class HTMLXDataElement extends HTMLElement {
    get base() {
        return this.getAttribute('base');
    }
    get query() {
        return this.getAttribute('query');
    }
    get path() {
        return this.getAttribute('path');
    }
    get headers() {
        return this.getAttribute('headers');
    }
    get meta() {
        return JSON.parse(this.getAttribute('meta'));
    }

    constructor() {
        super();
    }

    connectedCallback() {
        this.addEventListener('click', this.handleClick.bind(this));
        window.addEventListener('hashchange', this.handleHashChange.bind(this));
        this.fetch();
    }

    disconnectedCallback() {
        this.removeEventListener('click', this.handleClick);
        window.removeEventListener('hashchange', this.handleHashChange);
    }

    handleClick(event: MouseEvent) {
        // for (const target of event.composedPath()) {
        //   if (target instanceof HTMLAnchorElement) {
        //     event.preventDefault();
        //     event.stopPropagation();
        //     const url = new URL(target.href);
        //     this.fetch(url.pathname);
        //     break;
        //   }
        // }
    }

    handleHashChange() {
        this.fetch(location.hash.substring(1, location.hash.length));
    }

    async fetch(path?: string) {
        this.innerHTML = '';
        const url = new URL(this.base + (path ?? this.path));
        const [key, value] = this.query.split('='); // HACK
        url.searchParams.set(key, value);
        const resp = await fetch(url.toString(), {
            method: 'GET',
            headers: this.headers ? JSON.parse(this.headers) : undefined,
        });
        const contentType = resp.headers.get('Content-Type');
        const contentTypeArray = contentType.split(';');
        const mimeType = contentTypeArray[0];
        if (mimeType === 'application/json') {
            const json = await resp.json();
            const thing = <XThing meta={this.meta} value={json} />;
            this.appendChild(thing);
        } else this.innerHTML = mimeType;
    }
}
customElements.define('x-data', HTMLXDataElement);

type MetaObject = { [key: string]: Meta };
type MetaArray = { $array: Meta };
type Meta =
    | 'unknown'
    | 'bla'
    | 'image'
    | 'number'
    | 'string'
    | MetaObject
    | MetaArray;

function metaFromDynamicJS(value: unknown): Meta {
    if (Array.isArray(value)) {
        // TODO: non-homogenous arrays}
        if (value.length < 1) return 'unknown';
        else return { $array: metaFromDynamicJS(value[0]) };
    } else if (typeof value === 'object') {
        return Object.fromEntries(
            Object.entries(value).map(([key, value]) => [
                key,
                metaFromDynamicJS(value),
            ])
        );
    } else if (typeof value === 'string') {
        return 'string';
    } else if (typeof value === 'number') {
        return 'number';
    } else return 'unknown';
}

function XObject(this: { label?: string; meta: MetaObject; value: unknown }) {
    return (
        <div className="container p-3">
            {this.label && <h6 innerHTML={this.label} />}
            <div className="d-flex flex-wrap gap-3">
                {Object.entries(this.meta).map(([label, meta]) => (
                    <XThing {...{ label, meta }} value={this.value[label]} />
                ))}
            </div>
        </div>
    );
}

function XArray(this: { label?: string; meta: MetaArray; value: unknown[] }) {
    return (
        <div className="container p-3">
            {this.label && <h6 innerHTML={this.label} />}
            <ol className="list-group list-group-ordered">
                {this.value.map(item => (
                    <li className="list-group-item">
                        <XThing meta={this.meta.$array} value={item} />
                    </li>
                ))}
            </ol>
        </div>
    );
}

function XThing(this: {
    label?: string;
    meta: Meta;
    value: unknown;
    _id?: string;
}) {
    this._id = Math.random().toString(36);
    const meta = this.meta; //metaFromDynamicJS(this.value);
    return typeof meta === 'object' && '$array' in meta ? (
        <XArray {...this} />
    ) : typeof meta === 'object' ? (
        <XObject {...this} />
    ) : meta === 'bla' ? (
        <a href={'#' + this.value} className="btn btn-outline-primary">
            <i className="bi-link-45deg" />
            <span innerHTML={this.label} />
        </a>
    ) : meta === 'image' ? (
        <figure className="figure">
            <img
                src={this.value as string}
                className="figure-img img-thumbnail"
            />
            <figcaption className="figure-caption" innerText={this.label} />
        </figure>
    ) : typeof meta === 'string' ? (
        <div className="d-inline-block form-floating">
            <input
                id={this._id}
                className="form-control"
                value={this.value as string}
            />
            {this.label && (
                <label
                    className="form-label"
                    htmlFor={this._id}
                    innerHTML={this.label}
                />
            )}
        </div>
    ) : typeof meta === 'number' ? (
        <div className="d-inline-block form-floating">
            <input
                id={this._id}
                type="number"
                className="form-control"
                value={(this.value as number).toString()}
            />
            {this.label && (
                <label
                    className="form-label"
                    htmlFor={this._id}
                    innerHTML={this.label}
                />
            )}
        </div>
    ) : (
        <code>this is not an object</code>
    );
}
