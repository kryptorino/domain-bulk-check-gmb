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
 * Detect location based on domain TLD
 */
function getLocationFromDomain(domain) {
    if (domain.endsWith('.co.uk') || domain.endsWith('.uk')) {
        return { location_code: 2826, language_code: 'en' }; // United Kingdom
    } else if (domain.endsWith('.de')) {
        return { location_code: 2276, language_code: 'de' }; // Germany
    } else if (domain.endsWith('.com') || domain.endsWith('.net')) {
        return { location_code: 2840, language_code: 'en' }; // United States
    }
    // Default to UK for most cases
    return { location_code: 2826, language_code: 'en' };
}

/**
 * Extract business name from domain for better search
 */
function extractBusinessName(domain) {
    // Remove TLD
    let name = domain.replace(/\.(co\.uk|uk|com|de|net|org|io)$/i, '');

    // Split by common separators and capitalize
    name = name.split(/[-_.]/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

    return name;
}

/**
 * Search for GMB using Business Data API with multiple strategies
 */
async function searchGMBwithBusinessAPI(domain, credentials) {
    try {
        const endpoint = '/business_data/google/my_business_info/live';
        const location = getLocationFromDomain(domain);
        const businessName = extractBusinessName(domain);

        // Try multiple search strategies
        const searchVariants = [
            businessName, // Just business name (most likely to work)
            `${businessName} ${domain}`, // Business name + domain
            domain // Original domain
        ];

        // Try each search variant
        for (const keyword of searchVariants) {
            const requestData = [{
                "keyword": keyword,
                "language_code": location.language_code,
                "location_code": location.location_code,
                "depth": 10
            }];

            try {
                const response = await makeDataForSEORequest(endpoint, requestData, credentials);

                console.log(`Search variant: "${keyword}"`);
                console.log('API Response:', JSON.stringify(response, null, 2));

                if (response.tasks && response.tasks.length > 0) {
                    const task = response.tasks[0];

                    console.log('Task status_code:', task.status_code);
                    console.log('Task status_message:', task.status_message);
                    console.log('Task result:', JSON.stringify(task.result, null, 2));

                    if (task.status_code === 20000 && task.result?.[0]?.items) {
                        const items = task.result[0].items;

                        console.log('Found items:', items.length);

                        // Check if we found results
                        if (items.length > 0) {
                            // Try to find exact domain match first
                            for (const item of items) {
                                if (item.domain && item.domain.includes(domain.replace(/^www\./, ''))) {
                                    return {
                                        domain: domain,
                                        status: 'found',
                                        gmbName: item.title || 'N/A',
                                        address: item.address || 'N/A',
                                        rating: item.rating?.value || 0,
                                        reviewsCount: item.rating?.votes_count || 0,
                                        phone: item.phone || 'N/A',
                                        website: item.domain || 'N/A',
                                        category: item.category || 'N/A',
                                        workingHours: item.work_hours || null
                                    };
                                }
                            }

                            // If no exact match, return first result
                            const gmbData = items[0];
                            return {
                                domain: domain,
                                status: 'found',
                                gmbName: gmbData.title || 'N/A',
                                address: gmbData.address || 'N/A',
                                rating: gmbData.rating?.value || 0,
                                reviewsCount: gmbData.rating?.votes_count || 0,
                                phone: gmbData.phone || 'N/A',
                                website: gmbData.domain || 'N/A',
                                category: gmbData.category || 'N/A',
                                workingHours: gmbData.work_hours || null
                            };
                        }
                    }
                }
            } catch (variantError) {
                // Continue to next variant if this one fails
                console.log(`Search variant "${keyword}" failed, trying next...`);
                continue;
            }
        }

        return {
            domain: domain,
            status: 'not-found',
            message: 'Kein Google My Business Eintrag gefunden'
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
 * Check Google My Business for a single domain
 */
async function checkGoogleMyBusiness(domain, credentials) {
    // Use Business Data API for GMB detection
    return await searchGMBwithBusinessAPI(domain, credentials);
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

    const { domain, credentials } = req.body;

    if (!domain) {
        res.status(400).json({ error: 'Domain is required' });
        return;
    }

    if (!credentials || !credentials.login || !credentials.password) {
        res.status(400).json({ error: 'API credentials are required' });
        return;
    }

    const result = await checkGoogleMyBusiness(domain, credentials);
    res.status(200).json(result);
};
