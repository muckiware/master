/**
 * @sw-package framework
 */

import ApiService from '../api.service';

/**
 * Reads and writes the system-wide administration interface settings.
 *
 * @class
 * @extends ApiService
 */
class AdminInterfaceApiService extends ApiService {
    constructor(httpClient, loginService, apiEndpoint = '_admin/interface-settings') {
        super(httpClient, loginService, apiEndpoint);
        this.name = 'adminInterfaceApiService';
    }

    /**
     * @returns {Promise<{hiddenMainMenuEntries: string[], lockedMainMenuEntries: string[]}>}
     */
    getSettings() {
        return this.httpClient
            .get(`/${this.apiEndpoint}`, { headers: this.getBasicHeaders() })
            .then((response) => ApiService.handleResponse(response));
    }

    /**
     * @param {{hiddenMainMenuEntries: string[]}} settings
     * @returns {Promise<{hiddenMainMenuEntries: string[], lockedMainMenuEntries: string[]}>}
     */
    saveSettings(settings) {
        return this.httpClient
            .post(`/${this.apiEndpoint}`, settings, { headers: this.getBasicHeaders() })
            .then((response) => ApiService.handleResponse(response));
    }
}

// eslint-disable-next-line sw-deprecation-rules/private-feature-declarations
export default AdminInterfaceApiService;
