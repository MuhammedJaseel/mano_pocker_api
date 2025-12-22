import {
  estimateFee,
  generateWalletByIndex,
  getWalletBalance,
  sendWalletFund,
} from "./chain.js";

export const refundBalanceAfter = async (index, toAddress, after) => {
  const wallet = generateWalletByIndex(index);
  const balance = await getWalletBalance(wallet.address);
  const fee = await estimateFee(wallet.address, toAddress);
  const value = balance - fee - after;
  if (!(value < 0)) await sendWalletFund(toAddress, value, wallet.privateKey);
};
