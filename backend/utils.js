const cloudscraper = require('cloudscraper');

async function sendRequest({ url, method = 'POST', headers = {}, data = {}, files = null, timeout = 15000 }) {
  try {
    let options = {
      method,
      uri: url,
      headers,
      timeout,
      resolveWithFullResponse: true,
      simple: false,
      form: data,
    };

    if (files) {
      options.formData = data;
      for (const [key, file] of Object.entries(files)) {
        options.formData[key] = {
          value: file.buffer,
          options: {
            filename: file.originalname,
            contentType: file.mimetype,
          },
        };
      }
      delete options.form;
    }

    const response = await cloudscraper(options);
    return { statusCode: response.statusCode, body: response.body };
  } catch (err) {
    return { error: err.message || err.toString() };
  }
}

module.exports = { sendRequest };
