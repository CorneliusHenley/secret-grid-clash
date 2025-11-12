import { useState } from 'react';
import { useAccount, useReadContract, useReadContracts } from 'wagmi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { useFHE } from '../hooks/useFHE';
import { CONTRACT_ABI } from '../config/contract';
import { useContractAddress } from '../hooks/useContractAddress';
import { Unlock, Eye, Loader2 } from 'lucide-react';
import { hexlify, isBytesLike } from 'ethers';

interface RoundDetailsProps {
  roundId: number;
}

export default function RoundDetails({ roundId }: RoundDetailsProps) {
  const { address } = useAccount();
  const { instance, decrypt, isReady } = useFHE();
  const contractAddress = useContractAddress();

  const [decryptedData, setDecryptedData] = useState<{
    myDonation?: number;
    communityTotal?: number;
    myMatching?: { max: number; trigger: number };
    finalTotal?: number;
  }>({});
  const [isDecrypting, setIsDecrypting] = useState<{
    myDonation: boolean;
    communityTotal: boolean;
    myMatchingMax: boolean;
    myMatchingTrigger: boolean;
    finalTotal: boolean;
  }>({
    myDonation: false,
    communityTotal: false,
    myMatchingMax: false,
    myMatchingTrigger: false,
    finalTotal: false,
  });

  // Get round info
  const { data: roundData } = useReadContract({
    address: contractAddress,
    abi: CONTRACT_ABI,
    functionName: 'getRound',
    args: [BigInt(roundId)],
  });

  // Check if user has donated
  const { data: hasDonated, isLoading: loadingDonated } = useReadContract({
    address: contractAddress,
    abi: CONTRACT_ABI,
    functionName: 'hasDonated',
    args: address ? [BigInt(roundId), address as `0x${string}`] : undefined,
  });

  // Check if user has committed matching
  const { data: hasCommittedMatching, isLoading: loadingMatching } = useReadContract({
    address: contractAddress,
    abi: CONTRACT_ABI,
    functionName: 'hasCommittedMatching',
    args: address ? [BigInt(roundId), address as `0x${string}`] : undefined,
  });

  // Debug: Log participation status
  console.log('Participation status:', {
    address,
    roundId,
    hasDonated,
    hasCommittedMatching,
    loadingDonated,
    loadingMatching,
  });

  // Get donation count
  const { data: donationCount } = useReadContract({
    address: contractAddress,
    abi: CONTRACT_ABI,
    functionName: 'getDonationCount',
    args: [BigInt(roundId)],
  });

  // Get matching commitment count
  const { data: matchingCount } = useReadContract({
    address: contractAddress,
    abi: CONTRACT_ABI,
    functionName: 'getMatchingCommitmentCount',
    args: [BigInt(roundId)],
  });

  // Get all donations
  const donationIndices = Array.from({ length: Number(donationCount || 0) }, (_, i) => i);
  const donationsQuery = useReadContracts({
    allowFailure: true,
    contracts: donationIndices.length > 0 ? donationIndices.map((index) => ({
      address: contractAddress,
      abi: CONTRACT_ABI,
      functionName: 'roundDonations',
      args: [BigInt(roundId), BigInt(index)],
    })) : [],
    query: {
      enabled: !!donationCount && Number(donationCount) > 0,
    },
  });

  // Get all matching commitments
  const matchingIndices = Array.from({ length: Number(matchingCount || 0) }, (_, i) => i);
  const matchingQuery = useReadContracts({
    allowFailure: true,
    contracts: matchingIndices.length > 0 ? matchingIndices.map((index) => ({
      address: contractAddress,
      abi: CONTRACT_ABI,
      functionName: 'roundMatchingCommitments',
      args: [BigInt(roundId), BigInt(index)],
    })) : [],
    query: {
      enabled: !!matchingCount && Number(matchingCount) > 0,
    },
  });

  const handleDecrypt = async (
    handle: any,
    type: 'myDonation' | 'communityTotal' | 'myMatchingMax' | 'myMatchingTrigger' | 'finalTotal'
  ) => {
    if (!instance || !address || !isReady) {
      alert('Please wait for FHE initialization');
      return;
    }

    // Check if handle is valid (not empty or all zeros)
    if (!handle || handle === '0x0' || handle === '0x0000000000000000000000000000000000000000000000000000000000000000') {
      alert('Invalid handle: The encrypted data is not available yet.');
      return;
    }

    // Convert handle to hex string if needed
    let handleHex: string = '';

    try {
      setIsDecrypting((prev) => ({ ...prev, [type]: true }));
      if (typeof handle === 'string') {
        handleHex = handle.startsWith('0x') ? handle : `0x${handle}`;
      } else if (handle instanceof Uint8Array || isBytesLike(handle)) {
        handleHex = hexlify(handle);
      } else {
        handleHex = hexlify(handle as any);
      }

      // Check if handle is all zeros after conversion
      if (handleHex === '0x0' || handleHex.replace(/0/g, '').replace(/x/gi, '').length === 0) {
        alert('Invalid handle: The encrypted data is not initialized.');
        return;
      }

      console.log(`Attempting to decrypt ${type} with handle:`, handleHex);
      console.log(`User address: ${address}, Type: ${type}`);

      // Get signer from window.ethereum
      const provider = new (await import('ethers')).BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      const decryptedValue = await decrypt(contractAddress, handleHex, address, signer);
      
      console.log(`Decryption successful for ${type}:`, decryptedValue);

      if (type === 'myMatchingMax') {
        setDecryptedData((prev) => ({
          ...prev,
          myMatching: { ...prev.myMatching, max: decryptedValue } as { max: number; trigger: number },
        }));
      } else if (type === 'myMatchingTrigger') {
        setDecryptedData((prev) => ({
          ...prev,
          myMatching: { ...prev.myMatching, trigger: decryptedValue } as { max: number; trigger: number },
        }));
      } else {
        setDecryptedData((prev) => ({
          ...prev,
          [type]: decryptedValue,
        }));
      }
    } catch (error: any) {
      console.error(`Failed to decrypt ${type}:`, error);
      
      // Provide more helpful error messages
      let errorMessage = 'Failed to decrypt';
      if (error?.message) {
        if (error.message.includes('not authorized')) {
          errorMessage = `You are not authorized to decrypt this data. ${getAuthorizationHint(type, userHasDonated, userHasCommittedMatching, settled)}`;
        } else {
          errorMessage = error.message;
        }
      }
      
      alert(`${errorMessage}\n\nType: ${type}\nHandle: ${handleHex || 'unknown'}`);
    } finally {
      setIsDecrypting((prev) => ({ ...prev, [type]: false }));
    }
  };

  // Helper function to provide authorization hints
  const getAuthorizationHint = (
    type: string,
    hasDonated: boolean,
    hasCommittedMatching: boolean,
    isSettled: boolean
  ): string => {
    switch (type) {
      case 'communityTotal':
        return hasDonated 
          ? 'Please ensure you have made a donation in this round.' 
          : 'Only donors can decrypt the community total.';
      case 'finalTotal':
        return isSettled
          ? (hasDonated || hasCommittedMatching 
              ? 'Please ensure you have participated (donated or committed matching) in this round.' 
              : 'Only participants can decrypt the final total after settlement.')
          : 'The round must be settled before decrypting the final total.';
      case 'myDonation':
        return 'Please ensure you have made a donation in this round.';
      case 'myMatchingMax':
      case 'myMatchingTrigger':
        return 'Please ensure you have committed matching in this round.';
      default:
        return 'Please check your participation status.';
    }
  };

  if (!roundData) {
    return null;
  }

  const round = roundData as any;
  const settled = round[5];
  const encryptedCommunityTotal = round[6];
  const encryptedFinalTotal = round[8];

  // Debug: Log encrypted handles
  console.log('Round encrypted data:', {
    encryptedCommunityTotal: typeof encryptedCommunityTotal === 'string' ? encryptedCommunityTotal : 'not string',
    encryptedFinalTotal: typeof encryptedFinalTotal === 'string' ? encryptedFinalTotal : 'not string',
    settled,
  });

  // Find user's donation - check both hasDonated and actual donations array
  const userDonation = donationsQuery.data?.find((result, index) => {
    if (result?.status === 'success' && result.result) {
      const data = result.result as any;
      // Donation struct: (address donor, euint64 amount, uint256 timestamp, uint256 roundId)
      // Handle both tuple and array formats
      const donorAddress = Array.isArray(data) ? data[0] : (data.donor || data[0]);
      if (!donorAddress) {
        console.warn('Donation data missing donor address:', { index, data, result });
        return false;
      }
      const match = donorAddress?.toLowerCase() === address?.toLowerCase();
      if (match) {
        console.log('Found user donation:', { 
          index, 
          donor: donorAddress, 
          amount: Array.isArray(data) ? data[1] : (data.amount || data[1]), 
          timestamp: Array.isArray(data) ? data[2] : (data.timestamp || data[2]), 
          roundId: Array.isArray(data) ? data[3] : (data.roundId || data[3]),
          address,
          fullData: data
        });
      }
      return match;
    } else if (result?.status === 'failure') {
      console.warn('Donation query failed:', { index, error: result.error });
    }
    return false;
  });

  // Find user's matching commitment - check both hasCommittedMatching and actual commitments array
  const userMatching = matchingQuery.data?.find((result, index) => {
    if (result?.status === 'success' && result.result) {
      const data = result.result as any;
      // MatchingCommitment struct: (address matcher, euint64 maxMatchingAmount, euint64 minTrigger, uint256 roundId, uint256 timestamp, bool isActive)
      // Handle both tuple and array formats
      const matcherAddress = Array.isArray(data) ? data[0] : (data.matcher || data[0]);
      if (!matcherAddress) {
        console.warn('Matching data missing matcher address:', { index, data, result });
        return false;
      }
      const match = matcherAddress?.toLowerCase() === address?.toLowerCase();
      if (match) {
        console.log('Found user matching:', { 
          index, 
          matcher: matcherAddress, 
          maxMatching: Array.isArray(data) ? data[1] : (data.maxMatchingAmount || data[1]), 
          minTrigger: Array.isArray(data) ? data[2] : (data.minTrigger || data[2]),
          roundId: Array.isArray(data) ? data[3] : (data.roundId || data[3]),
          timestamp: Array.isArray(data) ? data[4] : (data.timestamp || data[4]),
          isActive: Array.isArray(data) ? data[5] : (data.isActive || data[5]),
          address,
          fullData: data
        });
      }
      return match;
    } else if (result?.status === 'failure') {
      console.warn('Matching query failed:', { index, error: result.error });
    }
    return false;
  });

  // Use actual participation status from arrays, fallback to contract queries
  const userHasDonated = !!userDonation || (hasDonated === true);
  const userHasCommittedMatching = !!userMatching || (hasCommittedMatching === true);

  // Debug: Log all donations and matchings to see what we're getting
  console.log('All donations query:', {
    data: donationsQuery.data,
    isLoading: donationsQuery.isLoading,
    donationCount,
    userDonation,
    userHasDonated,
    hasDonated,
    address,
  });
  console.log('All matchings query:', {
    data: matchingQuery.data,
    isLoading: matchingQuery.isLoading,
    matchingCount,
    userMatching,
    userHasCommittedMatching,
    hasCommittedMatching,
    address,
  });


  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="w-5 h-5" />
          Your Decrypted Data
        </CardTitle>
        <CardDescription>
          Decrypt and view your authorized information for this round
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* My Donation */}
        {donationsQuery.isLoading ? (
          <div className="text-sm text-muted-foreground py-2">Loading donation data...</div>
        ) : userDonation && userDonation.status === 'success' ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium">My Donation Amount:</span>
              {decryptedData.myDonation !== undefined ? (
                <span className="text-primary font-semibold">{decryptedData.myDonation} ETH</span>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const donationData = userDonation.result as any;
                    console.log('Decrypting my donation:', donationData);
                    // Handle both tuple and array formats
                    const amountHandle = Array.isArray(donationData) 
                      ? donationData[1] 
                      : (donationData.amount || donationData[1]);
                    if (donationData && amountHandle) {
                      handleDecrypt(amountHandle, 'myDonation');
                    } else {
                      console.error('Donation amount handle missing:', { donationData, amountHandle });
                      alert('Donation amount handle not found');
                    }
                  }}
                  disabled={isDecrypting.myDonation || !isReady}
                >
                  {isDecrypting.myDonation ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Decrypting...
                    </>
                  ) : (
                    <>
                      <Unlock className="w-4 h-4 mr-2" />
                      Decrypt
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        ) : userHasDonated ? (
          <div className="text-sm text-muted-foreground py-2">
            Donation found but data not available. Please refresh the page.
          </div>
        ) : null}

        {/* Community Total - Only visible to donors */}
        {userHasDonated && encryptedCommunityTotal && encryptedCommunityTotal !== '0x0' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium">Community Total:</span>
              {decryptedData.communityTotal !== undefined ? (
                <span className="text-primary font-semibold">{decryptedData.communityTotal} ETH</span>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDecrypt(encryptedCommunityTotal, 'communityTotal')}
                  disabled={isDecrypting.communityTotal || !isReady}
                >
                  {isDecrypting.communityTotal ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Decrypting...
                    </>
                  ) : (
                    <>
                      <Unlock className="w-4 h-4 mr-2" />
                      Decrypt
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        )}

        {/* My Matching Commitment */}
        {matchingQuery.isLoading ? (
          <div className="text-sm text-muted-foreground py-2">Loading matching data...</div>
        ) : userMatching && userMatching.status === 'success' ? (
          <div className="space-y-2">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium">My Matching Commitment:</span>
              </div>
              <div className="space-y-2 pl-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Max Matching Amount:</span>
                  {decryptedData.myMatching?.max !== undefined ? (
                    <span className="text-primary font-semibold">
                      {decryptedData.myMatching.max} ETH
                    </span>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const matchingData = userMatching.result as any;
                        console.log('Decrypting my matching max:', matchingData);
                        // Handle both tuple and array formats
                        const maxHandle = Array.isArray(matchingData) 
                          ? matchingData[1] 
                          : (matchingData.maxMatchingAmount || matchingData[1]);
                        if (matchingData && maxHandle) {
                          handleDecrypt(maxHandle, 'myMatchingMax');
                        } else {
                          console.error('Matching max handle missing:', { matchingData, maxHandle });
                          alert('Matching max handle not found');
                        }
                      }}
                      disabled={isDecrypting.myMatchingMax || !isReady}
                    >
                      {isDecrypting.myMatchingMax ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Decrypting...
                        </>
                      ) : (
                        <>
                          <Unlock className="w-4 h-4 mr-2" />
                          Decrypt
                        </>
                      )}
                    </Button>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Min Trigger Amount:</span>
                  {decryptedData.myMatching?.trigger !== undefined ? (
                    <span className="text-primary font-semibold">
                      {decryptedData.myMatching.trigger} ETH
                    </span>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const matchingData = userMatching.result as any;
                        console.log('Decrypting my matching trigger:', matchingData);
                        // Handle both tuple and array formats
                        const triggerHandle = Array.isArray(matchingData) 
                          ? matchingData[2] 
                          : (matchingData.minTrigger || matchingData[2]);
                        if (matchingData && triggerHandle) {
                          handleDecrypt(triggerHandle, 'myMatchingTrigger');
                        } else {
                          console.error('Matching trigger handle missing:', { matchingData, triggerHandle });
                          alert('Matching trigger handle not found');
                        }
                      }}
                      disabled={isDecrypting.myMatchingTrigger || !isReady}
                    >
                      {isDecrypting.myMatchingTrigger ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Decrypting...
                        </>
                      ) : (
                        <>
                          <Unlock className="w-4 h-4 mr-2" />
                          Decrypt
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : userHasCommittedMatching ? (
          <div className="text-sm text-muted-foreground py-2">
            Matching commitment found but data not available. Please refresh the page.
          </div>
        ) : null}

        {/* Final Total (only after settlement) - Visible to all participants */}
        {settled && (userHasDonated || userHasCommittedMatching) && (
          <div className="space-y-2 border-t pt-4">
            <div className="flex items-center justify-between">
              <span className="font-medium">Final Total:</span>
              {decryptedData.finalTotal !== undefined ? (
                <span className="text-primary font-semibold text-lg">
                  {decryptedData.finalTotal} ETH
                </span>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDecrypt(encryptedFinalTotal, 'finalTotal')}
                  disabled={isDecrypting.finalTotal || !isReady}
                >
                  {isDecrypting.finalTotal ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Decrypting...
                    </>
                  ) : (
                    <>
                      <Unlock className="w-4 h-4 mr-2" />
                      Decrypt Final Total
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Show loading state */}
        {(loadingDonated || loadingMatching) && (
          <p className="text-sm text-muted-foreground text-center py-4">
            Checking participation status...
          </p>
        )}

        {/* Show message if not participated */}
        {!loadingDonated && !loadingMatching && !userHasDonated && !userHasCommittedMatching && (
          <p className="text-sm text-muted-foreground text-center py-4">
            You haven't participated in this round yet. Make a donation or commit matching to view encrypted data.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

