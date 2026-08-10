export class VaultError extends Error {
  public code: string;
  constructor(message: string, code: string = 'ERR_VAULT_GENERIC') {
    super(message);
    this.name = 'VaultError';
    this.code = code;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ComplianceError extends VaultError {
  constructor(message: string, code: string = 'ERR_COMPLIANCE_FAILED') {
    super(message, code);
    this.name = 'ComplianceError';
  }
}

export class YieldMathError extends VaultError {
  constructor(message: string, code: string = 'ERR_YIELD_MATH_FAILED') {
    super(message, code);
    this.name = 'YieldMathError';
  }
}

export class SDKValidationError extends VaultError {
  constructor(message: string, code: string = 'ERR_VALIDATION_FAILED') {
    super(message, code);
    this.name = 'SDKValidationError';
  }
}

export class AssetAdapterError extends VaultError {
  constructor(message: string, code: string = 'ERR_ASSET_ADAPTER_FAILED') {
    super(message, code);
    this.name = 'AssetAdapterError';
  }
}
