pragma solidity ^0.8.0;

contract SimpleStorage {
    uint256 value;
    constructor(){

    }
    function getValue() public view returns (uint256) {
        return value;
    }
    
    function setValue(uint256 newValue) external {
        value = newValue;
    }
}
