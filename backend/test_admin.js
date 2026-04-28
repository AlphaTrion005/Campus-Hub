require("dotenv").config();
const dns = require("dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const http = require('http');

// Step 1: Login as dev to get a token
const loginData = JSON.stringify({ email: "dev@testuni.edu", password: "dev123456" });

const loginReq = http.request({
  hostname: 'localhost', port: 5000, path: '/api/auth/login', method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(loginData) }
}, (res) => {
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    if (res.statusCode !== 200) {
      console.log('❌ Login failed:', res.statusCode, body);
      return;
    }
    const { token, user } = JSON.parse(body);
    console.log('✅ Logged in as:', user.name, '| Roles:', user.roles);

    // Step 2: Test GET /api/admin/users
    const getUsers = http.request({
      hostname: 'localhost', port: 5000, path: '/api/admin/users', method: 'GET',
      headers: { 'x-auth-token': token }
    }, (res2) => {
      let body2 = '';
      res2.on('data', (chunk) => body2 += chunk);
      res2.on('end', () => {
        console.log('\n--- GET /api/admin/users ---');
        console.log('Status:', res2.statusCode);
        if (res2.statusCode === 200) {
          const users = JSON.parse(body2);
          console.log('✅ Found', users.length, 'users');
          if (users.length > 0) {
            const testUser = users.find(u => u._id !== user.id) || users[0];
            console.log('Test user:', testUser.name, '| ID:', testUser._id, '| Roles:', testUser.roles);
            
            // Step 3: Test PUT /api/admin/users/:id/role
            const newRoles = [...testUser.roles];
            if (!newRoles.includes('Student')) newRoles.push('Student');
            const roleData = JSON.stringify({ roles: newRoles });
            
            const updateReq = http.request({
              hostname: 'localhost', port: 5000, 
              path: `/api/admin/users/${testUser._id}/role`, 
              method: 'PUT',
              headers: { 'x-auth-token': token, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(roleData) }
            }, (res3) => {
              let body3 = '';
              res3.on('data', (chunk) => body3 += chunk);
              res3.on('end', () => {
                console.log('\n--- PUT /api/admin/users/:id/role ---');
                console.log('Status:', res3.statusCode);
                console.log('Response:', body3);
                if (res3.statusCode === 200) {
                  console.log('✅ Role update WORKS');
                } else {
                  console.log('❌ Role update FAILED');
                }
              });
            });
            updateReq.on('error', (e) => console.error('PUT error:', e.message));
            updateReq.write(roleData);
            updateReq.end();
          }
        } else {
          console.log('❌ Failed:', body2);
        }
      });
    });
    getUsers.on('error', (e) => console.error('GET error:', e.message));
    getUsers.end();
  });
});

loginReq.on('error', (e) => console.error('Login error:', e.message));
loginReq.write(loginData);
loginReq.end();
