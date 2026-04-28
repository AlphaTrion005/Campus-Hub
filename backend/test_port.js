const http = require('http');

const test = (path) => {
  const options = {
    hostname: 'localhost',
    port: 5000,
    path: path,
    method: 'GET'
  };

  const req = http.request(options, (res) => {
    console.log(`${path} -> STATUS: ${res.statusCode}`);
  });

  req.on('error', (e) => {
    console.error(`problem with request ${path}: ${e.message}`);
  });

  req.end();
};

test('/');
test('/api/auth/login');
test('/api/resources');
test('/api/events');
test('/api/clubs');
test('/api/lost-found');
test('/api/reports');
test('/api/admin/users');
test('/api/dashboard');
test('/api/schedule');
