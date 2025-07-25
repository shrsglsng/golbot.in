import fetch from 'node-fetch';

async function testAdminLogin() {
  try {
    const response = await fetch('http://localhost:5000/api/v1/admin/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@example.com',
        password: 'admin123'  // You'll need to know the actual password
      })
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Admin login successful!');
      console.log('Full response:', JSON.stringify(data, null, 2));
      
      // Extract token based on actual response structure
      const token = data.token || data.result?.token || data.data?.token;
      if (token) {
        console.log('Token:', token.substring(0, 50) + '...');
        
        // Test authenticated request
        const machinesResponse = await fetch('http://localhost:5000/api/v1/admin/machines', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        const machinesData = await machinesResponse.json();
        console.log('\n✅ Authenticated request result:');
        console.log('Status:', machinesResponse.status);
        console.log('Response:', JSON.stringify(machinesData, null, 2));
      } else {
        console.log('❌ No token found in response');
      }
      
    } else {
      console.log('❌ Admin login failed:');
      console.log('Status:', response.status);
      console.log('Response:', data);
    }
  } catch (error) {
    console.error('❌ Error testing admin login:', error.message);
  }
}

testAdminLogin();
