document.addEventListener('DOMContentLoaded', () => {
    // --- Configuration ---
    // PASTE YOUR PUBLIC CLOUD SHELL URL for the backend here.
    const API_BASE_URL = 'https://3000-cs-f4c2b138-7a73-4157-adc9-7259fd35215e.cs-asia-east1-cats.cloudshell.dev/api/production-logs';

    // --- DOM Element References ---
    const form = document.getElementById('production-form');
    const dateInput = document.getElementById('date');
    const logTableBody = document.getElementById('log-table-body');
    const notification = document.getElementById('notification');
    const notificationMessage = document.getElementById('notification-message');
    const loadingLogsIndicator = document.getElementById('loading-logs');

    // --- App State ---
    let productionLog = [];

    // --- Functions ---
    const setDefaultDate = () => {
        const today = new Date();
        dateInput.value = today.toISOString().split('T')[0];
    };

    const fetchProductionLogs = async () => {
        loadingLogsIndicator.classList.remove('hidden');
        logTableBody.innerHTML = '';
        try {
            const response = await fetch(API_BASE_URL);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const logs = await response.json();
            productionLog = logs.map(log => ({
                operatorName: log.operator_name,
                machineId: log.machine_id,
                quantityProduced: log.quantity_produced,
                quantityRejected: log.quantity_rejected,
                date: new Date(log.date).toISOString().split('T')[0]
            }));
            renderLogTable();
        } catch (error) {
            console.error('Failed to fetch production logs:', error);
            logTableBody.innerHTML = `<tr><td colspan="5" class="px-6 py-4 text-center text-red-500">Failed to load records.</td></tr>`;
        } finally {
            loadingLogsIndicator.classList.add('hidden');
        }
    };

    const renderLogTable = () => {
        logTableBody.innerHTML = '';
        if (productionLog.length === 0) {
            logTableBody.innerHTML = `<tr><td colspan="5" class="px-6 py-4 text-center text-gray-500">No production records found.</td></tr>`;
            return;
        }
        productionLog.forEach(entry => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${entry.operatorName}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${entry.machineId}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${entry.quantityProduced}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${entry.quantityRejected}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${entry.date}</td>
            `;
            logTableBody.appendChild(row);
        });
    };

    const showNotification = (message, isSuccess = true) => {
        notificationMessage.textContent = message;
        notification.className = `fixed top-5 right-5 p-4 rounded-lg shadow-lg text-white max-w-sm z-50 opacity-0 transform translate-y-2 ${isSuccess ? 'bg-green-500' : 'bg-red-500'}`;
        setTimeout(() => {
            notification.classList.remove('hidden', 'opacity-0', 'translate-y-2');
            notification.classList.add('opacity-100', 'translate-y-0');
        }, 10);
        setTimeout(() => {
            notification.classList.remove('opacity-100', 'translate-y-0');
            notification.classList.add('opacity-0', 'translate-y-2');
            setTimeout(() => notification.classList.add('hidden'), 500);
        }, 3000);
    };

    const validateForm = () => {
        let isValid = true;
        const requiredFields = form.querySelectorAll('[required]');
        document.querySelectorAll('.error-message').forEach(el => el.style.display = 'none');
        document.querySelectorAll('.form-input.border-red-500').forEach(el => el.classList.remove('border-red-500', 'focus:ring-red-500'));
        requiredFields.forEach(field => {
            const isInvalid = !field.value.trim() || (field.type === 'number' && parseFloat(field.value) < 0);
            if (isInvalid) {
                isValid = false;
                const errorElement = field.nextElementSibling;
                if (errorElement && errorElement.classList.contains('error-message')) {
                    errorElement.style.display = 'block';
                }
                field.classList.add('border-red-500', 'focus:ring-red-500');
            }
        });
        return isValid;
    };

    const handleFormSubmit = async (event) => {
        event.preventDefault();
        if (!validateForm()) {
            showNotification('Please fill out all required fields.', false);
            return;
        }
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        data.quantityProduced = parseInt(data.quantityProduced, 10);
        data.quantityRejected = parseInt(data.quantityRejected, 10);

        const submitButton = document.getElementById('submit-button');
        submitButton.disabled = true;
        submitButton.textContent = 'Submitting...';
        try {
            const response = await fetch(API_BASE_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Submission failed');
            }
            showNotification('Record submitted successfully!', true);
            await fetchProductionLogs();
            form.reset();
            setDefaultDate();
        } catch (error) {
            console.error('Submission Error:', error);
            showNotification(error.message || 'Failed to submit record. Please try again.', false);
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = 'Submit Record';
        }
    };
    
    // --- Real-time Validation ---
    const setupRealtimeValidation = () => {
        const requiredFields = form.querySelectorAll('[required]');
        requiredFields.forEach(field => {
            field.addEventListener('input', () => {
                // Check if the field has a value
                const isValid = field.value.trim() !== '' && !(field.type === 'number' && parseFloat(field.value) < 0);
                if (isValid) {
                    // Find and hide the associated error message
                    const errorElement = field.nextElementSibling;
                    if (errorElement && errorElement.classList.contains('error-message')) {
                        errorElement.style.display = 'none';
                    }
                    // Remove the red border styling
                    field.classList.remove('border-red-500', 'focus:ring-red-500');
                }
            });
        });
    };

    // --- Event Listeners & Initial Setup ---
    form.addEventListener('submit', handleFormSubmit);
    setDefaultDate();
    fetchProductionLogs();
    setupRealtimeValidation(); // Initialize the real-time validation
});