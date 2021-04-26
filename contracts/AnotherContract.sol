pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract AnotherContract {
    IERC20 private _token;

    constructor(IERC20 token) {
        _token = token;
    }

    function transferFromContractAllowance(address recipient, uint256 amount)
        public
    {
        //_token.transferFrom(address(this), recipient, amount); It doesn't work because of the allowancecheck at transferFrom
        _token.transferFrom(msg.sender, recipient, amount);
    }
}
