import { generateWalletByIndex } from "./chain.js";

export const refundBalance = (index, toAddress) => {
  const privateKey = generateWalletByIndex(index);
  
};
