// Node's built-in cryptography module.
const crypto = require('crypto');

// Note this object is purely in memory
const users = {};

// sha1 is a bit of a quicker hash algorithm for insecure things
let etag = crypto.createHash('sha1').update(JSON.stringify(users));
// grab the hash as a hex string
let digest = etag.digest('hex');

const respondJSON = (request, response, status, object) => {
  const headers = {
    'Content-Type': 'application/json',
    etag: digest,
  };
  console.log(`respondJSON ${status}`);
  response.writeHead(status, headers);
  response.write(JSON.stringify(object));
  response.end();
};

const respondJSONMeta = (request, response, status) => {
  console.log(`respondJSONMeta ${status}`);
  const headers = {
    'Content-Type': 'application/json',
    etag: digest,
  };
  response.writeHead(status, headers);
  response.end();
};

const getUsers = (request, response) => {
  const responseJSON = {
    users,
  };

  if (request.headers['if-none-match'] === digest) {
    console.log(request.headers['if-none-match']);

    return respondJSONMeta(request, response, 304);
  }

  return respondJSON(request, response, 200, responseJSON);
};

const getUserMeta = (request, response) => {
  if (request.headers['if-none-match'] === digest) {
    console.log(request.headers['if-none-match']);

    return respondJSONMeta(request, response, 304);
  }
  return respondJSONMeta(request, response, 200);
};

const notFound = (request, response) => {
  if (request.headers['if-none-match'] === digest) {
    console.log(request.headers['if-none-match']);
    return respondJSONMeta(request, response, 404);
  }
  const responseJSON = {
    id: 'notFound',
    message: 'The page you are looking for was not found.',
  };
  return respondJSON(request, response, 404, responseJSON);
};

const addUser = (request, response, body) => {
  // default json message
  const responseJSON = {
    message: 'Name and age are both required.',
  };

  // check to make sure we have both fields
  // We might want more validation than just checking if they exist
  // This could easily be abused with invalid types (such as booleans, numbers, etc)
  // If either are missing, send back an error message as a 400 badRequest
  if (!body.name || !body.age) {
    responseJSON.id = 'missingParams';
    return respondJSON(request, response, 400, responseJSON);
  }

  // default status code to 201 created
  let responseCode = 201;

  // if that user's name already exists in our object
  // then switch to a 204 updated status
  if (users[body.name]) {
    users[body.name].age = body.age;
    responseCode = 204;
  } else {
    // otherwise create an object with that name
    users[body.name] = {};
  }

  // add or update fields for this user name
  users[body.name].name = body.name;
  users[body.name].age = body.age;
  console.log(`body.name: ${body.name}`);
  console.log(`body.age: ${body.age}`);
  etag = crypto.createHash('sha1').update(JSON.stringify(users));
  digest = etag.digest('hex');

  // if response is created, then set our created message
  // and sent response with a message
  if (responseCode === 201) {
    responseJSON.message = 'Created Successfully';
    return respondJSON(request, response, responseCode, responseJSON);
  }
  // 204 has an empty payload, just a success
  // It cannot have a body, so we just send a 204 without a message
  // 204 will not alter the browser in any way!!!
  return respondJSONMeta(request, response, responseCode);
};

const notFoundMeta = (request, response) =>
  respondJSONMeta(request, response, 404);

module.exports = {
  getUsers,
  getUserMeta,
  notFound,
  notFoundMeta,
  addUser,
};
