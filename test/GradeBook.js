/* eslint-env node, mocha */
/* eslint no-unused-expressions: 0 */
/* eslint no-await-in-loop: 0 */
/* eslint prefer-const: 0 */
const GradeBook = artifacts.require('../contracts/GradeBook.sol');
const expectThrow = require('./helpers/expectThrow.js');
const BigNumber = require('bignumber.js');
const testData = require('./fixtures/test-data.json');

const should = require('chai') // eslint-disable-line no-unused-vars
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

// decimal grade 7.4 becomes 74 (stored as uint8 on chain, max 255)
function norm(decimal) {
  return new web3.BigNumber(decimal * 10);
}

contract('GradeBook', (accounts) => {
  const evaluator = accounts[1];
  var gradeBook; // eslint-disable-line no-var

  before(async () => {
    gradeBook = await GradeBook.new();
  });

  beforeEach(async () => {
  });

  context('zero is not a valid student ID when no students exist', () => {
    it('should not retrieve text for invalid student ID', async () => {
      await expectThrow(gradeBook.getStudentIDText(0));
    });

    it('should not record evaluation for invalid student ID', async () => {
      await expectThrow(gradeBook.recordEvaluation(0, 1, 2, 3, 4, 5, 6, { from: evaluator }));
    });
  });

  context('grade recording', () => {
    it('should record grades', async () => {
      let studentIndex = 0;
      for (let i in testData) { // eslint-disable-line
        let rec = testData[i];
        let recIndex = parseInt(i); // eslint-disable-line

        // get the student ID or make one
        let studentID = (await gradeBook.getStudentID(rec.id_alumno)).toNumber();
        if (studentID === 0) {
          await gradeBook.makeStudentID(rec.id_alumno, { from: evaluator });
          studentID = (await gradeBook.getStudentID(rec.id_alumno)).toNumber();
          studentIndex = 0;
        } else {
          studentIndex += 1;
        }

        (await gradeBook.getStudentCount()).toNumber().should.be.equal(studentID);
        (await gradeBook.getStudentIDText(studentID)).should.be.equal(web3.fromAscii(rec.id_alumno));

        // record the evaluation
        let record = await gradeBook.recordEvaluation(
          studentID, rec.id_oa,
          norm(rec.complejidad_oa),
          norm(rec.esfuerzo_oa),
          norm(rec.peso_oa),
          norm(rec.puntos),
          norm(rec.puntos_pond),
          { from: evaluator }); // eslint-disable-line function-paren-newline

        // There should have been an event emitted, and the data should match
        record.logs[0].event.should.be.equal('EvaluationRecorded');
        record.logs[0].args.studentID.toNumber().should.be.equal(studentID);
        record.logs[0].args.activity.toNumber().should.be.equal(rec.id_oa);
        record.logs[0].args.evaluationID.toNumber().should.be.equal(recIndex);

        // Check the recorder ID created during the recording above
        let recorderID = (await gradeBook.getRecorderID(evaluator)).toNumber();
        (await gradeBook.getRecorderAddress(recorderID)).should.be.equal(evaluator);
        record.logs[0].args.recorderID.toNumber().should.be.equal(recorderID);

        // total number of evaluations should be correct
        (await gradeBook.getEvaluationCount()).toNumber().should.be.equal(recIndex + 1);

        // check that the number of evaluations by this evaluator is correct
        (await gradeBook.getEvaluationCountByRecorderID(recorderID)).toNumber().should.be.equal(recIndex + 1);

        // check that the number of evaluations for this student is correct
        (await gradeBook.getEvaluationCountByStudentID(studentID)).toNumber().should.be.equal(studentIndex + 1);

        // compare the evaluation recorded with the four retrieval methods:
        // all evaluations, via Recorder ID, via Student ID, and via array accessor
        // these three all return the same parameters (including decoded recorder and student IDs)
        let result0 = await gradeBook.getEvaluation(recIndex);
        let result1 = await gradeBook.getEvaluationByRecorderID(recorderID, recIndex);
        let result2 = await gradeBook.getEvaluationByStudentID(studentID, studentIndex);
        // the array accessor does not return the index or decoded IDs
        let result3 = await gradeBook.evaluations(recIndex);

        result0[0].toNumber().should.be.equal(recIndex);
        result1[0].toNumber().should.be.equal(recIndex);
        result2[0].toNumber().should.be.equal(recIndex);
        // result3: array accessor does not return its own index

        result0[1].toNumber().should.be.equal(recorderID);
        result1[1].toNumber().should.be.equal(recorderID);
        result2[1].toNumber().should.be.equal(recorderID);
        result3[0].toNumber().should.be.equal(recorderID);

        let recorderAddress = await gradeBook.getRecorderAddress(recorderID);
        result0[2].should.be.equal(recorderAddress);
        result1[2].should.be.equal(recorderAddress);
        result2[2].should.be.equal(recorderAddress);
        // result3: array accessor does not return decoded ID

        result0[3].toNumber().should.be.equal(studentID);
        result1[3].toNumber().should.be.equal(studentID);
        result2[3].toNumber().should.be.equal(studentID);
        result3[1].toNumber().should.be.equal(studentID);

        let studentIDText = await gradeBook.getStudentIDText(studentID);
        result0[4].should.be.equal(studentIDText);
        result1[4].should.be.equal(studentIDText);
        result2[4].should.be.equal(studentIDText);
        // result3: array accessor does not return decoded ID

        result0[5].toNumber().should.be.equal(rec.id_oa);
        result1[5].toNumber().should.be.equal(rec.id_oa);
        result2[5].toNumber().should.be.equal(rec.id_oa);
        result3[2].toNumber().should.be.equal(rec.id_oa);

        result0[6].should.be.bignumber.equal(norm(rec.complejidad_oa));
        result1[6].should.be.bignumber.equal(norm(rec.complejidad_oa));
        result2[6].should.be.bignumber.equal(norm(rec.complejidad_oa));
        result3[3].should.be.bignumber.equal(norm(rec.complejidad_oa));

        result0[7].should.be.bignumber.equal(norm(rec.esfuerzo_oa));
        result1[7].should.be.bignumber.equal(norm(rec.esfuerzo_oa));
        result2[7].should.be.bignumber.equal(norm(rec.esfuerzo_oa));
        result3[4].should.be.bignumber.equal(norm(rec.esfuerzo_oa));

        result0[8].should.be.bignumber.equal(norm(rec.peso_oa));
        result1[8].should.be.bignumber.equal(norm(rec.peso_oa));
        result2[8].should.be.bignumber.equal(norm(rec.peso_oa));
        result3[5].should.be.bignumber.equal(norm(rec.peso_oa));

        result0[9].should.be.bignumber.equal(norm(rec.puntos));
        result1[9].should.be.bignumber.equal(norm(rec.puntos));
        result2[9].should.be.bignumber.equal(norm(rec.puntos));
        result3[6].should.be.bignumber.equal(norm(rec.puntos));

        result0[10].should.be.bignumber.equal(norm(rec.puntos_pond));
        result1[10].should.be.bignumber.equal(norm(rec.puntos_pond));
        result2[10].should.be.bignumber.equal(norm(rec.puntos_pond));
        result3[7].should.be.bignumber.equal(norm(rec.puntos_pond));
      }
    });

    it('should not record grades when the student ID is invalid', async () => {
      await expectThrow(gradeBook.recordEvaluation(999, 0, 0, 0, 0, 0, 0, { from: evaluator }));
    });

    it('should not allow adding the same student twice', async () => {
      await gradeBook.makeStudentID('duplo', { from: evaluator });
      await expectThrow(gradeBook.makeStudentID('duplo', { from: evaluator }));
    });

    it('should allow numeric student IDs', async () => {
      await gradeBook.makeStudentID(web3.fromUtf8('4444'), { from: evaluator });
      let studentID = (await gradeBook.getStudentCount()).toNumber();
      web3.toUtf8(await gradeBook.getStudentIDText(studentID)).should.be.eq('4444');
    });

    it('should allow creation of a student ID with the evaluation', async () => {
      await gradeBook.recordEvaluationForStudentIDText(web3.fromUtf8('uv808'), 0, 1, 2, 3, 4, 5, { from: evaluator });
      let studentID = (await gradeBook.getStudentID('uv808')).toNumber();
      studentID.should.be.gt(0);
      (await gradeBook.getEvaluationCountByStudentID(studentID)).toNumber().should.be.eq(1);
      let result = await gradeBook.getEvaluationByStudentID(studentID, 0);
      result[5].toNumber().should.be.eq(0);
      result[6].toNumber().should.be.eq(1);
      result[7].toNumber().should.be.eq(2);
      result[8].toNumber().should.be.eq(3);
      result[9].toNumber().should.be.eq(4);
      result[10].toNumber().should.be.eq(5);
      // a subsequent call should use the existing student ID
      await gradeBook.recordEvaluationForStudentIDText(web3.fromUtf8('uv808'), 0, 10, 20, 30, 40, 50, { from: evaluator });
      (await gradeBook.getEvaluationCountByStudentID(studentID)).toNumber().should.be.eq(2);
    });

    it('should not allow student ID 0 with the evaluation', async () => {
      await expectThrow(gradeBook.recordEvaluation(0, 0, 1, 2, 3, 4, 5, { from: evaluator }));
    });
  });
});
