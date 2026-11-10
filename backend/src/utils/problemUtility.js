const axios = require('axios');


const getLanguageById = (lang) => {

const language = {
    "c++": 54,
    "java": 62,
    "javascript": 63
  };

  return language[lang.toLowerCase()];
}


const submitBatch = async (submissions) => {


  const options = {
    method: 'POST',
    url: process.env.BATCH_SUBMISSION_URL,
    params: {
      base64_encoded: 'false',
      wait: 'false',
      fields: '*'
    },
    headers: {
      'Content-Type': 'application/json'
    },
    data: {
      submissions
    }
  };

  async function fetchData() {
    try {
      const response = await axios.request(options);
      return response.data;
    } catch (error) {
      console.error(
        "Judge0 error:",
        error.response?.data || error.message
      );
      throw error;

    }
  }

  return await fetchData();
}

// const waiting = async(timer)=>{
//   setTimeout(()=>{
//     return 1;
//   },timer);
// }
const waiting = (timer) => {
  return new Promise((resolve) => {
    setTimeout(resolve, timer);
  });
};

const submitToken = async (resultToken) => {

  const options = {
    method: 'GET',
    url: process.env.BATCH_SUBMISSION_URL,
    params: {
      tokens: resultToken.join(","),
      base64_encoded: 'false',
      fields: '*'
    }
  };

  async function fetchData() {
    try {
      const response = await axios.request(options);
      return response.data;
    } catch (error) {
      console.error(
        "Judge0 error:",
        error.response?.data || error.message
      );
      throw error;

    }
  }


  while (true) { // Check whether status_id is 1 or 2 if so then wait for 1 second and then check again until status_id is greater than 2 for all the submissions.

    const result = await fetchData();

    const IsResultObtained = result.submissions.every((r) => r.status_id > 2); // .every() method checks if all the elements in the array satisfy the condition. In this case, it checks if the status_id of all submissions is greater than 2.

    if (IsResultObtained)
      return result.submissions;


    await waiting(1000); /// wait for 1 second before checking again.
  }



}


module.exports = { getLanguageById, submitBatch, submitToken };

