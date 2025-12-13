"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cache = exports.NaisTeamsService = exports.OAUTH_JWT_AUDIENCE = exports.OAUTH_JWT_KEYSET = exports.OAUTH_JWT_ISSUER = exports.OAUTH_JWT_HEADER = exports.oauthForwardAuth = exports.IAP_JWT_ISSUER = exports.IAP_JWT_HEADER = exports.IAP_AUDIENCE = exports.googleIapAuth = void 0;
var google_iap_1 = require("./src/google-iap");
Object.defineProperty(exports, "googleIapAuth", { enumerable: true, get: function () { return __importDefault(google_iap_1).default; } });
Object.defineProperty(exports, "IAP_AUDIENCE", { enumerable: true, get: function () { return google_iap_1.IAP_AUDIENCE; } });
Object.defineProperty(exports, "IAP_JWT_HEADER", { enumerable: true, get: function () { return google_iap_1.IAP_JWT_HEADER; } });
Object.defineProperty(exports, "IAP_JWT_ISSUER", { enumerable: true, get: function () { return google_iap_1.IAP_JWT_ISSUER; } });
var oauth_fa_1 = require("./src/oauth-fa");
Object.defineProperty(exports, "oauthForwardAuth", { enumerable: true, get: function () { return __importDefault(oauth_fa_1).default; } });
Object.defineProperty(exports, "OAUTH_JWT_HEADER", { enumerable: true, get: function () { return oauth_fa_1.OAUTH_JWT_HEADER; } });
Object.defineProperty(exports, "OAUTH_JWT_ISSUER", { enumerable: true, get: function () { return oauth_fa_1.OAUTH_JWT_ISSUER; } });
Object.defineProperty(exports, "OAUTH_JWT_KEYSET", { enumerable: true, get: function () { return oauth_fa_1.OAUTH_JWT_KEYSET; } });
Object.defineProperty(exports, "OAUTH_JWT_AUDIENCE", { enumerable: true, get: function () { return oauth_fa_1.OAUTH_JWT_AUDIENCE; } });
var nais_teams_1 = require("./src/nais-teams");
Object.defineProperty(exports, "NaisTeamsService", { enumerable: true, get: function () { return nais_teams_1.NaisTeams; } });
var cache_1 = require("./src/cache");
Object.defineProperty(exports, "cache", { enumerable: true, get: function () { return __importDefault(cache_1).default; } });
__exportStar(require("./src/utils"), exports);
//# sourceMappingURL=index.js.map