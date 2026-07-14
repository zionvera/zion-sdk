"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatTokenBalance = formatTokenBalance;
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
function formatTokenBalance(rawAmount, decimals = 7) {
    let amountStr = rawAmount.toString();
    if (amountStr === '0' || amountStr === '')
        return '0';
    const isNegative = amountStr.startsWith('-');
    if (isNegative)
        amountStr = amountStr.slice(1);
    // Pad with leading zeros if the amount string is shorter than the decimals required
    if (amountStr.length <= decimals) {
        amountStr = amountStr.padStart(decimals + 1, '0');
    }
    const integerPart = amountStr.slice(0, -decimals);
    let fractionalPart = amountStr.slice(-decimals);
    // Strip trailing zeros from the fractional part
    fractionalPart = fractionalPart.replace(/0+$/, '');
    let result = fractionalPart.length > 0 ? `${integerPart}.${fractionalPart}` : integerPart;
    return isNegative ? `-${result}` : result;
}
