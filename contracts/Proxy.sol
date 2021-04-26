pragma solidity ^0.8.0;
import "./SimpleStorage.sol";
contract Proxy{
    SimpleStorage simpleStorage;
    constructor(address simpleStorageAddress){
        simpleStorage = SimpleStorage(simpleStorageAddress);
    }
    function runProxy(uint256 newValue) external{
        simpleStorage.setValue(newValue);
    }
}