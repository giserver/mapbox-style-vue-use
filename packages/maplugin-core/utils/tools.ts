export namespace Tools {
    /**
 * 创建uuid
 * @returns uuid
 */
    export function uuid(options: {
        /**
         * 大写
         * 默认 : false
         */
        uppercase?: boolean;
        /**
         * 带分隔符 -
         * 默认 : true
         */
        separator?: boolean;
    } = {}) {
        let _a;
        (_a = options.separator) !== null && _a !== void 0 ? _a : (options.separator = true);
        let d = new Date().getTime();
        let result = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
            const r = (d + Math.random() * 16) % 16 | 0;
            d = Math.floor(d / 16);
            return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
        });
        if (options.uppercase)
            result = result.toLocaleUpperCase();
        if (!options.separator)
            result = result.replace(/-/g, '');
        return result;
    }
}