async function merge(r) {
    try {
        let responses = await Promise.all([
            r.subrequest('/geo-svc-status', { method: r.method, body: r.requestText }),
            r.subrequest('/subgraph-svc-status', { method: r.method, body: r.requestText })
        ]);
        let response = mergeResponses(responses);

        r.return(200, JSON.stringify(response));
    } catch (err) {
        r.error(`Nginx Join: ${err.message} when forwarding request ${r.requestText}`);
        r.return(500, JSON.stringify({ error: 'Internal Server Error', message: `nginx join: ${err.message}` }));
    }

    r.return(200, JSON.stringify(response));
}

function mergeResponses(responses) {
    if (!Array.isArray(responses)) {
        return { data: [] };
    }
    let filteredResponses = responses
        .filter(resp => resp.responseText && resp.status === 200)
        .map(resp => JSON.parse(resp.responseText))
        .filter(resp => resp && resp.data);
    if (filteredResponses.length === 1) {
        return filteredResponses[0];
    }
    
    return filteredResponses.reduce((acc, cur) => {
        for (let key in cur.data) {
            if (!Array.isArray(cur.data[key])) {
                return;
            }
            if (acc.data[key]) {
                acc.data[key] = acc.data[key].concat(cur.data[key]);
            } else {
                acc.data[key] = cur.data[key];
            }
        }
        return acc;
    }, { data: {} });
}

export default {merge};
