import fs from 'fs';
import FormData from 'form-data';
import fetch from 'node-fetch';

async function testAdvisoryUpload() {
  try {
    console.log('🧪 Testing BIAKOYE RICE ADVISORY upload...');
    
    // First, sign in to get a token
    const signInResponse = await fetch('http://localhost:3002/sign-in', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123'
      })
    });
    
    const signInData = await signInResponse.json();
    if (!signInData.success) {
      console.error('❌ Sign in failed:', signInData.error);
      return;
    }
    
    const token = signInData.accessToken;
    console.log('✅ Signed in successfully');
    
    // Upload the advisory file
    const form = new FormData();
    form.append('file', fs.createReadStream('./BIAKOYE RICE ADVISORY.xlsx'));
    form.append('title', 'Biakoye Rice Advisory 2025');
    form.append('description', 'Rice production advisory for Biakoye district');
    form.append('reportType', 'Advisory');
    
    const uploadResponse = await fetch('http://localhost:3002/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        ...form.getHeaders()
      },
      body: form
    });
    
    const uploadData = await uploadResponse.json();
    console.log('📤 Upload Response:', JSON.stringify(uploadData, null, 2));
    
    if (uploadData.success) {
      console.log('✅ File uploaded successfully!');
      
      // Test the commodity advisory API
      console.log('\n🔍 Testing commodity advisory API...');
      
      const apiResponse = await fetch('http://localhost:3002/api/commodity-advisory?district=Biakoye&crop=rice');
      const apiData = await apiResponse.json();
      
      console.log('📊 API Response:', JSON.stringify(apiData, null, 2));
      
      if (apiData.success && apiData.data.length > 0) {
        console.log(`✅ Found ${apiData.data.length} advisory records for Biakoye rice!`);
        
        // Show first few records
        console.log('\n📋 Sample Advisory Records:');
        apiData.data.slice(0, 5).forEach((record, index) => {
          console.log(`${index + 1}. Stage: ${record.stage}, Week: ${record.startWeek}-${record.endWeek}, District: ${record.district}`);
        });
      } else {
        console.log('⚠️ No advisory records found');
      }
      
    } else {
      console.error('❌ Upload failed:', uploadData.error);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testAdvisoryUpload();