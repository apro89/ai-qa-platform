export const required = <T>(value: T | undefined, name: string): T => { if (value === undefined) throw new Error(`${name} is required`); return value; };
