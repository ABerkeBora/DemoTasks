pragma solidity ^0.8.0;
import "@openzeppelin/contracts/access/Ownable.sol";

contract SimpleStorage is Ownable{
    uint256 value;
    constructor(){
    }
    function getValue() public view returns (uint256) {
        return value;
    }
    
    function setValue(uint256 newValue) external onlyOwner {
        value = newValue;
    }
}
