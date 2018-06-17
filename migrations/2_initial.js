const GradeBook = artifacts.require('GradeBook');

module.exports = function (deployer) { // eslint-disable-line func-names
  deployer.deploy([GradeBook]);
};
