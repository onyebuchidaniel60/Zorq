process.env.APP_ORIGIN ??= "http://localhost:3100";
process.env.NEXT_PUBLIC_APP_URL ??= "http://localhost:3100";
process.env.SESSION_SECRET ??= "test-session-secret-at-least-32-bytes-long";
process.env.RATE_LIMIT_SECRET ??= "test-rate-limit-secret-at-least-32-bytes-long";
process.env.DATABASE_URL ??= "postgresql://test:test@localhost:5432/test";
process.env.PORTALDOT_CHAIN_ID ??= "420420777";
process.env.PORTALDOT_EVM_RPC_URL ??= "https://test-evm-rpc-v3.portaldot.dev";
process.env.PORTALDOT_CONFIRMATION_DEPTH ??= "6";
