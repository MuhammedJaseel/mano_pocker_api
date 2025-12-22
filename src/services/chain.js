import { ethers, HDNodeWallet, Mnemonic } from "ethers";
import Static from "../schemas/static.js";

const RPC_URL = "https://rpc1-be.vercel.app/";
export const provider = new ethers.JsonRpcProvider(RPC_URL);
export const seedPhrase =
  "test test test test test test test test test test test ball";

export const makeRandomAddress = async () => {
  const li = await Static.findOne({ label: "lastIndex" });
  let value = 1;
  if (!li) {
    await Static.create({ label: "lastIndex", value });
  } else {
    value = li.value + 1;
    await Static.findOneAndUpdate({ label: "lastIndex" }, { value });
  }

  const mnemonic = Mnemonic.fromPhrase(seedPhrase);
  const wallet = HDNodeWallet.fromMnemonic(mnemonic, `m/44'/60'/0'/0/${value}`);
  return { address: wallet.address, index: value };
};

export const generateWalletByIndex = (index) => {
  const mnemonic = Mnemonic.fromPhrase(seedPhrase);
  const wallet = HDNodeWallet.fromMnemonic(mnemonic, `m/44'/60'/0'/0/${index}`);
  return wallet.privateKey;
};

export const sendWalletFund = async (pKey, to) => {
  const startT = new Date().getTime();
  const wallet = new ethers.Wallet(pKey, provider);

  const tx = await wallet.sendTransaction({
    to: "0xfFa0a749c4a220299aa806e8ebA7674C6c8AE5B0", // PC DEV
    // value: ethers.parseEther(String(1000000 - 0.66528)), // convert ETH to wei
    // value: ethers.parseEther(String(100000000 - 0.66528)), // convert ETH to wei
    value: ethers.parseEther(String(0)), // convert ETH to wei
  });

  console.log((new Date().getTime() - startT) / 1000);
  console.log("TX Hash:", tx.hash);

  const receipt = await tx.wait();
  console.log((new Date().getTime() - startT) / 1000);
  console.log("Confirmed in block:", receipt.blockNumber);
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
