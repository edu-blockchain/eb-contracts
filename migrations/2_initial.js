const Ownable = artifacts.require('ownership/Ownable.sol');
const GradeBook = artifacts.require('GradeBook');

module.exports = function (deployer) { // eslint-disable-line func-names
  deployer.deploy([Ownable, GradeBook]);
};
