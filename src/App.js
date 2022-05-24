import React, { useCallback, useEffect, useState, useMemo } from 'react';
import {
  ChakraProvider,
  Box,
  Text,
  VStack,
  Grid,
  Button,
  useToast,
  Code,
  HStack,
  Heading,
  theme,
  Input,
  SimpleGrid,
  Link,
  Flex,
  useColorModeValue,
  Checkbox,
  Stack,
  Radio,
  RadioGroup

} from '@chakra-ui/react';

import { Tabs, TabList, TabPanels, Tab, TabPanel } from '@chakra-ui/react';
import { FormControl, FormLabel } from '@chakra-ui/react';
import { ColorModeSwitcher } from './ColorModeSwitcher';
import { WalletNotConnectedError } from '@solana/wallet-adapter-base';

// import { Text } from '@chakra-ui/react'
import {
  Connection,
  Keypair,
  SystemProgram,
  LAMPORTS_PER_SOL,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";


import axiosInstance from './axios';

import * as web3 from '@solana/web3.js';
import {
  ConnectionProvider,
  WalletProvider,
  useConnection,
  useWallet,
} from '@solana/wallet-adapter-react';
import {
  getPhantomWallet,
  getSolflareWallet,
  getSolletWallet,
  getSolletExtensionWallet,
} from '@solana/wallet-adapter-wallets';
import {
  WalletModalProvider,
  WalletMultiButton,
  WalletDisconnectButton,
} from '@solana/wallet-adapter-react-ui';
import { Greet } from './Greet';

// import axiosInstance from './axios';
require('@solana/wallet-adapter-react-ui/styles.css');

function WalletNotConnected() {
  return (
    <VStack height="70vh" justify="space-around">
      <VStack>
        <Text fontSize="2xl">
          {' '}
          Looks like your wallet is not connnected. Connect a wallet to get
          started!
        </Text>
        <WalletMultiButton />
      </VStack>
    </VStack>
  );
}



function useSolanaAccount() {
  const [account, setAccount] = useState(null);
  const [transactions, setTransactions] = useState(null);
  const { connection } = useConnection();
  const { publicKey } = useWallet();

  const init = useCallback(async () => {
    if (publicKey) {
      let acc = await connection.getAccountInfo(publicKey);
      setAccount(acc);
      let transactions = await connection.getConfirmedSignaturesForAddress2(
        publicKey,
        {
          limit: 10,
        }
      );
      setTransactions(transactions);
    }
  }, [publicKey, connection]);



  useEffect(() => {
    if (publicKey) {
      setInterval(init, 1000);

    }
  }, [init, publicKey]);

  return { account, transactions };
}

function Home() {
  const { connection } = useConnection();
  const { account, transactions } = useSolanaAccount();
  const toast = useToast();
  const [airdropProcessing, setAirdropProcessing] = useState(false);
  
  const { publicKey, sendTransaction } = useWallet();
  const [listAddr,updatelistAddr] = useState([]);
  const [firstAddr,updatefirstAddr] = useState([]);
  const [radioValue, setValue] = React.useState('1');

  const [userPassword,setPassword] = useState("");
  const [userWalletAddr,setWalletAddr] = useState('');
  const [srcWalletAddr,setSrcWalletAddr] = useState('');
  const [destWalletAddr,setDestWalletAddr] = useState('');
  const [userSolInput,updateSolInput] = useState('');
  const [txnID,setTXNID] = useState('');
  const [userdbBalance,setuserdbBalance] = useState(0);
  const [trackChange,setTrackChange] = useState(0);
  // const toast = useToast();

    useEffect(() => {
      if (publicKey) {
        setSrcWalletAddr(publicKey.toBase58().toString());
        setDestWalletAddr(publicKey.toBase58().toString());        
      }
  },[publicKey]);

  const getBalance = (wallet_addr) => {
    // e.preventDefault();
    axiosInstance.
      get('/users/bal/'+wallet_addr).
      then((res) => {
        console.log(res);
        setuserdbBalance(res.data.balance);
        // updateSolInput(res.data.balance);
      }).catch((err) => {

      })
      
};

  useEffect(() => {
    if (publicKey) {
      getBalance(publicKey.toBase58().toString());
    }
  }, [publicKey,txnID,trackChange]);
  

    const withdrawSOL = (e) => {
      e.preventDefault();
      axiosInstance.
        post('/users/withdraw/',{
          source_addr: srcWalletAddr,
          destination_addr: destWalletAddr,
          password: userPassword,
          amount: userSolInput
        }).then((res) => {
            console.log(res);
            setTrackChange(trackChange+1);
            toast({
              title: 'Transaction Confirmed',
              description: "Money withdrawn successfully",
              status: 'success',
              duration: 9000,
              isClosable: true,
            })

        }).catch((err) => {
            console.log(err);
            toast({
              title: 'Some error occured.',
              status: 'error',
              duration: 9000,
              isClosable: true,
            })
        })

    };

  const addSOL = (txn) => {
      // e.preventDefault();

      axiosInstance.
        post('/users/update_balance/',{
            wallet_address: srcWalletAddr,
            password: userPassword,
            amount: userSolInput,
            txn_id: txn
        }).then((res) => {
            console.log(res);
            setTXNID(txn);
            toast({
              title: 'Transaction Confirmed',
              description: ", SOL Balance Updated",
              status: 'success',
              duration: 9000,
              isClosable: true,
            })
        }).catch((err) => {
          console.log(err);
          toast({
            title: 'Some error occured.',
            status: 'error',
            duration: 5000,
            isClosable: true,
          })
        })
  };

  const createAcc = (e) => {
      e.preventDefault();

      axiosInstance.
        post('/create_user/',{
          wallet_address: userWalletAddr,
          password: userPassword,

        }).then((res) => {
          console.log(res);
          toast({
            title: 'Account created.',
            description: "We've created your account for you.",
            status: 'success',
            duration: 9000,
            isClosable: true,
          })

        }).catch((err) => {
          console.log(err);
          toast({
            title: 'Some error occured.',
            status: 'error',
            duration: 5000,
            isClosable: true,
          })
          })
  };



  const getAirdrop = useCallback(async () => {
    setAirdropProcessing(true);
    try {
      var airdropSignature = await connection.requestAirdrop(
        publicKey,
        web3.LAMPORTS_PER_SOL
      );
      await connection.confirmTransaction(airdropSignature);
    } catch (error) {
      console.log(error);
      toast({ title: 'Airdrop failed', description: 'unknown error' });
    }
    setAirdropProcessing(false);
  }, [toast, publicKey, connection]);



  const SendTrans = useCallback(async () => {
    if (!publicKey) throw new WalletNotConnectedError();
    var tempReceiver = web3.Keypair.generate();
  
        try{const transaction = new web3.Transaction().add(
            SystemProgram.transfer({
                fromPubkey: publicKey,
                toPubkey: new web3.PublicKey("CV2EyuLeuoWnWkrXACT3zXQJrTq6M4weGTU1m3Cjditc"),
                lamports: userSolInput*web3.LAMPORTS_PER_SOL,
            })
        );
  
        const signature = await sendTransaction(transaction, connection);
            
        updatefirstAddr(tempReceiver);
        console.log("done----");
        // console.log(listAddr[9].toString());
        return signature;
        }
        catch(error){
          console.log(error);
        }
        
      var hello =0;
      
  }, [publicKey, sendTransaction, connection,userSolInput,listAddr]);
  
  const SendSolanaPool = async() => {
    let a = SendTrans().then(val=>{
      console.log("val",val);
      // let b = setTXNID(val.toString());
      // addSOL();
      let b = addSOL(val.toString());
    });
  // let a = await SendTrans();
  // console.log("Return From FirstCall()",a);
  // await setTXNID(a.toString());
  // let b = await addSOL();
  }
  



  return (
    <Box textAlign="center" fontSize="xl">
      <Grid minH="100vh" p={3}>
        <Tabs variant="soft-rounded" colorScheme="green">
          <TabList width="full">
            <HStack justify="space-between" width="full">
              <HStack>
                <Tab>Home</Tab>
                <Tab>SolIncog</Tab>
              </HStack>
              <HStack spacing={4} >
                <Button variant={"solid"} isDisabled={true} size='md' style={{backgroundColor:'black',color:"white"}}> Balance: {userdbBalance} </Button>
                {publicKey && <WalletDisconnectButton bg="green" />}
                <ColorModeSwitcher justifySelf="flex-end" />

              </HStack>
            </HStack>
          </TabList>
          <TabPanels>
            <TabPanel>
              {publicKey && (
                <SimpleGrid columns={2} spacing={10}>
                  <VStack spacing={8} borderRadius={10} borderWidth={2} p={10}>
                    <FormControl id="pubkey">
                      <FormLabel>Wallet Public Key</FormLabel>
                      <Input
                        type="text"
                        value={publicKey.toBase58()}
                        readOnly
                      />
                    </FormControl>
                    <FormControl id="balance">
                      <FormLabel>Balance</FormLabel>
                      <Input
                        type="text"
                        value={
                          account
                            ? account.lamports / web3.LAMPORTS_PER_SOL + ' SOL'
                            : 'Loading..'
                        }
                        readOnly
                      />
                    </FormControl>
                    <Button onClick={getAirdrop} isLoading={airdropProcessing}>
                      Get Airdrop of 1 SOL
                    </Button>
                  </VStack>
                  <VStack>
                    {/* <Greet /> */}
                  </VStack>
                </SimpleGrid>
              )}
              {!publicKey && <WalletNotConnected />}
            </TabPanel>

            <TabPanel>
                  <Flex
                      minH={'110vh'}
                      justify={'center'}
                      bg={useColorModeValue('gray.50', 'gray.800')}>
                    <Stack spacing={4} mx={'auto'} maxW={'lg'} py={6} px={6}>
                        <Stack align={'center'}>
                    {/* <Heading fontSize={'4xl'}>Sign in to your account</Heading> */}
                    {/* <Text fontSize={'lg'} color={'gray.600'}>
                      to enjoy all of our cool <Link color={'blue.400'}>features</Link> ✌️
                    </Text> */}
                       </Stack>
                  <Box
                    rounded={'lg'}
                    bg={useColorModeValue('white', 'gray.700')}
                    boxShadow={'lg'}
                    p={8}>
                    <Stack spacing={4}>

                      { publicKey && radioValue=='1' &&
                      <>
                        <FormControl id="wallet_address">
                          <FormLabel > Src Wallet Address</FormLabel>
                          <Input placeholder={publicKey.toBase58().toString()} onChange={(event) => setSrcWalletAddr(event.target.value)} type="text" />
                        </FormControl>

                        <FormControl id="password">
                          <FormLabel> Password</FormLabel>
                          <Input onChange={(event) => setPassword(event.target.value)} type="password" />
                        </FormControl>
                      </>
                      }


                   { publicKey && radioValue=='2' &&
                      <>
                          <FormControl id="wallet_address">
                            <FormLabel> Source Wallet</FormLabel>
                            <Input isReadOnly={true} defaultValue={publicKey.toBase58().toString()} placeholder={publicKey.toBase58().toString()} type="text" />
                          </FormControl>


                          {/* <FormControl id="txn_id">
                            <FormLabel>Transaction ID</FormLabel>
                            <Input onChange={(event) => setTXNID(event.target.value)} type="text" />
                          </FormControl> */}


                          <FormControl id="password">
                            <FormLabel>Password</FormLabel>
                            <Input onChange={(event) => setPassword(event.target.value)} type="password" />
                          </FormControl>

                          <FormControl id="amount">
                            <FormLabel>Amount</FormLabel>
                            <Input onChange={(event) => updateSolInput(event.target.value)} type="text" />
                          </FormControl>
                      </>
                     }

                    { publicKey && 
                      radioValue=='3' &&
                        <>
                          <FormControl id="wallet_address">
                            <FormLabel defaultValue={publicKey.toBase58().toString()}>Source Wallet</FormLabel>
                            <Input isReadOnly={true} defaultValue={publicKey.toBase58().toString()} placeholder={publicKey.toBase58().toString()} type="text" />
                          </FormControl>


                          <FormControl id="dest_wallet_address">
                            <FormLabel>Destination Wallet</FormLabel>
                            <Input onChange={(event) => setDestWalletAddr(event.target.value)} type="text" />
                          </FormControl>


                          <FormControl id="password">
                            <FormLabel> Password</FormLabel>
                            <Input onChange={(event) => setPassword(event.target.value)} type="password" />
                          </FormControl>

                          <FormControl id="amount">
                            <FormLabel>Amount</FormLabel>
                            <Input onChange={(event) => updateSolInput(event.target.value)} type="text" />
                          </FormControl>
                        </>
                      }


                          <RadioGroup onChange={setValue} value={radioValue}>
                              <Stack direction='row' spacing={4}>
                                <Radio value='1'> Create Account </Radio>
                                <Radio value='2'> Deposit SOL </Radio>
                                <Radio value='3'> Request SOL </Radio>
                              </Stack>
                          </RadioGroup>
    
    
              { publicKey && radioValue=='1' &&
                      <Stack spacing={10}>
                        <Button
                          bg={'blue.400'}
                          color={'white'}
                          _hover={{
                            bg: 'blue.500',
                          }}
                          onClick={createAcc}
                          >
                          Submit 
                        </Button>
                      </Stack>
              }
                { radioValue=='2' &&
                      <Stack spacing={10}>
                        <Button
                          bg={'blue.400'}
                          color={'white'}
                          _hover={{
                            bg: 'blue.500',
                          }}
                          onClick={SendSolanaPool}
                          >
                          Submit
                        </Button>
                      </Stack>
              }

                {  radioValue=='3' &&
                        <Stack spacing={10}>
                          <Button
                            bg={'blue.400'}
                            color={'white'}
                            _hover={{
                              bg: 'blue.500',
                            }}
                            onClick={withdrawSOL}
                            >
                            Submit
                          </Button>
                        </Stack>
                }


                    </Stack>
                  </Box>
                </Stack>
                {/* <VStack spacing={8} borderRadius={10} borderWidth={2} p={10}>
                    <FormControl id="balance">
                      <FormLabel>Balance</FormLabel>
                      <Input
                        type="text"
                        value={
                          account
                            ? account.lamports / web3.LAMPORTS_PER_SOL + ' SOL'
                            : 'Loading..'
                        }
                        readOnly
                      />
                    </FormControl>
                    <Button onClick={getAirdrop} isLoading={airdropProcessing}>
                      Get Balance
                    </Button>
                  </VStack> */}
              </Flex>

                  <VStack>
                    {/* <Greet /> */}
                  </VStack>

                <VStack spacing={8}>
                  <Heading>Send Money </Heading>
                      <HStack spacing={8}>
                              <Input variant='filled' placeholder='Filled' onChange={(event) => updateSolInput(event.target.value)} />                      
                                <Button onClick={SendTrans}  variant='solid'>
                                Send M
                              </Button>
                      </HStack>
                      <Text align={"center"}>Request Money </Text>
                </VStack>
            </TabPanel>




          </TabPanels>
        </Tabs>
      </Grid>
    </Box>
  );
}

function App() {
  const network = 'devnet';
  const endpoint = web3.clusterApiUrl(network);
  const wallets = useMemo(
    () => [
      getPhantomWallet(),
      getSolflareWallet(),
      getSolletWallet({ network }),
      getSolletExtensionWallet({ network }),
    ],
    [network]
  );

  return (
    <ChakraProvider theme={theme}>
      <ConnectionProvider endpoint={endpoint}>
        <WalletProvider wallets={wallets} autoConnect>
          <WalletModalProvider>
            <Home></Home>
          </WalletModalProvider>
        </WalletProvider>
      </ConnectionProvider>
    </ChakraProvider>
  );
}

export default App;
