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
 * Search for GMB via Google SERP (better detection)
 */
async function searchGMBviaSERP(domain, credentials) {
    try {
        const endpoint = '/serp/google/organic/live/advanced';
        const location = getLocationFromDomain(domain);
        const businessName = extractBusinessName(domain);

        // Try multiple search strategies
        const searchVariants = [
            domain, // Original domain
            `${businessName} ${domain}`, // Business name + domain
            businessName // Just business name
        ];

        // Try each search variant
        for (const keyword of searchVariants) {
            const requestData = [{
                "keyword": keyword,
                "language_code": location.language_code,
                "location_code": location.location_code,
                "device": "desktop",
                "os": "windows",
                "depth": 100
            }];

            const response = await makeDataForSEORequest(endpoint, requestData, credentials);

            if (response.tasks && response.tasks.length > 0) {
                const task = response.tasks[0];

                if (task.status_code === 20000 && task.result?.[0]?.items) {
                    const items = task.result[0].items;

                    // Search for local_pack or knowledge_graph with GMB data
                    for (const item of items) {
                        // Check for local pack results
                        if (item.type === 'local_pack' && item.items && item.items.length > 0) {
                            // Check if any local pack item matches the domain
                            for (const localItem of item.items) {
                                if (localItem.url && localItem.url.includes(domain.replace(/^www\./, ''))) {
                                    return {
                                        domain: domain,
                                        status: 'found',
                                        gmbName: localItem.title || 'N/A',
                                        address: localItem.address || 'N/A',
                                        rating: localItem.rating?.value || 0,
                                        reviewsCount: localItem.rating?.votes_count || 0,
                                        phone: localItem.phone || 'N/A',
                                        website: localItem.url || 'N/A',
                                        category: localItem.category || 'N/A',
                                        workingHours: localItem.work_hours || null
                                    };
                                }
                            }
                            // If no exact match, return first result
                            const localResult = item.items[0];
                            return {
                                domain: domain,
                                status: 'found',
                                gmbName: localResult.title || 'N/A',
                                address: localResult.address || 'N/A',
                                rating: localResult.rating?.value || 0,
                                reviewsCount: localResult.rating?.votes_count || 0,
                                phone: localResult.phone || 'N/A',
                                website: localResult.url || 'N/A',
                                category: localResult.category || 'N/A',
                                workingHours: localResult.work_hours || null
                            };
                        }

                        // Check for knowledge graph with business info
                        if (item.type === 'knowledge_graph' && item.cid) {
                            return {
                                domain: domain,
                                status: 'found',
                                gmbName: item.title || 'N/A',
                                address: item.address || 'N/A',
                                rating: item.rating?.value || 0,
                                reviewsCount: item.rating?.votes_count || 0,
                                phone: item.phone || 'N/A',
                                website: item.url || 'N/A',
                                category: item.category || 'N/A',
                                workingHours: item.work_hours || null
                            };
                        }

                        // Check for maps results
                        if (item.type === 'maps' && item.items && item.items.length > 0) {
                            const mapResult = item.items[0];
                            return {
                                domain: domain,
                                status: 'found',
                                gmbName: mapResult.title || 'N/A',
                                address: mapResult.address || 'N/A',
                                rating: mapResult.rating?.value || 0,
                                reviewsCount: mapResult.rating?.votes_count || 0,
                                phone: mapResult.phone || 'N/A',
                                website: mapResult.url || 'N/A',
                                category: mapResult.category || 'N/A',
                                workingHours: mapResult.work_hours || null
                            };
                        }
                    }
                }
            }
        }

        return {
            domain: domain,
            status: 'not-found',
            message: 'Kein Google My Business Eintrag in den Suchergebnissen gefunden'
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
    // Use SERP API for better GMB detection
    return await searchGMBviaSERP(domain, credentials);
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
