pragma solidity ^0.8.0;

contract SimpleStorage {
    uint256 value;
    address owner;
    modifier onlyOwner(){
        require(msg.sender==owner,"Only owner can call this function.");
        _;
    }
    constructor(){
        owner = msg.sender;
    }
    function getValue() public view returns (uint256) {
        return value;
    }
    
    function setValue(uint256 newValue) external onlyOwner {
        value = newValue;
    }
}
