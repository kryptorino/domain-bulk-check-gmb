const axios = require('axios');

const DATAFORSEO_API_BASE = 'https://api.dataforseo.com/v3';

/**
 * Helper function to make DataForSEO API requests
 */
async function makeDataForSEORequest(endpoint, data, credentials) {
    const auth = Buffer.from(`${credentials.login}:${credentials.password}`).toString('base64');

    try {
        const response = await axios.post(
            `${DATAFORSEO_API_BASE}${endpoint}`,
            data,
            {
                headers: {
                    'Authorization': `Basic ${auth}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        return response.data;
    } catch (error) {
        console.error('DataForSEO API Error:', error.response?.data || error.message);
        throw error;
    }
}

/**
 * Check Google My Business for a single domain
 */
async function checkGoogleMyBusiness(domain, credentials) {
    try {
        const endpoint = '/business_data/google/my_business_info/live';

        const requestData = [{
            "keyword": domain,
            "language_code": "de",
            "location_code": 2276, // Germany
            "depth": 1
        }];

        const response = await makeDataForSEORequest(endpoint, requestData, credentials);

        if (response.tasks && response.tasks.length > 0) {
            const task = response.tasks[0];

            if (task.status_code === 20000) {
                const result = task.result?.[0];

                if (result && result.items && result.items.length > 0) {
                    const gmbData = result.items[0];

                    return {
                        domain: domain,
                        status: 'found',
                        gmbName: gmbData.title || 'N/A',
                        address: gmbData.address || 'N/A',
                        rating: gmbData.rating?.value || 0,
                        reviewsCount: gmbData.rating?.votes_count || 0,
                        phone: gmbData.phone || 'N/A',
                        website: gmbData.url || 'N/A',
                        category: gmbData.category || 'N/A',
                        workingHours: gmbData.work_hours || null,
                        rawData: gmbData
                    };
                } else {
                    return {
                        domain: domain,
                        status: 'not-found',
                        message: 'Kein Google My Business Eintrag gefunden'
                    };
                }
            } else {
                return {
                    domain: domain,
                    status: 'error',
                    message: `API Error: ${task.status_message || 'Unknown error'}`
                };
            }
        }

        return {
            domain: domain,
            status: 'error',
            message: 'Keine gültige Antwort von der API'
        };

    } catch (error) {
        return {
            domain: domain,
            status: 'error',
            message: error.response?.data?.status_message || error.message || 'API request failed'
        };
    }
}

/**
 * Vercel Serverless Function Handler
 */
module.exports = async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle OPTIONS request
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // Only allow POST
    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }

    const { domains, credentials } = req.body;

    if (!domains || !Array.isArray(domains) || domains.length === 0) {
        res.status(400).json({ error: 'Domains array is required' });
        return;
    }

    if (!credentials || !credentials.login || !credentials.password) {
        res.status(400).json({ error: 'API credentials are required' });
        return;
    }

    const results = [];

    // Process domains sequentially to avoid rate limiting
    for (const domain of domains) {
        const cleanDomain = domain.trim();
        if (cleanDomain) {
            console.log(`Checking domain: ${cleanDomain}`);
            const result = await checkGoogleMyBusiness(cleanDomain, credentials);
            results.push(result);

            // Small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }

    res.status(200).json({
        success: true,
        results: results,
        total: results.length,
        found: results.filter(r => r.status === 'found').length,
        notFound: results.filter(r => r.status === 'not-found').length,
        errors: results.filter(r => r.status === 'error').length
    });
};
