export declare class VaultError extends Error {
    code: string;
    constructor(message: string, code?: string);
}
export declare class ComplianceError extends VaultError {
    constructor(message: string, code?: string);
}
export declare class YieldMathError extends VaultError {
    constructor(message: string, code?: string);
}
export declare class SDKValidationError extends VaultError {
    constructor(message: string, code?: string);
}
export declare class AssetAdapterError extends VaultError {
    constructor(message: string, code?: string);
}
