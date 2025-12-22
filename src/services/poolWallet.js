import {
  estimateFee,
  generateWalletByIndex,
  getWalletBalance,
  sendWalletFund,
} from "./chain.js";

export const refundBalance = async (index, toAddress) => {
  const wallet = generateWalletByIndex(index);
  const balance = await getWalletBalance(wallet.address);
  const fee = await estimateFee(wallet.address, toAddress);
  const value = balance - fee;
  if (!(value < 0)) await sendWalletFund(to, value, wallet.privateKey);
  return { succes: true };
};
