async function testConnection() {
  console.log('--- Debugging Backend APIs (using Fetch) ---');
  
  const targets = [
    { name: 'Root Server', url: 'http://localhost:5000/' },
    { name: 'Resources API', url: 'http://localhost:5000/api/resources' },
    { name: 'Dashboard API', url: 'http://localhost:5000/api/dashboard' },
    { name: 'Events API', url: 'http://localhost:5000/api/events' }
  ];

  for (const target of targets) {
    try {
      const res = await fetch(target.url);
      if (res.ok) {
        console.log(`✅ ${target.name}: Success (Status: ${res.status})`);
      } else {
        console.log(`ℹ️ ${target.name} note: ${res.status === 401 ? 'Working (Login Required)' : `Response Status: ${res.status}`}`);
      }
    } catch (err) {
      console.error(`❌ ${target.name}: Failed to connect. Is the server running?`);
    }
  }
}

testConnection();
