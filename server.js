const express = require('express');
const cors = require('cors');
const axios = require('axios');
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static('.'));

const PORT = 3000;

// DataForSEO API Base URL
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
        // Using DataForSEO's Business Data API - Google My Business Live endpoint
        const endpoint = '/business_data/google/my_business_info/live';

        const requestData = [{
            "keyword": domain,
            "language_code": "de",
            "location_code": 2276, // Germany
            "depth": 1
        }];

        const response = await makeDataForSEORequest(endpoint, requestData, credentials);

        // Check if we got valid results
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
 * Endpoint to check multiple domains
 */
app.post('/api/check-domains', async (req, res) => {
    const { domains, credentials } = req.body;

    if (!domains || !Array.isArray(domains) || domains.length === 0) {
        return res.status(400).json({ error: 'Domains array is required' });
    }

    if (!credentials || !credentials.login || !credentials.password) {
        return res.status(400).json({ error: 'API credentials are required' });
    }

    const results = [];

    // Process domains sequentially to avoid rate limiting
    for (const domain of domains) {
        const cleanDomain = domain.trim();
        if (cleanDomain) {
            console.log(`Checking domain: ${cleanDomain}`);
            const result = await checkGoogleMyBusiness(cleanDomain, credentials);
            results.push(result);

            // Small delay to avoid rate limiting (adjust as needed)
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }

    res.json({
        success: true,
        results: results,
        total: results.length,
        found: results.filter(r => r.status === 'found').length,
        notFound: results.filter(r => r.status === 'not-found').length,
        errors: results.filter(r => r.status === 'error').length
    });
});

/**
 * Endpoint to check a single domain (for testing)
 */
app.post('/api/check-domain', async (req, res) => {
    const { domain, credentials } = req.body;

    if (!domain) {
        return res.status(400).json({ error: 'Domain is required' });
    }

    if (!credentials || !credentials.login || !credentials.password) {
        return res.status(400).json({ error: 'API credentials are required' });
    }

    const result = await checkGoogleMyBusiness(domain, credentials);
    res.json(result);
});

/**
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Server is running' });
});

app.listen(PORT, () => {
    console.log(`🚀 Server läuft auf http://localhost:${PORT}`);
    console.log(`📋 Öffne http://localhost:${PORT} im Browser`);
});
