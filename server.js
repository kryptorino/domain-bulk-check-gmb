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
 * Detect location based on domain TLD
 */
function getLocationFromDomain(domain) {
    if (domain.endsWith('.co.uk') || domain.endsWith('.uk')) {
        return {
            location_name: 'United Kingdom',
            language_code: 'en'
        };
    } else if (domain.endsWith('.de')) {
        return {
            location_name: 'Germany',
            language_code: 'de'
        };
    } else if (domain.endsWith('.com') || domain.endsWith('.net')) {
        return {
            location_name: 'United States',
            language_code: 'en'
        };
    }
    // Default to UK for most cases
    return {
        location_name: 'United Kingdom',
        language_code: 'en'
    };
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
 * Check Google My Business for a single domain
 */
async function checkGoogleMyBusiness(domain, credentials) {
    try {
        // Use the Business Data API Live endpoint for immediate results
        const endpoint = '/business_data/google/my_business_info/live';
        const location = getLocationFromDomain(domain);
        const businessName = extractBusinessName(domain);

        // Try multiple search strategies
        const searchVariants = [
            domain,              // Original domain
            `https://${domain}`, // Full URL
            businessName         // Extracted business name
        ];

        console.log(`\n=== Checking domain: ${domain} ===`);
        console.log(`Location: ${location.location_name}, Language: ${location.language_code}`);

        // Try each search variant
        for (const keyword of searchVariants) {
            const requestData = [{
                "keyword": keyword,
                "location_name": location.location_name,
                "language_code": location.language_code
            }];

            try {
                console.log(`\nTrying keyword: "${keyword}"`);
                const response = await makeDataForSEORequest(endpoint, requestData, credentials);

                console.log('API Response status:', response.status_code);
                console.log('API Response message:', response.status_message);

                if (response.tasks && response.tasks.length > 0) {
                    const task = response.tasks[0];

                    console.log('Task ID:', task.id);
                    console.log('Task status_code:', task.status_code);
                    console.log('Task status_message:', task.status_message);

                    if (task.status_code === 20000 && task.result?.[0]) {
                        const result = task.result[0];

                        console.log('Results found:', result.items_count);

                        if (result.items && result.items.length > 0) {
                            // Check each result for matching domain
                            for (const item of result.items) {
                                const itemWebsite = item.url || item.domain || '';
                                const cleanDomain = domain.replace(/^www\./, '');
                                const cleanItemWebsite = itemWebsite.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');

                                console.log(`\nChecking result: ${item.title}`);
                                console.log(`Website: ${itemWebsite}`);
                                console.log(`Domain match: ${cleanItemWebsite.includes(cleanDomain) || cleanDomain.includes(cleanItemWebsite.split('/')[0])}`);

                                // Check if domain matches
                                if (cleanItemWebsite.includes(cleanDomain) || cleanDomain.includes(cleanItemWebsite.split('/')[0])) {
                                    return {
                                        domain: domain,
                                        status: 'found',
                                        gmbName: item.title || 'N/A',
                                        address: item.address || 'N/A',
                                        rating: item.rating?.value || 0,
                                        reviewsCount: item.rating?.votes_count || 0,
                                        phone: item.phone || 'N/A',
                                        website: item.url || item.domain || 'N/A',
                                        category: item.category || 'N/A',
                                        workingHours: item.work_hours || null,
                                        cid: item.cid || null
                                    };
                                }
                            }

                            // If no exact domain match but we found results,
                            // return the first one as it's likely relevant
                            const firstItem = result.items[0];
                            console.log('\nNo exact match, returning first result');
                            return {
                                domain: domain,
                                status: 'found',
                                gmbName: firstItem.title || 'N/A',
                                address: firstItem.address || 'N/A',
                                rating: firstItem.rating?.value || 0,
                                reviewsCount: firstItem.rating?.votes_count || 0,
                                phone: firstItem.phone || 'N/A',
                                website: firstItem.url || firstItem.domain || 'N/A',
                                category: firstItem.category || 'N/A',
                                workingHours: firstItem.work_hours || null,
                                cid: firstItem.cid || null
                            };
                        }
                    }
                }
            } catch (variantError) {
                console.log(`Search variant "${keyword}" failed:`, variantError.message);
                console.log('Error details:', variantError.response?.data);
                continue;
            }
        }

        return {
            domain: domain,
            status: 'not-found',
            message: 'Kein Google My Business Eintrag gefunden'
        };

    } catch (error) {
        console.error('GMB Search Error:', error.message);
        console.error('Error details:', error.response?.data);
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
