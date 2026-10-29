import http from 'node:http';

async function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });
    req.on('error', reject);
    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

function extractCookie(headers) {
  const setCookie = headers['set-cookie'];
  if (!setCookie) return null;
  const cookieStr = Array.isArray(setCookie) ? setCookie[0] : setCookie;
  return cookieStr.split(';')[0];
}

async function runLiveSmoke() {
  console.log('--- STARTING LIVE HTTP SMOKE TEST ---');

  // 1. Unauthenticated root serves Landing Page
  const r1 = await makeRequest({
    hostname: '127.0.0.1',
    port: 3000,
    path: '/',
    method: 'GET'
  });
  console.log(`1. GET / -> Status ${r1.statusCode}, includes 'Gaji habis sebelum akhir bulan?': ${r1.body.includes('Gaji habis sebelum akhir bulan?')}`);
  if (r1.statusCode !== 200 || !r1.body.includes('Gaji habis sebelum akhir bulan?')) throw new Error('Test 1 failed');

  // 2. Register new public user
  const uniqueEmail = `smoke_${Date.now()}@tatadana.id`;
  const postData = new URLSearchParams({
    full_name: 'Budi Santoso',
    username: `smoke_${Date.now().toString(36)}`,
    email: uniqueEmail,
    password: 'password123'
  }).toString();

  const r2 = await makeRequest({
    hostname: '127.0.0.1',
    port: 3000,
    path: '/register',
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(postData)
    }
  }, postData);
  const userCookie = extractCookie(r2.headers);
  console.log(`2. POST /register -> Status ${r2.statusCode}, Location: ${r2.headers.location}, Cookie: ${userCookie ? 'YES' : 'NO'}`);
  if (r2.statusCode !== 302 || (!r2.headers.location.includes('verification-pending') && !r2.headers.location.includes('pending-verification'))) throw new Error('Test 2 failed');

  // 3. User attempts /dashboard while pending -> redirected to /verification-pending
  const r3 = await makeRequest({
    hostname: '127.0.0.1',
    port: 3000,
    path: '/dashboard',
    method: 'GET',
    headers: { 'Cookie': userCookie }
  });
  console.log(`3. Pending user GET /dashboard -> Status ${r3.statusCode}, Location: ${r3.headers.location}`);
  if (r3.statusCode !== 302 || (!r3.headers.location.includes('verification-pending') && !r3.headers.location.includes('pending-verification'))) throw new Error('Test 3 failed');

  // 4. Pending verification page renders
  const r4 = await makeRequest({
    hostname: '127.0.0.1',
    port: 3000,
    path: '/verification-pending',
    method: 'GET',
    headers: { 'Cookie': userCookie }
  });
  console.log(`4. GET /verification-pending -> Status ${r4.statusCode}, Body includes 'Menunggu Verifikasi': ${r4.body.includes('Menunggu Verifikasi')}`);
  if (r4.statusCode !== 200 || !r4.body.includes('Menunggu Verifikasi')) throw new Error('Test 4 failed');

  // 5. Verification status polling endpoint
  const r5 = await makeRequest({
    hostname: '127.0.0.1',
    port: 3000,
    path: '/api/auth/verification-status',
    method: 'GET',
    headers: { 'Cookie': userCookie }
  });
  const statusJson = JSON.parse(r5.body);
  console.log(`5. GET /api/auth/verification-status -> Status: ${statusJson.status}`);
  if (statusJson.status !== 'pending') throw new Error('Test 5 failed');

  // 5b. GET /admin/login redirects to unified /login
  const r5b = await makeRequest({
    hostname: '127.0.0.1',
    port: 3000,
    path: '/admin/login',
    method: 'GET'
  });
  console.log(`5b. GET /admin/login -> Status ${r5b.statusCode}, Location: ${r5b.headers.location}`);
  if (r5b.statusCode !== 302 || r5b.headers.location !== '/login') throw new Error('Test 5b failed');

  // 6. Login as Admin halidanazla10@gmail.com via unified /login
  const adminPostData = new URLSearchParams({
    identifier: 'halidanazla10@gmail.com',
    password: 'adminsecret123'
  }).toString();
  const r6 = await makeRequest({
    hostname: '127.0.0.1',
    port: 3000,
    path: '/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(adminPostData)
    }
  }, adminPostData);
  const adminCookie = extractCookie(r6.headers);
  console.log(`6. Admin POST /login -> Status ${r6.statusCode}, Location: ${r6.headers.location}`);
  if (r6.statusCode !== 302 || r6.headers.location !== '/admin') throw new Error('Test 6 failed');

  // 7. Admin views Admin Dashboard
  const r7 = await makeRequest({
    hostname: '127.0.0.1',
    port: 3000,
    path: '/admin',
    method: 'GET',
    headers: { 'Cookie': adminCookie }
  });
  console.log(`7. Admin GET /admin -> Status ${r7.statusCode}, contains 'Admin Control Center': ${r7.body.includes('Admin Control Center')}`);
  if (r7.statusCode !== 200 || !r7.body.includes('Admin Control Center')) throw new Error('Test 7 failed');

  // 8. Admin approves user
  const approveData = JSON.stringify({ userId: statusJson.id || r4.body.match(/user-id="([^"]+)"/)?.[1] || uniqueEmail });
  // We can approve by passing body to /api/admin/verifications/approve
  // Let's get the user ID from admin users list or DB
  // First query /api/users via admin session to get exact ID
  const approveBody = JSON.stringify({ userId: statusJson.userId });
  const rApprove = await makeRequest({
    hostname: '127.0.0.1',
    port: 3000,
    path: '/api/admin/verifications/approve',
    method: 'POST',
    headers: {
      'Cookie': adminCookie,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(approveBody)
    }
  }, approveBody);
  const approveRes = JSON.parse(rApprove.body);
  console.log(`8. POST /api/admin/verifications/approve -> Success: ${approveRes.ok}, MagicLink: ${approveRes.magicLink}`);
  if (!approveRes.ok || !approveRes.magicLink) throw new Error('Test 8 failed');

  // 9. User verification status polling after approval
  const r9 = await makeRequest({
    hostname: '127.0.0.1',
    port: 3000,
    path: '/api/auth/verification-status',
    method: 'GET',
    headers: { 'Cookie': userCookie }
  });
  const statusJson2 = JSON.parse(r9.body);
  console.log(`9. User polled /api/auth/verification-status -> Status: ${statusJson2.status}`);
  if (statusJson2.status !== 'approved') throw new Error('Test 9 failed');

  // 10. Approved user accessing /dashboard succeeds
  const r10 = await makeRequest({
    hostname: '127.0.0.1',
    port: 3000,
    path: '/dashboard',
    method: 'GET',
    headers: { 'Cookie': userCookie }
  });
  console.log(`10. Approved user GET /dashboard -> Status: ${r10.statusCode}, contains 'Rp 0': ${r10.body.includes('Rp 0')}`);
  if (r10.statusCode !== 200 || !r10.body.includes('Rp 0')) throw new Error('Test 10 failed');

  // 11. Bidirectional Role Isolation:
  // - Admin accessing /dashboard -> redirected to /admin?error=access_denied
  const r11a = await makeRequest({
    hostname: '127.0.0.1',
    port: 3000,
    path: '/dashboard',
    method: 'GET',
    headers: { 'Cookie': adminCookie }
  });
  console.log(`11a. Admin GET /dashboard -> Status: ${r11a.statusCode}, Location: ${r11a.headers.location}`);
  if (r11a.statusCode !== 302 || r11a.headers.location !== '/admin?error=access_denied') throw new Error('Test 11a failed');

  // - User accessing /admin -> redirected to /dashboard?error=access_denied
  const r11b = await makeRequest({
    hostname: '127.0.0.1',
    port: 3000,
    path: '/admin',
    method: 'GET',
    headers: { 'Cookie': userCookie }
  });
  console.log(`11b. User GET /admin -> Status: ${r11b.statusCode}, Location: ${r11b.headers.location}`);
  if (r11b.statusCode !== 302 || r11b.headers.location !== '/dashboard?error=access_denied') throw new Error('Test 11b failed');

  // 12. Passwordless Magic Link Login (Simulate user opening new browser tab with magic link)
  const magicPath = approveRes.magicLink.replace(/^https?:\/\/[^\/]+/, '');
  const r12 = await makeRequest({
    hostname: '127.0.0.1',
    port: 3000,
    path: magicPath,
    method: 'GET'
  });
  const magicCookie = extractCookie(r12.headers);
  console.log(`12. Magic Link GET ${magicPath} -> Status: ${r12.statusCode}, Location: ${r12.headers.location}, New Cookie: ${magicCookie ? 'YES' : 'NO'}`);
  if (r12.statusCode !== 302 || r12.headers.location !== '/dashboard' || !magicCookie) throw new Error('Test 12 failed');

  // 13. Reusing the same magic token must be rejected with error page
  const r13 = await makeRequest({
    hostname: '127.0.0.1',
    port: 3000,
    path: magicPath,
    method: 'GET'
  });
  console.log(`13. Reusing magic token -> Status: ${r13.statusCode}, includes 'Tautan Tidak Berlaku': ${r13.body.includes('Tautan Tidak Berlaku')}`);
  if (r13.statusCode !== 200 || !r13.body.includes('Tautan Tidak Berlaku')) throw new Error('Test 13 failed');

  console.log('\n🎉 ALL 13 END-TO-END LIVE SMOKE CHECKS PASSED PERFECTLY!');
}

runLiveSmoke().catch(err => {
  console.error('Smoke test failed:', err);
  process.exit(1);
});
