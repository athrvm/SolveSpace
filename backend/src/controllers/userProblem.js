const { getLanguageById, submitBatch, submitToken } = require("../utils/problemUtility");
const Problem = require("../models/problem")
const User = require("../models/user");
const Submission = require("../models/submission");
const SolutionVideo = require("../models/solutionVideo")

const createProblem = async (req, res) => {

  const { title, description, difficulty, tags,
    visibleTestCases, hiddenTestCases, startCode,
    referenceSolution, problemCreator
  } = req.body;

  try {

    for (const { language, completeCode } of referenceSolution) {

      // source_code: from completeCode
      // language_id: from getLanguageById(language)
      // stdin: from visibleTestCases
      // expectedOutput: from visibleTestCases

      const languageId = getLanguageById(language);


      // created Batch submission
      const submissions = visibleTestCases.map((testcases) => ({
        source_code: completeCode,
        language_id: languageId,
        stdin: testcases.input,
        expected_output: testcases.output
      }));
      // const submissions = [
      //     {
      //       "language_id": 46,
      //       "source_code": "echo hello from Bash",
      //       stdin:23,
      //       expected_output:43,
      //     },
      //     {
      //       "language_id": 123456789,
      //       "source_code": "print(\"hello from Python\")"
      //     },
      //     {
      //       "language_id": 72,
      //       "source_code": ""
      //     }
      //   ]

      // console.log("Backend payload:", JSON.stringify(req.body, null, 2));

      const submitResult = await submitBatch(submissions);
      // console.log(submitResult);

      const resultToken = submitResult.map((value) => value.token);
      // ["db54881d-bcf5-4c7b-a2e3-d33fe7e25de7","ecc52a9b-ea80-4a00-ad50-4ab6cc3bb2a1","1b35ec3b-5776-48ef-b646-d5522bdeb2cc"]

      const testResult = await submitToken(resultToken);
      //  console.log(testResult);

      // Check every test case result
      // for (let i = 0; i < testResult.length; i++) {
      //   const test = testResult[i];

      //   if (test.status_id !== 3) {
      //     console.log("Failed language:", language);
      //     console.log("Judge0 result:", test);
      //     console.log("Expected test case:", visibleTestCases[i]);

      //     return res.status(400).json({
      //       message: "Reference solution failed",
      //       language,
      //       status: test.status,
      //       input: visibleTestCases[i]?.input,
      //       expected: visibleTestCases[i]?.output,
      //       actual: test.stdout,
      //       stderr: test.stderr,
      //       compile_output: test.compile_output
      //     });
      //   }
      // }


      for (const test of testResult) {
        if (test.status_id !== 3) {
          console.log("Failed test result:", test);
          return res.status(400).json({
            message: "Reference solution failed",
            status: test.status,
            stderr: test.stderr,
            compile_output: test.compile_output,
            stdout: test.stdout
          });
        }
      }


    } // this for of loop will run for all the languages in the referenceSolution array. If any of the test cases fail, it will return an error response and stop the execution of the function.

    // Now if all the test cases pass, we can save the problem in the database. i.e. all the DSA problem that admin created is correct and working fine. So we can save it in the database.

    const userProblem = await Problem.create({
      ...req.body,
      problemCreator: req.result._id // This came from the auth middleware, which is the user who is creating the problem. It is admin id. In middleware result was attached with req.
    });

    res.status(201).send("Problem Saved Successfully");
  }
  catch (err) {
    res.status(400).send("Error: " + err);
  }

}

const updateProblem = async (req, res) => {

  const { id } = req.params;
  const { title, description, difficulty, tags,
    visibleTestCases, hiddenTestCases, startCode,
    referenceSolution, problemCreator
  } = req.body;

  try {

    if (!id) {
      return res.status(400).send("Missing ID Field");
    }

    const DsaProblem = await Problem.findById(id);
    if (!DsaProblem) {
      return res.status(404).send("ID is not persent in server");
    }

    for (const { language, completeCode } of referenceSolution) {


      // source_code:
      // language_id:
      // stdin: 
      // expectedOutput:

      const languageId = getLanguageById(language);

      // I am creating Batch submission
      const submissions = visibleTestCases.map((testcase) => ({
        source_code: completeCode,
        language_id: languageId,
        stdin: testcase.input,
        expected_output: testcase.output
      }));


      const submitResult = await submitBatch(submissions);
      // console.log(submitResult);

      const resultToken = submitResult.map((value) => value.token);

      // ["db54881d-bcf5-4c7b-a2e3-d33fe7e25de7","ecc52a9b-ea80-4a00-ad50-4ab6cc3bb2a1","1b35ec3b-5776-48ef-b646-d5522bdeb2cc"]

      const testResult = await submitToken(resultToken);

      //  console.log(testResult);

      for (const test of testResult) {
        if (test.status_id != 3) {
          return res.status(400).send("Error Occured");
        }
      }

    }


    const newProblem = await Problem.findByIdAndUpdate(id, { ...req.body }, { runValidators: true, new: true });

    res.status(200).send(newProblem);
  }
  catch (err) {
    res.status(500).send("Error: " + err);
  }
}

const deleteProblem = async (req, res) => {

  const { id } = req.params;
  try {

    if (!id)
      return res.status(400).send("ID is Missing");

    const deletedProblem = await Problem.findByIdAndDelete(id);

    if (!deletedProblem)
      return res.status(404).send("Problem is Missing");


    res.status(200).send("Successfully Deleted");
  }
  catch (err) {

    res.status(500).send("Error: " + err);
  }
}


const getProblemById = async (req, res) => {

  const { id } = req.params;
  try {

    if (!id)
      return res.status(400).send("ID is Missing");

    const getProblem = await Problem.findById(id).select('_id title description difficulty tags visibleTestCases startCode referenceSolution ');


    if (!getProblem)
      return res.status(404).send("Problem is Missing");

    const videos = await SolutionVideo.findOne({ problemId: id });
    // console.log("videos:", videos);

    // It is not necessary that every problem will have a video solution. So if videos is null then we will not send the video data in the response. But if videos is not null then we will send the video data in the response.
   if(videos){   
    
   const responseData = {
    ...getProblem.toObject(),
    secureUrl:videos.secureUrl,
    thumbnailUrl : videos.thumbnailUrl,
    duration : videos.duration,
   } 
  
   return res.status(200).send(responseData);
   }


    res.status(200).send(getProblem);
  }
  catch (err) {
    res.status(500).send("Error: " + err);
  }
}

const getAllProblem = require('./listProblems');

const solvedAllProblembyUser = async (req, res) => {
  try {

    const userId = req.result._id;

    const user = await User.findById(userId).populate({
      path: "problemSolved",
      select: "_id title difficulty tags"
    });

    // const count = req.result.problemSolved.length;
    // console.log(count);

    // res.status(200).send(user);
    res.status(200).send(user.problemSolved);

  }
  catch (err) {
    res.status(500).send("Server Error");
  }
}

const submittedProblem = async (req, res) => {

  try {

    const userId = req.result._id;
    const problemId = req.params.pid;

    const ans = await Submission.find({ userId, problemId });

    return res.status(200).json(ans);

  }
  catch (err) {
    res.status(500).send("Server Error");
  }
}

module.exports = { createProblem, updateProblem, deleteProblem, getProblemById, getAllProblem, solvedAllProblembyUser, submittedProblem };

