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
    mapping(bytes32 => bool) isClosed;
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

         maturityDate -= maturityDate % (60 * 60 * 24);// to get rid of seconds, minutes & hours, because of leap seconds it might be off by 26 seconds, negligible for sure.
        //maturityDate = (maturityDate / (60 * 60 * 24)) * (60 * 60 * 24); Another way to do this. Not sure which one is more efficient
        //Should I revert if it is older date? For the sake of testing keeping like that is much easier btw

        bytes32 lineID = keccak256(abi.encode(msg.sender, maturityDate, unit));

        require(
            !isClosed[lineID],
            "Line is Closed can't transfer anything anymore, try to have another maturity date, address issuing combination"
        );
        for (uint256 i = 0; i < recievers.length; i++) {
            _openLineProvide(lineID, recievers[i], amounts[i]);
        }
    }

    function _openLineProvide(
        bytes32 lineID,
        address reciever,
        uint256 amount
    ) internal {
        require(
            reciever != address(0),
            "Zero address can't recieve as it means burning"
        );
        balances[lineID][reciever] += amount;
        balances[lineID][address(0)] += amount;
        emit LineOpened(lineID, msg.sender, reciever);
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

        for (uint256 i = 0; i < recievers.length; i++) {
            _transferLine(lineID, recievers[i], amounts[i]);
        }
    }

    function _transferLine(
        bytes32 lineID,
        address reciever,
        uint256 amount
    ) internal {
        require(
            reciever != address(0),
            "Zero address can't recieve as it means burning"
        );
        require(
            balances[lineID][msg.sender] >= amount,
            "Sender does not have the total amount to send to all"
        );
        require(
            !isClosed[lineID],
            "Line is Closed can't transfer anything anymore"
        );
        balances[lineID][reciever] += amount;
        balances[lineID][msg.sender] -= amount;
        emit LineTransferred(lineID, reciever); //Should we emit the sender too? Not sure how we are going to observe those, might be unneccesary don't know.
    }

    function closeLine(uint256 maturityDate, address unit) public {
        maturityDate = (maturityDate / (60 * 60 * 24)) * (60 * 60 * 24);
        bytes32 lineID = keccak256(abi.encode(msg.sender, maturityDate, unit));
        IERC20 tokenContract = IERC20(unit);
        uint256 totalAmount = balances[lineID][address(0)];
        tokenContract.transferFrom(msg.sender, address(this), totalAmount);
        isClosed[lineID] = true;
    }

    function withdraw(
        address issuer,
        uint256 maturityDate,
        address unit
    ) public {
        maturityDate = (maturityDate / (60 * 60 * 24)) * (60 * 60 * 24);
        require(maturityDate <= block.timestamp,"Maturity Date is not up, you can't withdraw yet");
        bytes32 lineID = keccak256(abi.encode(issuer, maturityDate, unit));
        uint256 amountToBePaid = balances[lineID][msg.sender];
        require(
            amountToBePaid > 0,
            "There is no balance for this user on this lineID Generated"
        );
        balances[lineID][address(0)] -= amountToBePaid;
        balances[lineID][msg.sender] -= amountToBePaid;
        IERC20 tokenContract = IERC20(unit);
        tokenContract.transfer(msg.sender, amountToBePaid);
    }
}
