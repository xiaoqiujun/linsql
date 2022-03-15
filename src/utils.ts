type dataType = "string" | "number" | "bigint" | "boolean" | "symbol" | "undefined" | "object" | "function";

const toString = Object.prototype.toString;
const hasOwnProperty = Object.prototype.hasOwnProperty;
export const typeOf = (v: any, type: dataType): boolean => {
	return typeof v === type;
};

export const isStr = (v: any): boolean => {
	return toString.call(v) === "[object String]";
};
export const isInt = (v: any): boolean => {
	return toString.call(v) === "[object Number]" && !isNaN(v);
};
export const isNaN = (v: any): boolean => {
	if (!Number.isNaN) {
		return typeOf(v, "number") && window.isNaN(v);
	}
	return Number.isNaN(v);
};
export const isBool = (v: any): boolean => {
	return toString.call(v) === "[object Boolean]";
};

export const isNull = (v: any): boolean => {
	return toString.call(v) === "[object Null]";
};
export const isUndefined = (v: any): boolean => {
	return toString.call(v) === "[object Undefined]";
};

export const isArray = (v: any): boolean => {
	return v.constructor === Array && toString.call(v) === "[object Array]";
};
export const isObj = (v: any): boolean => {
	return toString.call(v) === "[object Object]";
};
export const isDate = (v: any): boolean => {
	return toString.call(v) === "[object Date]";
};
export const isFn = (v: any): boolean => {
	return toString.call(v) === "[object Function]";
};
export const isRegExp = (v: any): boolean => {
	return toString.call(v) === "[object RegExp]";
};
export const isSymbol = (v: any): boolean => {
	return toString.call(v) === "[object Symbol]";
};
export const isPrimitive = (v: any): boolean => {
	return typeOf(v, "string") || typeOf(v, "number") || typeOf(v, "symbol") || typeOf(v, "boolean");
};
export const empty = (v:unknown):boolean => {
	if(isUndefined(v) || isNull(v) || v === '') return true
	return false
}

export const has = (obj: any, v: any): boolean => {
	if (!isObj(obj)) return false;
	return hasOwnProperty.call(obj, v);
};
export const toKeys = (obj: any): Array<string> => {
	if (!isObj(obj)) return [];
	let keys: Array<string> = [];
	for (let key in obj) {
		keys.push(key);
	}
	return keys;
};
export const toValues = (obj: any): Array<any> => {
	if (!isObj(obj)) return [];
	let values: Array<any> = [];
	for (let key in obj) {
		values.push(obj[key]);
	}
	return values;
};
export const toUpperCase = (str: string): string => {
	let _arr: string[] = str.split("");
	let _ascii: number;
	let _max: number = "z".charCodeAt(0);
	let _min: number = "a".charCodeAt(0);
	for (let i: number = 0; i < _arr.length; i++) {
		_ascii = _arr[i].charCodeAt(0);
		if (_max >= _ascii && _min <= _ascii) {
			_arr[i] = String.fromCharCode(_ascii - 32);
		}
	}
	return _arr.join("");
};
export const toLowerCase = (str: string): string => {
	let _arr: string[] = str.split("");
	let _ascii: number;
	let _max: number = "Z".charCodeAt(0);
	let _min: number = "A".charCodeAt(0);
	for (let i: number = 0; i < _arr.length; i++) {
		_ascii = _arr[i].charCodeAt(0);
		if (_max >= _ascii && _min <= _ascii) {
			_arr[i] = String.fromCharCode(_ascii + 32);
		}
	}
	return _arr.join("");
};
export const noop = function () {};
export const each = (collection: any, iteratee: Function) => {
	if (!isFn(iteratee)) iteratee = noop;
	let result: Array<any> = [];
	if (isObj(collection)) result = toKeys(collection);
	else if (isArray(collection)) result = collection;
	else result = [collection];
	let length: number = result.length;
	let index: number = 0;
	while (index < length) {
		if (isObj(collection)) {
			iteratee.call(null, collection[result[index]], result[index], collection);
		} else {
			iteratee.call(null, result[index], index, collection);
		}
		index++;
	}
};
