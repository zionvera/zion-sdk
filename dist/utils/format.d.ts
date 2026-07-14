/**
* Formats a raw contract balance (e.g., stroops) into a readable token amount.
* Safely uses string manipulation to avoid JavaScript floating-point precision loss.
* * @param rawAmount - The raw balance as a string, number, or bigint
* @param decimals - The number of decimals the token uses (defaults to 7 for Stellar)
* @returns The formatted, human-readable balance string
* * @example
* formatTokenBalance('15000000', 7) // Returns '1.5'
* formatTokenBalance('1000000000000000000', 18) // Returns '1'
*/
export declare function formatTokenBalance(rawAmount: string | number | bigint, decimals?: number): string;
