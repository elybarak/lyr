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

export function h<K extends keyof HTMLElementTagNameMap>(
    tag: K,
    props: { [name: string]: string },
    ...children: Child[]
): HTMLElementTagNameMap[K] {
    const element = document.createElement(tag);
    Object.assign(element, props);
    if (children) {
        element.append(...children);
    }
    return element;
}
