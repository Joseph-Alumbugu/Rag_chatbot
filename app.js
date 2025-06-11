class RAGQueryInterface {
    constructor() {
        this.form = document.getElementById('query-form');
        this.queryInput = document.getElementById('query-input');
        this.errorMessage = document.getElementById('error-message');
        this.loadingIndicator = document.getElementById('loading');
        this.responseContainer = document.getElementById('response-container');
        this.responseText = document.getElementById('response-text');
        this.errorContainer = document.getElementById('error-container');
        this.errorDetails = document.getElementById('error-details');

        this.initEventListeners();
    }

    initEventListeners() {
        this.form.addEventListener('submit', this.handleSubmit.bind(this));
    }

    validateQuery(query) {
        if (!query || query.trim().length < 3) {
            this.showError('Query must be at least 3 characters long');
            return false;
        }
        return true;
    }

    showLoading() {
        this.loadingIndicator.classList.remove('hidden');
        this.responseContainer.classList.add('hidden');
        this.errorContainer.classList.add('hidden');
        this.errorMessage.textContent = '';
    }

    hideLoading() {
        this.loadingIndicator.classList.add('hidden');
    }

    showResponse(response) {
        this.responseText.textContent = response;
        this.responseContainer.classList.remove('hidden');
        this.errorContainer.classList.add('hidden');
    }

    showError(message) {
        this.errorDetails.textContent = message;
        this.errorContainer.classList.remove('hidden');
        this.responseContainer.classList.add('hidden');
        this.loadingIndicator.classList.add('hidden');
    }

    async handleSubmit(event) {
        event.preventDefault();
        const query = this.queryInput.value.trim();


        // Reset previous states
        this.errorMessage.textContent = '';
        this.queryInput.value ='';
        
        // Validate query
        if (!this.validateQuery(query)) {
            return;
        }

        // Show loading state
        this.showLoading();

        try {
            // Fetch response from your backend
            const response = await this.fetchQueryResponse(query);
            
            // Show response
            this.showResponse(response);
        } catch (error) {
            // Handle error
            this.showError(error.message || 'Failed to fetch response');
        } finally {
            this.hideLoading();
        }
    }

    async fetchQueryResponse(query) {
        // Replace with your actual backend URL
        const backendUrl = 'http://localhost:5000/query';

        const response = await fetch(backendUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ input: query })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Something went wrong');
        }

        const data = await response.json();
        return data.response.answer || 'No response generated';
    }
}

// Initialize the interface when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    new RAGQueryInterface();
});