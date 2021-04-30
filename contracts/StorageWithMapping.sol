pragma solidity ^0.8.0;

//import "@openzeppelin/contracts/access/Ownable.sol";

contract StorageWithMapping {
    mapping(bytes32 => uint256) public values;
    address owner;
    event ValueSet(bytes32 key, uint256 value);

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function.");
        _;
    }

    function setValue(bytes32 _key, uint256 _value) external onlyOwner {
        values[_key] = _value;
        emit ValueSet(_key, _value);
    }

    function getValue(bytes32 _key) public view returns (uint256) {
        return values[_key];
    }
}
