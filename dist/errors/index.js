"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssetAdapterError = exports.SDKValidationError = exports.YieldMathError = exports.ComplianceError = exports.VaultError = void 0;
class VaultError extends Error {
    code;
    constructor(message, code = 'ERR_VAULT_GENERIC') {
        super(message);
        this.name = 'VaultError';
        this.code = code;
        Object.setPrototypeOf(this, new.target.prototype);
    }
}
exports.VaultError = VaultError;
class ComplianceError extends VaultError {
    constructor(message, code = 'ERR_COMPLIANCE_FAILED') {
        super(message, code);
        this.name = 'ComplianceError';
    }
}
exports.ComplianceError = ComplianceError;
class YieldMathError extends VaultError {
    constructor(message, code = 'ERR_YIELD_MATH_FAILED') {
        super(message, code);
        this.name = 'YieldMathError';
    }
}
exports.YieldMathError = YieldMathError;
class SDKValidationError extends VaultError {
    constructor(message, code = 'ERR_VALIDATION_FAILED') {
        super(message, code);
        this.name = 'SDKValidationError';
    }
}
exports.SDKValidationError = SDKValidationError;
class AssetAdapterError extends VaultError {
    constructor(message, code = 'ERR_ASSET_ADAPTER_FAILED') {
        super(message, code);
        this.name = 'AssetAdapterError';
    }
}
exports.AssetAdapterError = AssetAdapterError;
