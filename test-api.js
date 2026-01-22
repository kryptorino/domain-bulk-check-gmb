const axios = require('axios');

// Test script to debug DataForSEO API calls
async function testAPI() {
    // You need to provide your credentials here
    const credentials = {
        login: 'YOUR_LOGIN',  // Replace with actual login
        password: 'YOUR_PASSWORD'  // Replace with actual password
    };

    const auth = Buffer.from(`${credentials.login}:${credentials.password}`).toString('base64');

    console.log('=== Testing DataForSEO APIs ===\n');

    // Test 1: Business Data API
    console.log('TEST 1: Business Data API - My Business Info');
    try {
        const businessDataRequest = [{
            "keyword": "Gallaghers Carpet Cleaning",
            "language_code": "en",
            "location_name": "United Kingdom"
        }];

        const response1 = await axios.post(
            'https://api.dataforseo.com/v3/business_data/google/my_business_info/live',
            businessDataRequest,
            {
                headers: {
                    'Authorization': `Basic ${auth}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log('Status:', response1.status);
        console.log('Response:', JSON.stringify(response1.data, null, 2));
    } catch (error) {
        console.log('ERROR:', error.response?.data || error.message);
    }

    console.log('\n---\n');

    // Test 2: SERP Organic API
    console.log('TEST 2: SERP Organic API');
    try {
        const serpRequest = [{
            "keyword": "Gallaghers Carpet Cleaning",
            "language_code": "en",
            "location_name": "United Kingdom",
            "device": "desktop",
            "os": "windows"
        }];

        const response2 = await axios.post(
            'https://api.dataforseo.com/v3/serp/google/organic/live/advanced',
            serpRequest,
            {
                headers: {
                    'Authorization': `Basic ${auth}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log('Status:', response2.status);
        console.log('Tasks:', response2.data.tasks?.length);

        if (response2.data.tasks && response2.data.tasks[0]) {
            const task = response2.data.tasks[0];
            console.log('Task Status Code:', task.status_code);
            console.log('Task Status Message:', task.status_message);

            if (task.result && task.result[0]) {
                const result = task.result[0];
                console.log('Items count:', result.items?.length);

                // Show item types
                if (result.items) {
                    const types = result.items.map(item => item.type);
                    console.log('Item types found:', [...new Set(types)]);

                    // Find local_pack
                    const localPack = result.items.find(item => item.type === 'local_pack');
                    if (localPack) {
                        console.log('\nFOUND LOCAL_PACK!');
                        console.log('Local pack items:', localPack.items?.length);
                        if (localPack.items && localPack.items[0]) {
                            console.log('First local pack item:', JSON.stringify(localPack.items[0], null, 2));
                        }
                    } else {
                        console.log('\nNO LOCAL_PACK FOUND');
                    }
                }
            }
        }
    } catch (error) {
        console.log('ERROR:', error.response?.data || error.message);
    }

    console.log('\n=== Tests Complete ===');
}

testAPI();
