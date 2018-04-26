pragma solidity ^0.4.21;

import "./Ownable.sol";


contract GradeBook is Ownable {

  event EvaluationRecorded(uint indexed recorderID, uint indexed studentID, uint indexed activity); 

  struct Evaluation {
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

  mapping(uint => Evaluation[]) internal evaluationsByRecorder;

  mapping(address => uint) internal recorderByAddress;
  address[] internal recorders;
  uint internal recorderCount;


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
    return recorders[recorderID-1];
  }

  function makeRecorderID(address recorder) public returns (uint) {
    uint recorderID = getRecorderID(recorder);
    if(recorderID == 0) {
      recorders.push(recorder);
      recorderCount = recorderCount + 1;
      recorderID = recorderCount;
      recorderByAddress[recorder] = recorderID;
    }
    return recorderID;
  }

  // Record an evaluation
  function recordEvaluation(uint studentID, uint activity, uint8 complexity, uint8 effort, uint8 weight, uint8 points, uint8 weightedPoints) public onlyValidStudentID(studentID) {

    // look up the Recorder ID. If none exists, assign one.
    uint recorderID = makeRecorderID(msg.sender);

    evaluationsByRecorder[recorderID].push(Evaluation(studentID, activity, complexity, effort, weight, points, weightedPoints));

    emit EvaluationRecorded(recorderID, studentID, activity);
  }

  // Retrieve the number of evaluations for the recorder
  function getEvaluationCount(uint recorderID) public view returns (uint) {
    return evaluationsByRecorder[recorderID].length;
  }

  // Retrieve an evaluation record for a recorder at a given zero-based index
  function getEvaluation(uint recorderID, uint index) public view returns (uint studentID, uint activity, uint8 complexity, uint8 effort, uint8 weight, uint8 points, uint8 weightedPoints) {
    Evaluation storage evalu = evaluationsByRecorder[recorderID][index];
    return(evalu.studentID,
           evalu.activity,
           evalu.complexity,
           evalu.effort,
           evalu.weight,
           evalu.points,
           evalu.weightedPoints);
  }
}
