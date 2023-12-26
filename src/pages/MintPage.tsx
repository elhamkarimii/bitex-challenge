import { Alert, Button, Snackbar, TextField } from '@mui/material';
import { ethers, Contract, Signer } from 'ethers';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const MintPage = () => {
  const [amountToMint, setAmountToMint] = useState('');
  const [error, setError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [currentAccount, setCurrentAccount] = useState<string | null>(null);

  const navigate = useNavigate()
  const ethereum = (window as any).ethereum

  const provider = useMemo(() => new ethers.providers.Web3Provider(ethereum), [ethereum])
  const signer: Signer = provider.getSigner()
  const tokenAddress = '0x65a5ba240CBd7fD75700836b683ba95EBb2F32bd'
  const tokenAbi: any[] = ['function mint(uint amount)']
  const tokenContract: Contract = new ethers.Contract(tokenAddress, tokenAbi, signer)

  useEffect(() => {
    const fetchAccount = async () => {
      try {
        const accounts = await provider.send('eth_requestAccounts', [])
        setCurrentAccount(accounts[0] || null)
      } catch (err) {
        console.error('Error fetching accounts:', err)
      }
    }

    if (ethereum) {
      ethereum.on('accountsChanged', fetchAccount)
    }

    fetchAccount();

    return () => {
      if (ethereum) {
        ethereum.off('accountsChanged', fetchAccount);
      }
    };
  }, [ethereum, provider]);

  const handleMintTokens = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      console.log('amountToMint', amountToMint)
      if (!amountToMint || amountToMint === '0') {
        setError('error: amount to mint can not be zero')
        return
      }
      

      try {
        if (!currentAccount) {
          setError('No MetaMask account available.')
        }

        const mintAmount = ethers.utils.parseEther(String(amountToMint));
        const gasLimit = await tokenContract.estimateGas.mint(mintAmount);

        provider.on('error', (e: string) => {
          setError(e)
        })

        // Request approval from MetaMask to send transaction
        const data: string = await ethereum.request({
          method: 'eth_sendTransaction',
          params: [
            {
              from: currentAccount,
              to: tokenAddress,
              data: tokenContract.interface.encodeFunctionData('mint', [mintAmount]),
              gas: ethers.utils.hexlify(gasLimit),
            },
          ],
        })

        provider.once(data, () => {
          // show success
          localStorage.setItem("mintedToken", data)
          localStorage.setItem("mintAmount", String(amountToMint))
          localStorage.setItem("tokenAddress", tokenAddress)
          setSuccessMessage('Token minted successfully! Redirecting to next step ...')
        });

      } catch (err: any) {
        setError(`minting tokens: ${err.message}`);
      }
    }, [amountToMint, currentAccount, ethereum, provider, tokenContract.estimateGas, tokenContract.interface]
  )

  useEffect(() => {
    let timer: NodeJS.Timeout
    if (successMessage) {
      timer = setTimeout(() => {
        setSuccessMessage('')
        navigate('/transfer')
      }, 4000)
    }
    return () => clearTimeout(timer)
  }, [navigate, successMessage])

  return (
    <div className="max-w-[800px] my-0 mx-auto text-center py-14 px-6">
      <h2 className="text-2xl font-bold mb-2">ERC20 Token Minting</h2>
      <p className="text-sm text-gray-400 mb-9">
        Mint your own test tokens! Enter the desired amount below and submit to create tokens on the Goerli Test Network.
        Start experimenting with token creation using this simple form.
      </p>

      <form onSubmit={handleMintTokens} className="flex flex-col gap-4">
        <TextField
          value={amountToMint}
          onChange={(e) => setAmountToMint(e.target.value)}
          fullWidth
          type="number"
          label="Amount to Mint"
          variant="outlined"
          color="primary"
          
        />
        <Button fullWidth variant="contained" type="submit" className="h-14">
          Mint Tokens
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
  );
};

export default MintPage