interface Callback<T> {
    (self: T): unknown;
}

interface RecursiveCallback<T> {
    (callback: Callback<T>): RecursiveCallback<T>;
}

function inner<T>(callback: Callback<T>, self: T): RecursiveCallback<T> {
    callback(self);
    return function (_callback: Callback<T>) {
        return inner<T>(_callback, self);
    };
}

export function _<T>(self: T): RecursiveCallback<T> {
    return (_callback: Callback<T>) => inner(_callback, self);
}
