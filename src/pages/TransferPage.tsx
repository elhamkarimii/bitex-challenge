import { Alert, Button, Snackbar, TextField } from "@mui/material"
import { Contract, Signer, ethers } from "ethers";
import { useCallback, useEffect, useMemo, useState } from "react"
import { isValidEthereumAddress } from "../utils";

const TransferPage = () => {
  const [walletAddress, setWalletAddress] = useState<string>('')
  const [currentAccount, setCurrentAccount] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState<string>('')
  const [mintData, setMintData] = useState({
    mintedToken: '',
    mintedAmount: 0,
    tokenAddress: ''
  })

  const ethereum = (window as any).ethereum

  const provider = useMemo(() => new ethers.providers.Web3Provider(ethereum), [ethereum])
  const signer: Signer = provider.getSigner();
  const tokenAbi: any[] = [
    "function transfer(address recipient, uint256 amount) view returns (bool)"
  ]

  const tokenContract: Contract = new ethers.Contract(mintData.tokenAddress, tokenAbi, signer);

  useEffect(() => {
    const mintedToken = localStorage.getItem('mintedToken')
    const mintedAmount = localStorage.getItem('mintAmount')
    const tokenAddress = localStorage.getItem('tokenAddress')
    setMintData({
      mintedToken: mintedToken || '',
      mintedAmount: Number(mintedAmount),
      tokenAddress: tokenAddress || '',
    })
  }, [])

  const handleTransferToken = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (!isValidEthereumAddress(walletAddress)) {
        setError('error: The recipient’s wallet address is not valid.')
        return
      }

      try {
        if (!currentAccount) {
          throw new Error('No account available. Please connect MetaMask.') //todo handle error
        }

        const gasLimit = await tokenContract.estimateGas.transfer(ethers.utils.getAddress(walletAddress), mintData.mintedAmount);

        provider.on('error', (e: any) => {
          console.log('error', e);
        })
        // Request approval from MetaMask to send transaction
        const data: string = await ethereum.request({
          method: 'eth_sendTransaction',
          params: [
            {
              from: currentAccount,
              to: walletAddress,
              data: tokenContract.interface.encodeFunctionData('transfer', [ethers.utils.getAddress(walletAddress), ethers.utils.parseEther("1")]),
              gas: ethers.utils.hexlify(gasLimit),
            },
          ],
        })

        provider.once(data, () => {
          setSuccessMessage('Transfered successfully!')
        });

      }
      catch (err: any) {
        console.log('err', err)
        setError(`Error transfering tokens: ${err.message}`);
      }
    }
    , [currentAccount, ethereum, mintData.mintedAmount, provider, tokenContract.estimateGas, tokenContract.interface, walletAddress]
  )

  useEffect(() => {
    const fetchAccount = async () => {
      try {
        const accounts = await provider.send('eth_requestAccounts', []);
        setCurrentAccount(accounts[0] || null);
      } catch (err) {
        console.error('Error fetching accounts:', err);
      }
    };

    if (ethereum) {
      ethereum.on('accountsChanged', fetchAccount);
    }

    fetchAccount();

    return () => {
      if (ethereum) {
        ethereum.off('accountsChanged', fetchAccount);
      }
    };
  }, [ethereum, provider]);

  return (
    <div className="max-w-[800px] my-0 mx-auto text-center py-14 px-6">
      <h2 className="text-2xl font-bold mb-9">Transfer Token</h2>

      <form onSubmit={handleTransferToken} className="flex flex-col gap-4">
        <TextField
          value={walletAddress}
          onChange={(e) => setWalletAddress(e.target.value)}
          fullWidth
          label="recipient’s address"
          variant="outlined"
          color="primary"
        />
        <Button
          fullWidth
          variant="contained"
          type="submit"
          className="h-14"
        >
          Transfer Tokens
        </Button>
      </form>

      <Snackbar open={!!error} autoHideDuration={5000} onClose={() => setError('')}>
        <Alert onClose={() => setError('')} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>

      <Snackbar open={!!successMessage} autoHideDuration={5000} onClose={() => setSuccessMessage('')}>
        <Alert onClose={() => setSuccessMessage('')} severity="success" sx={{ width: '100%' }}>
          {successMessage}
        </Alert>
      </Snackbar>
    </div>
  )
}

export default TransferPage