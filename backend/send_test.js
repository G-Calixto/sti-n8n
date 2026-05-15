const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');

async function run() {
  const tmpPath = path.join(__dirname, 'temp.jpg');
  fs.writeFileSync(tmpPath, 'test');

  const form = new FormData();
  form.append('teacherName', 'Teste');
  form.append('consentAccepted', 'true');
  form.append('correctAnswer', 'B');
  form.append('submissionId', 'sub-test-123');
  form.append('image', fs.createReadStream(tmpPath));

  try {
    const resp = await axios.post('http://localhost:3000/api/submit', form, {
      headers: form.getHeaders(),
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    });
    console.log('Status:', resp.status);
    console.log('Body:', resp.data);
  } catch (err) {
    if (err.response) {
      console.error('Response status:', err.response.status);
      console.error('Response data:', err.response.data);
    } else {
      console.error('Error:', err.message);
    }
  }
}

run();
