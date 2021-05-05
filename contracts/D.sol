pragma solidity ^0.8.0;

//import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract D {
    //struct Line {
    //    address issuer;
    //    uint256 maturityDate;
    //    address unit;
    //}
    //bytes32 lineID = keccak256(abi.encode(line.issuer,line.maturityDate,line.unit));
    // lineID => holder => amount
    mapping(bytes32 => mapping(address => uint256)) balances;
    event LineOpened(
        bytes32 indexed lineID,
        address indexed issuer,
        address indexed receiverID
    );
    event LineTransferred(bytes32 indexed lineID, address indexed receiver);

    function openLine(
        uint256 maturityDate,
        uint256 unit,
        address[] memory recievers,
        uint256[] memory amounts
    ) public {
        require(
            recievers.length == amounts.length,
            "recievers and amounts array lengths should match"
        );

        bytes32 lineID = keccak256(abi.encode(msg.sender, maturityDate, unit));

        for (uint256 i = 0; i < recievers.length; i++) {
            address reciever = recievers[i];
            uint256 amount = amounts[i];
            balances[lineID][reciever] += amount;
            balances[lineID][address(0)] += amount;
            emit LineOpened(lineID, msg.sender, reciever);
        }
    }

    function transferLine(
        bytes32 lineID,
        address[] memory recievers,
        uint256[] memory amounts
    ) public {
        
        require(
            recievers.length == amounts.length,
            "recievers and amounts array lengths should match"
        );
        uint256 totalAmount;
        for (uint256 i = 0; i < amounts.length; i++){
            totalAmount += amounts[i];
        }
        require(
            totalAmount <= balances[lineID][msg.sender],
            "Sender does not have the total amount to send to all"
        );

        for (uint256 i = 0; i < recievers.length; i++) {
            address reciever = recievers[i];
            uint256 amount = amounts[i];
            balances[lineID][reciever] += amount;
            balances[lineID][msg.sender] -= amount;
            emit LineTransferred(lineID, reciever);
        }
    }

    function closeLine(uint256 maturityDate, address unit) public {
        bytes32 lineID = keccak256(abi.encode(msg.sender, maturityDate, unit));
        IERC20 tokenContract = IERC20(unit);
        uint256 totalAmount = balances[lineID][address(0)];
        tokenContract.transferFrom(msg.sender, address(this), totalAmount);
    }

    function withdraw(
        address issuer,
        uint256 maturityDate,
        address unit
    ) public {
        bytes32 lineID = keccak256(abi.encode(issuer, maturityDate, unit));
        uint256 amountToBePaid = balances[lineID][msg.sender];
        require(amountToBePaid > 0,"There is no balance for this user on this lineID Generated");
        balances[lineID][address(0)] -= amountToBePaid;
        balances[lineID][msg.sender] -= amountToBePaid;
        IERC20 tokenContract = IERC20(unit);
        tokenContract.transfer(msg.sender, amountToBePaid);
    }
}
