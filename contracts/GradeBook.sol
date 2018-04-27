pragma solidity ^0.4.21;

import "./Ownable.sol";


contract GradeBook is Ownable {

  event EvaluationRecorded(uint indexed recorderID, uint indexed studentID, uint indexed activity, uint evaluationID); 

  struct Evaluation {
    uint  recorderID;
    uint  studentID;
    uint  activity;
    uint8 complexity;
    uint8 effort;
    uint8 weight;
    uint8 points;
    uint8 weightedPoints;
  }

  modifier onlyValidStudentID(uint studentID) {
    require(studentID <= studentCount);
    _;
  }

  mapping(bytes => uint) internal studentByID;
  bytes[] internal students;
  uint internal studentCount;

  mapping(address => uint) internal recorderByAddress;
  address[] internal recorders;
  uint internal recorderCount;

  Evaluation[] public evaluations;
  mapping(uint => uint[]) internal evaluationsByStudentID;
  mapping(uint => uint[]) internal evaluationsByRecorderID;


  function GradeBook() public {
    studentCount = 0;
    recorderCount = 0;
  }

  // Retrieve the student ID based on the text-based student identifier
  // "zero" means the student is not recorded in the system.
  function getStudentID(bytes idText) public view returns (uint) {
    return studentByID[idText];
  }

  // Retrieve the text-based student identifier based on the student ID
  function getStudentIDText(uint studentID) public view returns (bytes) {
    // studentID is one-based, array is zero-based
    return students[studentID-1];
  }

  function makeStudentID(bytes idText) public returns (uint) {
    // must not already exist
    require(0 == getStudentID(idText));
    students.push(idText);
    studentCount = studentCount + 1;
    studentByID[idText] = studentCount;
    return studentCount;
  }

  function getRecorderID(address recorder) public view returns (uint) {
    return recorderByAddress[recorder];
  }

  function getRecorderAddress(uint recorderID) public view returns (address) {
    // recorderID is one-based, array is zero-based
    return recorders[recorderID-1];
  }

  // Record an evaluation
  function recordEvaluation(
    uint studentID,
    uint activity,
    uint8 complexity,
    uint8 effort,
    uint8 weight,
    uint8 points,
    uint8 weightedPoints) public onlyValidStudentID(studentID)
    {

    // look up the Recorder ID. If none exists, assign one.
    uint recorderID = makeRecorderID();

    evaluations.push(Evaluation(
      recorderID,
      studentID,
      activity,
      complexity,
      effort,
      weight,
      points,
      weightedPoints));
    uint evaluationID = evaluations.length - 1;
    evaluationsByRecorderID[recorderID].push(evaluationID);
    evaluationsByStudentID[studentID].push(evaluationID);

    emit EvaluationRecorded(recorderID, studentID, activity, evaluationID);
  }

  // Retrieve the total number of evaluations
  function getEvaluationCount() public view returns (uint) {
    return evaluations.length;
  }

  // Retrieve the number of evaluations by the recorder
  function getEvaluationCountByRecorderID(uint recorderID) public view returns (uint) {
    return evaluationsByRecorderID[recorderID].length;
  }

  // Retrieve the number of evaluations for the student
  function getEvaluationCountByStudentID(uint studentID) public view returns (uint) {
    return evaluationsByStudentID[studentID].length;
  }

  // Retrieve an evaluation by a recorder at a given zero-based index
  function getEvaluationByRecorderID(uint recorderID, uint index) public view returns (uint studentID, uint activity, uint8 complexity, uint8 effort, uint8 weight, uint8 points, uint8 weightedPoints) {
    Evaluation storage evalu = evaluations[evaluationsByRecorderID[recorderID][index]];
    return(evalu.studentID, evalu.activity, evalu.complexity, evalu.effort, evalu.weight, evalu.points, evalu.weightedPoints);
  }

  // Retrieve an evaluation for a student at a given zero-based index
  function getEvaluationByStudentID(uint studentID, uint index) public view returns (uint recorderID, uint activity, uint8 complexity, uint8 effort, uint8 weight, uint8 points, uint8 weightedPoints) {
    Evaluation storage evalu = evaluations[evaluationsByStudentID[studentID][index]];
    return(evalu.recorderID, evalu.activity, evalu.complexity, evalu.effort, evalu.weight, evalu.points, evalu.weightedPoints);
  }

  // Internal function for the generation of a recorder ID. The recorder is the sender
  // of the transaction, is not otherwise modifiable, which is why this is internal only.
  function makeRecorderID() internal returns (uint) {
    uint recorderID = getRecorderID(msg.sender);
    if ( 0 == recorderID ) {
      recorders.push(msg.sender);
      recorderCount = recorderCount + 1;
      recorderByAddress[msg.sender] = recorderCount;
      recorderID = recorderCount;
    }
    return recorderID;
  }
}
