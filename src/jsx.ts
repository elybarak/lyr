export type Child = string | Node;

export namespace h {
    export namespace JSX {
        export interface ElementChildrenAttribute {
            children?: Child | Child[];
        }

        export type JSXElement<T extends HTMLElement> = Partial<
            Omit<T, keyof ElementChildrenAttribute>
        > &
            ElementChildrenAttribute;

        export type IntrinsicElements = {
            [P in keyof HTMLElementTagNameMap]: JSXElement<
                HTMLElementTagNameMap[P]
            >;
        };

        export type Element = HTMLElement;
    }
}

type HTagParams<K extends keyof HTMLElementTagNameMap> = [
    tag: K,
    props: { [name: string]: string },
    ...children: Child[]
];

type HCompParams<F extends (...args: any[]) => any> = [
    tag: F,
    props: Parameters<F>[0],
    ...children: Child[]
];

export function h<K extends keyof HTMLElementTagNameMap>(
    ...params: HTagParams<K>
): HTMLElementTagNameMap[K];

export function h<F extends (...args: any[]) => any>(
    ...params: HCompParams<F>
): ReturnType<F>;

export function h<
    K extends keyof HTMLElementTagNameMap,
    F extends (...args: any[]) => any
>(
    ...params: HTagParams<K> | HCompParams<F>
): HTMLElementTagNameMap[K] | ReturnType<F> {
    if (typeof params[0] === 'function') {
        const [tag, props, ...children] = params;

        const propsWithChildren = { ...props, children: children.flat() };
        const res = tag.apply(propsWithChildren, propsWithChildren);
        return res;
    } else {
        const [tag, props, ...children] = params;

        const element = document.createElement(tag);
        Object.assign(element, props);
        if (children) {
            element.append(...children.flat());
        }
        return element;
    }
}
