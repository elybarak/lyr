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
        try {
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
                const thing = document.createElement(
                    'x-thing'
                ) as HTMLThingElement;
                thing.meta = this.meta;
                thing.value = json;
                this.appendChild(thing);
            } else this.innerHTML = mimeType;
        } catch (e) {
            this.innerHTML = JSON.stringify(e);
        }
    }
}
customElements.define('x-data', HTMLXDataElement);

type Meta =
    | 'unknown'
    | 'bla'
    | 'image'
    | 'number'
    | 'string'
    | { [key: string]: Meta }
    | { $array: Meta };

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

class HTMLThingElement extends HTMLElement {
    label: string;
    value: any;
    _id?: string;

    get meta(): Meta {
        return this.getAttribute('meta')
            ? JSON.parse(this.getAttribute('meta'))
            : undefined;
    }
    set meta(value: Meta) {
        value && this.setAttribute('meta', JSON.stringify(value));
    }

    constructor() {
        super();
    }

    array(itemMeta: Meta) {
        this.classList.add('container', 'd-block', 'p-3');
        if (this.label) {
            const label = document.createElement('h6');
            label.innerHTML = this.label;
            label.innerHTML = this.label;
            this.appendChild(label);
        }

        const list = document.createElement('ol', {
            is: 'x-list',
        }) as HTMLListElement;
        list.meta = itemMeta;
        list.items = this.value;
        this.appendChild(list);
    }

    object(meta: Meta) {
        this.classList.add('container', 'd-block', 'p-3');
        this.label &&
            _(document.createElement('h6'))(_ => (_.innerHTML = this.label))(
                _ => this.appendChild(_)
            );

        _(document.createElement('div'))(_ =>
            _.classList.add('d-flex', 'flex-wrap', 'gap-3')
        )(_1 => {
            for (const [key, value] of Object.entries(this.value || {})) {
                _(document.createElement('x-thing') as HTMLThingElement)(
                    _ => (_.meta = this.meta?.[key])
                )(_ => (_.label = key))(_ => (_.value = value))(_ =>
                    _1.appendChild(_)
                );
            }
        })(_ => this.appendChild(_));
    }

    connectedCallback() {
        this._id = Math.random().toString(36);
        const meta = metaFromDynamicJS(this.value);
        if (typeof meta === 'object' && '$array' in meta) {
            this.array(meta.$array);
        } else if (typeof meta === 'object') {
            this.object(meta);
        } else if (meta === 'bla') {
            _(document.createElement('a'))(_ => (_.href = '#' + this.value))(
                _ => _.classList.add('btn', 'btn-outline-primary')
            )(_1 =>
                _(document.createElement('i'))(_ =>
                    _.classList.add('bi-link-45deg')
                )(_ => _1.appendChild(_))
            )(_1 =>
                _(document.createElement('span'))(
                    _ => (_.innerHTML = this.label)
                )(_ => _1.appendChild(_))
            )(_ => this.appendChild(_));
        } else if (meta === 'image') {
            _(document.createElement('figure'))(_ => _.classList.add('figure'))(
                _1 =>
                    _(document.createElement('img'))(_ => (_.src = this.value))(
                        _ => _.classList.add('figure-img', 'img-thumbnail')
                    )(_ => _1.appendChild(_))
            )(_1 =>
                _(document.createElement('figcaption'))(_ =>
                    _.classList.add('figure-caption')
                )(_ => (_.innerText = this.label))(_ => _1.appendChild(_))
            )(_ => this.appendChild(_));
        } else if (typeof meta === 'string') {
            this.style.display = 'inline-block';
            this.classList.add('form-floating');

            const input = document.createElement('input');
            input.id = this._id;
            input.classList.add('form-control');
            input.value = this.value;
            this.appendChild(input);

            if (this.label) {
                this.appendChild(
                    <label
                        className="form-label"
                        htmlFor={this._id}
                        innerHTML={this.label}
                    />
                );
            }
        } else if (typeof meta === 'number') {
            this.style.display = 'inline-block';
            this.classList.add('form-floating');

            const input = document.createElement('input');
            input.id = this._id;
            input.type === 'number';
            input.classList.add('form-control');
            input.value = this.value.toString();
            this.appendChild(input);

            if (this.label) {
                const label = document.createElement('label');
                label.classList.add('form-label');
                label.htmlFor = this._id;
                label.innerHTML = this.label;
                this.appendChild(label);
            }
        } else {
            this.innerHTML = 'this is not an object';
        }
    }
}
customElements.define('x-thing', HTMLThingElement);

class HTMLListElement extends HTMLOListElement {
    meta?: any;
    items: any[];

    constructor() {
        super();
    }

    connectedCallback() {
        this.classList.add('list-group', 'list-group-numbered');
        for (const item of this.items) {
            const itemElement = document.createElement('li', {
                is: 'x-list-item',
            }) as HTMLListItemElement;
            itemElement.meta = this.meta;
            itemElement.item = item;
            this.appendChild(itemElement);
        }
    }
}
customElements.define('x-list', HTMLListElement, { extends: 'ol' });

class HTMLListItemElement extends HTMLLIElement {
    meta: any;
    item: any;

    constructor() {
        super();
    }

    connectedCallback() {
        this.classList.add('list-group-item');
        const itemThing = document.createElement('x-thing') as HTMLThingElement;
        itemThing.meta = this.meta;
        itemThing.value = this.item;
        this.appendChild(itemThing);
    }
}
customElements.define('x-list-item', HTMLListItemElement, { extends: 'li' });
