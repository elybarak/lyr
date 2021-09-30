import { _ } from './utils';

import { h } from './jsx';

const bla = [
    {
        source: 'response',
        meta: [
            {
                source: 'hits',
                meta: {
                    $array: [
                        {
                            source: 'result',
                            meta: [
                                { source: 'header_image_url', meta: 'image' },
                                { source: 'api_path', meta: 'bla' },
                            ],
                        },
                    ],
                },
            },
        ],
    },
];

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

    #result: HTMLElement;

    response: unknown;

    constructor() {
        super();

        this.#result = (
            <div style="display: block; transition: opacity .4s ease"></div>
        );
    }

    onmeta: (meta: 'dynamic' | 'bla') => unknown = () => undefined;

    connectedCallback() {
        this.addEventListener('click', this.handleClick.bind(this));
        window.addEventListener('hashchange', this.handleHashChange.bind(this));
        this.append(
            <form
                submit={(event: Event) => {
                    event.preventDefault();
                    if (event.target instanceof HTMLFormElement) {
                        console.log(new FormData(event.target).entries());
                    }
                }}>
                <XThing value={bla} meta={metaFromDynamicJS(bla)} />
                <button type="submit" className="btn btn-primary">
                    Submit
                </button>
            </form>,
            <hr />,
            <div className="container p-3">
                <div className="form-check">
                    <input
                        name="meta-radio"
                        value="defined"
                        className="form-check-input"
                        type="radio"
                        checked
                        id="defined-meta-radio"
                        onchange={() => this.onmeta('bla')}
                    />
                    <label
                        className="form-check-label"
                        htmlFor="defined-meta-radio">
                        Defined Meta
                    </label>
                </div>
                <div className="form-check">
                    <input
                        name="meta-radio"
                        value="dynamic"
                        className="form-check-input"
                        type="radio"
                        id="dynamic-meta-radio"
                        onchange={() => this.onmeta('dynamic')}
                    />
                    <label
                        className="form-check-label"
                        htmlFor="dynamic-meta-radio">
                        Dynamic Meta
                    </label>
                </div>
            </div>,
            <hr />,
            this.#result
        );
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
        this.#result.animate({ opacity: ['1', '0'] }, 400);
        this.#result.innerHTML = '';
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
            this.onmeta = m => {
                this.#result.animate({ opacity: ['1', '0'] }, 400);
                this.#result.innerHTML = '';
                const meta = m === 'bla' ? bla : metaFromDynamicJS(json);
                const thing = <XThing meta={meta} value={json} />;
                this.#result.appendChild(thing);
                this.#result.animate({ opacity: ['0', '1'] }, 400);
                // this.#result.style.opacity = '1';
            };
            this.onmeta('bla');
        } else {
            this.innerHTML = mimeType;
            this.#result.style.opacity = '1';
        }
    }
}
customElements.define('x-data', HTMLXDataElement);

type MetaSource = {
    source: string;
    meta: Meta;
};
type MetaObject = MetaSource[];
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
        if (value.length < 1) return 'unknown';
        else return { $array: metaFromDynamicJS(value[0]) };
    } else if (typeof value === 'object') {
        return Object.entries(value).map(
            ([source, value]): MetaSource => ({
                source,
                meta: metaFromDynamicJS(value),
            })
        );
    } else if (typeof value === 'string') {
        return 'string';
    } else if (typeof value === 'number') {
        return 'number';
    } else return 'unknown';
}

type MetaParams<M extends Meta = Meta> = {
    label?: string;
    meta: M;
    value: unknown;
    prefix?: string;
};

function XObject(params: MetaParams<MetaObject>) {
    return (
        <div className="p-3">
            {params.label && <h6 innerHTML={params.label} />}
            <div className="d-flex flex-wrap gap-3">
                {params.meta.map(ms => (
                    <XThing
                        label={ms.source}
                        meta={ms.meta}
                        value={params.value?.[ms.source]}
                        prefix={
                            (params.prefix ? params.prefix + '.' : '') +
                            ms.source
                        }
                    />
                ))}
            </div>
        </div>
    );
}

function XArray(params: MetaParams<MetaArray>) {
    if (!Array.isArray(params.value)) throw JSON.stringify(params.value);
    let _1: HTMLElement;

    const child = (item: unknown) => (
        <li className="list-group-item">
            <XThing
                prefix={params.prefix}
                meta={params.meta.$array}
                value={item}
            />
        </li>
    );

    return (
        <div className="p-3">
            <h6>
                {params.label && <span innerHTML={params.label} />}
                <i
                    className="bi-plus"
                    onclick={() => _1.appendChild(child(null))}
                />
            </h6>
            {
                (_1 = (
                    <ol className="list-group list-group-ordered">
                        {params.value.map(child)}
                    </ol>
                ))
            }
        </div>
    );
}

customElements.define(
    'x-thing',
    class extends HTMLElement {
        constructor() {
            super();
        }
        connectedCallback() {
            const value = JSON.parse(this.getAttribute('value'));
            this.appendChild(
                <XThing meta={metaFromDynamicJS(value)} value={value} />
            );
        }
    }
);

function XThing(params: MetaParams) {
    const meta = params.meta; //metaFromDynamicJS(this.value);
    return typeof meta === 'object' && '$array' in meta ? (
        <XArray
            {...params}
            value={params.value as unknown[]}
            meta={meta as MetaArray}
        />
    ) : Array.isArray(meta) ? (
        <XObject {...params} meta={meta as MetaObject} />
    ) : meta === 'bla' ? (
        <a href={'#' + params.value} className="btn btn-outline-primary">
            <i className="bi-link-45deg" />
            <span innerHTML={params.label} />
        </a>
    ) : meta === 'image' ? (
        <figure className="figure">
            <img
                src={params.value as string}
                className="figure-img"
                style="width: 10em; height: 10em"
            />
            <figcaption className="figure-caption" innerText={params.label} />
        </figure>
    ) : typeof meta === 'string' ? (
        <div className="d-inline-block form-floating">
            <input
                id={params.prefix}
                name={params.prefix}
                className="form-control"
                value={(params.value as string) || ''}
            />
            {params.label && (
                <label
                    className="form-label"
                    htmlFor={params.prefix}
                    innerHTML={params.label}
                />
            )}
        </div>
    ) : typeof meta === 'number' ? (
        <div className="d-inline-block form-floating">
            <input
                id={params.prefix}
                name={params.prefix}
                type="number"
                className="form-control"
                value={((params.value as number) || 0).toString()}
            />
            {params.label && (
                <label
                    className="form-label"
                    htmlFor={params.prefix}
                    innerHTML={params.label}
                />
            )}
        </div>
    ) : (
        <code>this is not an object</code>
    );
}
