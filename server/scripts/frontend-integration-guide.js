import fetch from 'node-fetch';

async function showTokenStructure() {
  try {
    console.log('🔐 Testing Admin Login for Frontend Integration\n');
    
    const response = await fetch('http://localhost:5000/api/v1/admin/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@example.com',
        password: 'admin123'
      })
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Login Response Structure:');
      console.log('─'.repeat(50));
      console.log(`Status: ${response.status}`);
      console.log(`Response Body:`);
      console.log(JSON.stringify(data, null, 2));
      console.log('─'.repeat(50));
      
      console.log('\n📋 Frontend Integration Guide:');
      console.log('─'.repeat(50));
      console.log('1. Make POST request to: /api/v1/admin/login');
      console.log('2. Extract token from: response.data.token');
      console.log('3. Store token in localStorage/sessionStorage');
      console.log('4. Use token in headers as: Authorization: Bearer <token>');
      console.log('─'.repeat(50));
      
      console.log('\n🔑 Token Details:');
      console.log('─'.repeat(50));
      console.log(`Token Location: data.token`);
      console.log(`Token Value: ${data.data.token}`);
      console.log(`Token Length: ${data.data.token.length} characters`);
      console.log('─'.repeat(50));
      
      console.log('\n💡 Example Frontend Code:');
      console.log('─'.repeat(50));
      console.log(`
// Login
const loginResponse = await fetch('/api/v1/admin/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'admin@example.com', password: 'admin123' })
});
const loginData = await loginResponse.json();

// Store token
const token = loginData.data.token;
localStorage.setItem('adminToken', token);

// Use token in subsequent requests
const machinesResponse = await fetch('/api/v1/admin/machines', {
  headers: { 'Authorization': \`Bearer \${token}\` }
});
      `);
      console.log('─'.repeat(50));
      
      // Test the token
      console.log('\n🧪 Testing Token Usage:');
      console.log('─'.repeat(50));
      
      const testResponse = await fetch('http://localhost:5000/api/v1/admin/machines', {
        headers: {
          'Authorization': `Bearer ${data.data.token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log(`✅ Test Request Status: ${testResponse.status}`);
      if (testResponse.ok) {
        console.log('✅ Token is working correctly!');
      } else {
        console.log('❌ Token test failed');
      }
      
    } else {
      console.log('❌ Login failed:');
      console.log(`Status: ${response.status}`);
      console.log('Response:', data);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

showTokenStructure();
