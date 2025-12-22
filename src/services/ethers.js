import { ethers, HDNodeWallet, Mnemonic } from "ethers";
import Static from "../schemas/static.js";

const RPC_URL = "https://rpc1-be.vercel.app/";
const provider = new ethers.JsonRpcProvider(RPC_URL);

export const makeRandomAddress = async () => {
  const li = await Static.findOne({ label: "lastIndex" });
  let value = 1;
  if (!li) {
    await Static.create({ label: "lastIndex", value });
  } else {
    value = li.value + 1;
    await Static.findOneAndUpdate({ label: "lastIndex" }, { value });
  }
  const phrase = "test test test test test test test test test test test ball";
  const mnemonic = Mnemonic.fromPhrase(phrase);
  const wallet = HDNodeWallet.fromMnemonic(mnemonic, `m/44'/60'/0'/0/${value}`);
  return { address: wallet.address, index: value };
};

export const getWalletBalance = async (address) => {
  const balanceWei = await provider.getBalance(address);
  const balanceEth = ethers.formatEther(balanceWei);
  return balanceEth;
};

export const makeWalletAddress = (address) => {
  try {
    return ethers.getAddress(address);
  } catch (error) {
    return null;
  }
};
