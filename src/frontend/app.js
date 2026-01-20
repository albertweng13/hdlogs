// API Base URL
const API_BASE = '/api';

// State Management
let state = {
  clients: [],
  selectedClient: null,
  workouts: [],
  exerciseSuggestions: ['Back Squat', 'Benchpress', 'Deadlift', 'Overhead Press', 'Barbell Row'],
  editingClientId: null, // Track if we're editing a client
  editingWorkoutId: null, // Track if we're editing a workout
  clientSearchTerm: '', // Track current search term
  filteredClients: [], // Filtered client list based on search
  workoutSortOrder: 'newest', // Track workout sort order: 'newest' or 'oldest'
  groupWorkoutsByDate: true, // Track whether to group workouts by date
  workoutDateFilter: '', // Track date filter for workout history
};

// DOM Elements
const elements = {
  clientList: document.getElementById('client-list'),
  newClientBtn: document.getElementById('new-client-btn'),
  editClientBtn: document.getElementById('edit-client-btn'),
  clientModal: document.getElementById('client-modal'),
  clientModalTitle: document.getElementById('client-modal-title'),
  clientForm: document.getElementById('client-form'),
  clientSearchInput: document.getElementById('client-search-input'),
  clearSearchBtn: document.getElementById('clear-search-btn'),
  searchResultsInfo: document.getElementById('search-results-info'),
  workoutSortSelect: document.getElementById('workout-sort-select'),
  groupByDateCheckbox: document.getElementById('group-by-date-checkbox'),
  clientFormSubmitBtn: document.getElementById('client-form-submit-btn'),
  cancelClientBtn: document.getElementById('cancel-client-btn'),
  closeModal: document.querySelector('.close-modal'),
  clientDetailsSection: document.getElementById('client-details-section'),
  clientName: document.getElementById('client-name'),
  clientEmail: document.getElementById('client-email'),
  clientPhone: document.getElementById('client-phone'),
  clientNotes: document.getElementById('client-notes'),
  workoutForm: document.getElementById('workout-form'),
  workoutExercise: document.getElementById('workout-exercise'),
  exerciseSuggestions: document.getElementById('exercise-suggestions'),
  workoutHistoryBody: document.getElementById('workout-history-body'),
  noWorkoutsMessage: document.getElementById('no-workouts-message'),
  loadingOverlay: document.getElementById('loading-overlay'),
  errorMessage: document.getElementById('error-message'),
  workoutModal: document.getElementById('workout-modal'),
  workoutModalTitle: document.getElementById('workout-modal-title'),
  workoutEditForm: document.getElementById('workout-edit-form'),
  workoutEditFormSubmitBtn: document.getElementById('workout-edit-form-submit-btn'),
  cancelWorkoutBtn: document.getElementById('cancel-workout-btn'),
  closeWorkoutModal: document.querySelector('.close-workout-modal'),
  editWorkoutExercisesContainer: document.getElementById('edit-workout-exercises-container'),
};

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
  // Re-query elements in case they weren't found initially (for module scripts)
  elements.newClientBtn = document.getElementById('new-client-btn');
  elements.clientModal = document.getElementById('client-modal');
  elements.clientModalTitle = document.getElementById('client-modal-title');
  elements.clientForm = document.getElementById('client-form');
  elements.clientFormSubmitBtn = document.getElementById('client-form-submit-btn');
  elements.closeModal = document.querySelector('.close-modal');
  elements.cancelClientBtn = document.getElementById('cancel-client-btn');
  
  // Clear any visible error messages on page load
  if (elements.errorMessage) {
    elements.errorMessage.style.display = 'none';
  }
  
  setupEventListeners();
  loadClients();
  setupExerciseSuggestions();
  setDefaultDate();
});

// Event Listeners Setup
function setupEventListeners() {
  // New Client Button
  if (elements.newClientBtn) {
    elements.newClientBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      openClientModalForNew();
    });
  }

  // Edit Client Button
  elements.editClientBtn.addEventListener('click', () => {
    if (state.selectedClient) {
      openClientModalForEdit(state.selectedClient);
    }
  });


  // Close Modal
  elements.closeModal.addEventListener('click', closeClientModal);
  elements.cancelClientBtn.addEventListener('click', closeClientModal);
  elements.clientModal.addEventListener('click', (e) => {
    if (e.target === elements.clientModal) {
      closeClientModal();
    }
  });

  // Client Form Submit
  elements.clientForm.addEventListener('submit', handleClientFormSubmit);

  // Workout Form Submit
  elements.workoutForm.addEventListener('submit', handleAddWorkout);

  // Exercise Input - Show suggestions
  elements.workoutExercise.addEventListener('input', handleExerciseInput);
  elements.workoutExercise.addEventListener('focus', showExerciseSuggestions);

  // Client Search - with debounce
  let searchDebounceTimer;
  if (elements.clientSearchInput) {
    elements.clientSearchInput.addEventListener('input', (e) => {
      clearTimeout(searchDebounceTimer);
      searchDebounceTimer = setTimeout(() => {
        handleClientSearch(e.target.value);
      }, 300); // 300ms debounce
    });
  }

  // Clear Search Button
  if (elements.clearSearchBtn) {
    elements.clearSearchBtn.addEventListener('click', () => {
      elements.clientSearchInput.value = '';
      handleClientSearch('');
    });
  }

  // Workout Sort Select
  if (elements.workoutSortSelect) {
    elements.workoutSortSelect.addEventListener('change', (e) => {
      state.workoutSortOrder = e.target.value;
      renderWorkoutHistory();
    });
  }

  // Group By Date Checkbox
  if (elements.groupByDateCheckbox) {
    elements.groupByDateCheckbox.addEventListener('change', (e) => {
      state.groupWorkoutsByDate = e.target.checked;
      renderWorkoutHistory();
    });
  }
  
  // Date Search Input
  const dateSearchInput = document.getElementById('workout-date-search');
  const clearDateSearchBtn = document.getElementById('clear-date-search-btn');
  
  if (dateSearchInput) {
    dateSearchInput.addEventListener('change', (e) => {
      state.workoutDateFilter = e.target.value;
      if (clearDateSearchBtn) {
        clearDateSearchBtn.style.display = state.workoutDateFilter ? 'inline-block' : 'none';
      }
      renderWorkoutHistory();
    });
  }
  
  if (clearDateSearchBtn) {
    clearDateSearchBtn.addEventListener('click', () => {
      state.workoutDateFilter = '';
      if (dateSearchInput) dateSearchInput.value = '';
      clearDateSearchBtn.style.display = 'none';
      renderWorkoutHistory();
    });
  }

  // Workout Modal - Close
  if (elements.closeWorkoutModal) {
    elements.closeWorkoutModal.addEventListener('click', closeWorkoutModal);
  }
  if (elements.cancelWorkoutBtn) {
    elements.cancelWorkoutBtn.addEventListener('click', closeWorkoutModal);
  }
  if (elements.workoutModal) {
    elements.workoutModal.addEventListener('click', (e) => {
      if (e.target === elements.workoutModal) {
        closeWorkoutModal();
      }
    });
  }

  // Workout Edit Form Submit
  if (elements.workoutEditForm) {
    elements.workoutEditForm.addEventListener('submit', handleWorkoutEditFormSubmit);
  }

  // Number input +/- buttons for weight
  const weightDecreaseBtn = document.getElementById('weight-decrease-btn');
  const weightIncreaseBtn = document.getElementById('weight-increase-btn');
  const weightInput = document.getElementById('workout-weight');
  
  if (weightDecreaseBtn && weightIncreaseBtn && weightInput) {
    weightDecreaseBtn.addEventListener('click', () => {
      const currentValue = parseFloat(weightInput.value) || 0;
      const newValue = Math.max(0, currentValue - 2.5);
      weightInput.value = newValue.toFixed(1);
      weightInput.dispatchEvent(new Event('input', { bubbles: true }));
    });
    
    weightIncreaseBtn.addEventListener('click', () => {
      const currentValue = parseFloat(weightInput.value) || 0;
      const newValue = currentValue + 2.5;
      weightInput.value = newValue.toFixed(1);
      weightInput.dispatchEvent(new Event('input', { bubbles: true }));
    });
  }
  
  // Number input +/- buttons for reps
  const repsDecreaseBtn = document.getElementById('reps-decrease-btn');
  const repsIncreaseBtn = document.getElementById('reps-increase-btn');
  const repsInput = document.getElementById('workout-reps');
  
  if (repsDecreaseBtn && repsIncreaseBtn && repsInput) {
    repsDecreaseBtn.addEventListener('click', () => {
      const currentValue = parseInt(repsInput.value) || 0;
      const newValue = Math.max(1, currentValue - 1);
      repsInput.value = newValue;
      repsInput.dispatchEvent(new Event('input', { bubbles: true }));
    });
    
    repsIncreaseBtn.addEventListener('click', () => {
      const currentValue = parseInt(repsInput.value) || 0;
      const newValue = currentValue + 1;
      repsInput.value = newValue;
      repsInput.dispatchEvent(new Event('input', { bubbles: true }));
    });
  }
  
  // Smart defaults when exercise name changes
  const exerciseInput = document.getElementById('workout-exercise');
  if (exerciseInput) {
    exerciseInput.addEventListener('blur', async () => {
      await updateWorkoutDefaults();
    });
  }
  
  // Delete client button in edit modal
  const deleteClientBtn = document.getElementById('delete-client-btn');
  if (deleteClientBtn) {
    deleteClientBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const clientId = deleteClientBtn.getAttribute('data-client-id');
      if (clientId) {
        const client = state.clients.find(c => c.clientId === clientId);
        if (client) {
          handleDeleteClient(client);
        }
      }
    });
  }
  
  // Delete workout button in edit modal
  const deleteWorkoutBtn = document.getElementById('delete-workout-btn');
  if (deleteWorkoutBtn) {
    deleteWorkoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const workoutId = deleteWorkoutBtn.getAttribute('data-workout-id');
      if (workoutId) {
        const workout = state.workouts.find(w => w.workoutId === workoutId);
        if (workout) {
          handleDeleteWorkout(workout);
        }
      }
    });
  }
}

// API Functions
async function apiCall(endpoint, options = {}) {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      // Try to parse JSON error response, but provide fallback if it's not JSON
      let errorData;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        try {
          errorData = await response.json();
        } catch (parseError) {
          // JSON parsing failed, read text instead
          const text = await response.text();
          throw new Error(`HTTP ${response.status}: ${text || 'Request failed'}`);
        }
      } else {
        // Not JSON, read as text
        const text = await response.text();
        throw new Error(`HTTP ${response.status}: ${text || 'Request failed'}`);
      }
      throw new Error(errorData.error || `HTTP ${response.status}: Request failed`);
    }

    // Handle 204 No Content responses (DELETE endpoints)
    if (response.status === 204) {
      return null;
    }

    // Check if response has content before parsing JSON
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const text = await response.text();
      return text ? JSON.parse(text) : null;
    }

    // Return null if no JSON content
    return null;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

// Client Functions
async function loadClients() {
  showLoading();
  try {
    const clients = await apiCall('/clients');
    state.clients = clients;
    // Apply current search filter if any
    if (state.clientSearchTerm) {
      filterClients(state.clientSearchTerm);
    } else {
      state.filteredClients = state.clients;
    }
    renderClientList();
  } catch (error) {
    showError('Failed to load clients: ' + error.message);
  } finally {
    hideLoading();
  }
}

// Task 37: Filter clients based on search term
function filterClients(searchTerm) {
  const term = searchTerm.toLowerCase().trim();
  state.clientSearchTerm = term;
  
  if (!term) {
    state.filteredClients = state.clients;
  } else {
    state.filteredClients = state.clients.filter(client => {
      const name = (client.name || '').toLowerCase();
      const email = (client.email || '').toLowerCase();
      const phone = (client.phone || '').toLowerCase();
      return name.includes(term) || email.includes(term) || phone.includes(term);
    });
  }
}

// Task 38: Handle client search with debounce (already handled in event listener)
function handleClientSearch(searchTerm) {
  filterClients(searchTerm);
  renderClientList();
  updateSearchUI();
}

// Task 40: Update search UI indicators
function updateSearchUI() {
  const hasSearch = state.clientSearchTerm.length > 0;
  const resultCount = state.filteredClients.length;
  const totalCount = state.clients.length;

  // Show/hide clear button
  if (elements.clearSearchBtn) {
    elements.clearSearchBtn.style.display = hasSearch ? 'inline-block' : 'none';
  }

  // Show/hide results info
  if (elements.searchResultsInfo) {
    if (hasSearch) {
      elements.searchResultsInfo.style.display = 'block';
      if (resultCount === 0) {
        elements.searchResultsInfo.textContent = 'No clients found';
        elements.searchResultsInfo.className = 'search-results-info no-results';
      } else {
        elements.searchResultsInfo.textContent = `Found ${resultCount} of ${totalCount} client${totalCount !== 1 ? 's' : ''}`;
        elements.searchResultsInfo.className = 'search-results-info';
      }
    } else {
      elements.searchResultsInfo.style.display = 'none';
    }
  }
}

// Task 39: Updated renderClientList to use filtered clients
function renderClientList() {
  elements.clientList.innerHTML = '';

  const clientsToRender = state.clientSearchTerm ? state.filteredClients : state.clients;

  if (clientsToRender.length === 0) {
    if (state.clients.length === 0) {
      elements.clientList.innerHTML = '<p class="no-data-message">No clients yet. Add your first client!</p>';
    } else {
      elements.clientList.innerHTML = '<p class="no-data-message">No clients match your search.</p>';
    }
    return;
  }

  clientsToRender.forEach(client => {
    const clientItem = document.createElement('div');
    clientItem.className = 'client-item';
    if (state.selectedClient?.clientId === client.clientId) {
      clientItem.classList.add('selected');
    }
    
    // Create client item content with delete button
    const clientContent = document.createElement('div');
    clientContent.className = 'client-item-content';
    
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'client-delete-btn';
    deleteBtn.innerHTML = '×';
    deleteBtn.title = 'Delete client';
    deleteBtn.setAttribute('data-client-id', client.clientId);
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation(); // Prevent selecting the client when clicking delete
      handleDeleteClient(client);
    });
    
    const clientName = document.createElement('div');
    clientName.className = 'client-item-name';
    clientName.textContent = client.name;
    
    clientContent.appendChild(deleteBtn);
    clientContent.appendChild(clientName);
    clientItem.appendChild(clientContent);
    
    clientItem.addEventListener('click', (e) => {
      // Don't select if clicking the delete button
      if (!e.target.closest('.client-delete-btn')) {
        selectClient(client);
      }
    });
    
    elements.clientList.appendChild(clientItem);
  });
}

function selectClient(client) {
  state.selectedClient = client;
  renderClientList();
  renderClientDetails();
  loadWorkouts(client.clientId);
}

function renderClientDetails() {
  const workoutFormSection = document.getElementById('workout-form-section');
  const noClientSection = document.getElementById('no-client-selected-section');
  
  if (!state.selectedClient) {
    elements.clientDetailsSection.style.display = 'none';
    if (workoutFormSection) workoutFormSection.style.display = 'none';
    if (noClientSection) noClientSection.style.display = 'block';
    return;
  }

  elements.clientDetailsSection.style.display = 'block';
  if (workoutFormSection) workoutFormSection.style.display = 'block';
  if (noClientSection) noClientSection.style.display = 'none';
  
  elements.clientName.textContent = state.selectedClient.name || 'No name';
  elements.clientEmail.textContent = state.selectedClient.email || 'No email';
  elements.clientPhone.textContent = state.selectedClient.phone || 'No phone';
  elements.clientNotes.textContent = state.selectedClient.notes || 'No notes';
  
  // Set default date to today when client is selected
  setDefaultDate();
  
  // Update workout defaults when client is selected
  updateWorkoutDefaults();
}

function openClientModalForNew() {
  if (!elements.clientModal) {
    return;
  }
  
  state.editingClientId = null;
  elements.clientModalTitle.textContent = 'Add New Client';
  elements.clientFormSubmitBtn.textContent = 'Save Client';
  elements.clientForm.reset();
  
  // Hide delete button for new client
  const deleteBtn = document.getElementById('delete-client-btn');
  if (deleteBtn) {
    deleteBtn.style.display = 'none';
    deleteBtn.removeAttribute('data-client-id');
  }
  
  // Clear validation errors
  displayClientFormErrors({});
  elements.clientModal.style.display = 'flex';
}

function openClientModalForEdit(client) {
  state.editingClientId = client.clientId;
  elements.clientModalTitle.textContent = 'Edit Client';
  elements.clientFormSubmitBtn.textContent = 'Update Client';
  
  // Pre-fill form with client data
  document.getElementById('client-name-input').value = client.name || '';
  document.getElementById('client-email-input').value = client.email || '';
  document.getElementById('client-phone-input').value = client.phone || '';
  document.getElementById('client-notes-input').value = client.notes || '';
  
  // Show delete button in edit modal
  const deleteBtn = document.getElementById('delete-client-btn');
  if (deleteBtn) {
    deleteBtn.style.display = 'inline-block';
    deleteBtn.setAttribute('data-client-id', client.clientId);
  }
  
  // Clear validation errors
  displayClientFormErrors({});
  
  elements.clientModal.style.display = 'flex';
}

// Task 47: Client-side validation functions
function validateClientForm(formData) {
  const errors = {};
  
  // Name is required
  if (!formData.name || formData.name.trim().length === 0) {
    errors.name = 'Name is required';
  } else if (formData.name.trim().length < 2) {
    errors.name = 'Name must be at least 2 characters';
  }
  
  // Email format validation (if provided)
  if (formData.email && formData.email.trim().length > 0) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }
  }
  
  // Phone format validation (if provided) - basic pattern
  if (formData.phone && formData.phone.trim().length > 0) {
    const phoneRegex = /^[\d\s\-\+\(\)]+$/;
    if (!phoneRegex.test(formData.phone)) {
      errors.phone = 'Please enter a valid phone number';
    } else if (formData.phone.replace(/\D/g, '').length < 7) {
      errors.phone = 'Phone number must contain at least 7 digits';
    }
  }
  
  return errors;
}

function displayClientFormErrors(errors) {
  // Clear all error messages
  document.getElementById('client-name-error').textContent = '';
  document.getElementById('client-email-error').textContent = '';
  document.getElementById('client-phone-error').textContent = '';
  
  // Remove error styling
  document.getElementById('client-name-input').classList.remove('error');
  document.getElementById('client-email-input').classList.remove('error');
  document.getElementById('client-phone-input').classList.remove('error');
  
  // Display errors
  if (errors.name) {
    document.getElementById('client-name-error').textContent = errors.name;
    document.getElementById('client-name-input').classList.add('error');
  }
  if (errors.email) {
    document.getElementById('client-email-error').textContent = errors.email;
    document.getElementById('client-email-input').classList.add('error');
  }
  if (errors.phone) {
    document.getElementById('client-phone-error').textContent = errors.phone;
    document.getElementById('client-phone-input').classList.add('error');
  }
}

// Task 48: Client-side validation for workout form
function validateWorkoutForm(formData) {
  const errors = {};
  
  // Date is required and must be valid
  if (!formData.date || formData.date.trim().length === 0) {
    errors.date = 'Date is required';
  } else {
    const date = new Date(formData.date);
    if (isNaN(date.getTime())) {
      errors.date = 'Please enter a valid date';
    }
  }
  
  // Exercise name is required
  if (!formData.exercise || formData.exercise.trim().length === 0) {
    errors.exercise = 'Exercise name is required';
  }
  
  // Weight must be a positive number
  if (formData.weight === null || formData.weight === undefined || formData.weight === '') {
    errors.weight = 'Weight is required';
  } else {
    const weight = parseFloat(formData.weight);
    if (isNaN(weight) || weight < 0) {
      errors.weight = 'Weight must be a positive number';
    }
  }
  
  // Reps must be a positive integer
  if (formData.reps === null || formData.reps === undefined || formData.reps === '') {
    errors.reps = 'Reps is required';
  } else {
    const reps = parseInt(formData.reps);
    if (isNaN(reps) || reps < 1) {
      errors.reps = 'Reps must be at least 1';
    }
  }
  
  return errors;
}

function displayWorkoutFormErrors(errors) {
  // Clear all error messages
  document.getElementById('workout-date-error').textContent = '';
  document.getElementById('workout-exercise-error').textContent = '';
  document.getElementById('workout-weight-error').textContent = '';
  document.getElementById('workout-reps-error').textContent = '';
  
  // Remove error styling
  document.getElementById('workout-date').classList.remove('error');
  document.getElementById('workout-exercise').classList.remove('error');
  document.getElementById('workout-weight').classList.remove('error');
  document.getElementById('workout-reps').classList.remove('error');
  
  // Display errors
  if (errors.date) {
    document.getElementById('workout-date-error').textContent = errors.date;
    document.getElementById('workout-date').classList.add('error');
  }
  if (errors.exercise) {
    document.getElementById('workout-exercise-error').textContent = errors.exercise;
    document.getElementById('workout-exercise').classList.add('error');
  }
  if (errors.weight) {
    document.getElementById('workout-weight-error').textContent = errors.weight;
    document.getElementById('workout-weight').classList.add('error');
  }
  if (errors.reps) {
    document.getElementById('workout-reps-error').textContent = errors.reps;
    document.getElementById('workout-reps').classList.add('error');
  }
}

async function handleClientFormSubmit(e) {
  e.preventDefault();
  
  const formData = {
    name: document.getElementById('client-name-input').value.trim(),
    email: document.getElementById('client-email-input').value.trim(),
    phone: document.getElementById('client-phone-input').value.trim(),
    notes: document.getElementById('client-notes-input').value.trim(),
  };
  
  // Task 47: Validate form data
  const errors = validateClientForm(formData);
  if (Object.keys(errors).length > 0) {
    displayClientFormErrors(errors);
    return; // Stop submission if validation fails
  }
  
  // Clear any previous errors
  displayClientFormErrors({});
  
  showLoading();

  try {
    if (state.editingClientId) {
      // Update existing client
      const updatedClient = await apiCall(`/clients/${state.editingClientId}`, {
        method: 'PUT',
        body: JSON.stringify(formData),
      });

      // Update client in state
      const index = state.clients.findIndex(c => c.clientId === state.editingClientId);
      if (index !== -1) {
        state.clients[index] = updatedClient;
      }

      // Re-apply search filter if active
      if (state.clientSearchTerm) {
        filterClients(state.clientSearchTerm);
      } else {
        state.filteredClients = state.clients;
      }

      // Update selected client if it's the one being edited
      if (state.selectedClient?.clientId === state.editingClientId) {
        state.selectedClient = updatedClient;
        renderClientDetails();
      }

      renderClientList();
      updateSearchUI();
      closeClientModal();
    } else {
      // Create new client
      const newClient = await apiCall('/clients', {
        method: 'POST',
        body: JSON.stringify(formData),
      });

      state.clients.push(newClient);
      // Re-apply search filter if active
      if (state.clientSearchTerm) {
        filterClients(state.clientSearchTerm);
      } else {
        state.filteredClients = state.clients;
      }
      renderClientList();
      updateSearchUI();
      closeClientModal();
      selectClient(newClient);
    }
  } catch (error) {
    // Task 51: Handle validation errors from server
    if (error.message.includes('validation') || error.message.includes('invalid') || error.message.includes('required')) {
      // Try to parse server validation errors if available
      const validationErrors = {};
      if (error.message.includes('name')) validationErrors.name = 'Server: ' + error.message;
      if (error.message.includes('email')) validationErrors.email = 'Server: ' + error.message;
      if (error.message.includes('phone')) validationErrors.phone = 'Server: ' + error.message;
      if (Object.keys(validationErrors).length > 0) {
        displayClientFormErrors(validationErrors);
      } else {
        showError(`Failed to ${state.editingClientId ? 'update' : 'add'} client: ` + error.message);
      }
    } else {
      showError(`Failed to ${state.editingClientId ? 'update' : 'add'} client: ` + error.message);
    }
  } finally {
    hideLoading();
  }
}

function closeClientModal() {
  elements.clientModal.style.display = 'none';
  elements.clientForm.reset();
  state.editingClientId = null;
  
  // Hide delete button
  const deleteBtn = document.getElementById('delete-client-btn');
  if (deleteBtn) {
    deleteBtn.style.display = 'none';
    deleteBtn.removeAttribute('data-client-id');
  }
}

// Delete Client Functions
async function handleDeleteClient(client) {
  // Confirmation dialog
  const clientName = client.name || 'this client';
  const confirmed = confirm(
    `Are you sure you want to delete ${clientName}? This action cannot be undone.`
  );

  if (!confirmed) {
    return; // User cancelled deletion
  }
  
  // Close modal if open
  closeClientModal();

  showLoading();
  try {
    // Task 17: Call DELETE API endpoint
    await apiCall(`/clients/${client.clientId}`, {
      method: 'DELETE',
    });

    // Remove client from state
    state.clients = state.clients.filter(c => c.clientId !== client.clientId);

    // Re-apply search filter if active
    if (state.clientSearchTerm) {
      filterClients(state.clientSearchTerm);
    } else {
      state.filteredClients = state.clients;
    }

    // If the deleted client was selected, deselect it and clear details
    if (state.selectedClient?.clientId === client.clientId) {
      state.selectedClient = null;
      state.workouts = [];
      renderClientDetails();
      renderWorkoutHistory();
    }

    // Update UI: reload client list and deselect if needed
    renderClientList();
    updateSearchUI();
  } catch (error) {
    showError(`Failed to delete client: ${error.message}`);
  } finally {
    hideLoading();
  }
}

// Workout Functions
async function loadWorkouts(clientId) {
  showLoading();
  try {
    const workouts = await apiCall(`/clients/${clientId}/workouts`);
    state.workouts = workouts;
    renderWorkoutHistory();
  } catch (error) {
    showError('Failed to load workouts: ' + error.message);
  } finally {
    hideLoading();
  }
}

function renderWorkoutHistory() {
  elements.workoutHistoryBody.innerHTML = '';

  if (state.workouts.length === 0) {
    elements.noWorkoutsMessage.style.display = 'block';
    return;
  }

  elements.noWorkoutsMessage.style.display = 'none';

  // Filter workouts by date if date filter is set
  let filteredWorkouts = state.workouts;
  if (state.workoutDateFilter) {
    filteredWorkouts = state.workouts.filter(workout => workout.date === state.workoutDateFilter);
  }

  if (filteredWorkouts.length === 0 && state.workoutDateFilter) {
    elements.noWorkoutsMessage.textContent = `No workouts found for ${state.workoutDateFilter}`;
    elements.noWorkoutsMessage.style.display = 'block';
    return;
  }

  // Task 42-44: Sort workouts by date (based on sort order)
  const sortedWorkouts = [...filteredWorkouts].sort((a, b) => {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    if (state.workoutSortOrder === 'oldest') {
      return dateA - dateB; // Oldest first
    } else {
      return dateB - dateA; // Newest first (default)
    }
  });

  // Task 43: Group workouts by date if enabled
  if (state.groupWorkoutsByDate) {
    renderGroupedWorkoutHistory(sortedWorkouts);
  } else {
    renderUngroupedWorkoutHistory(sortedWorkouts);
  }
}

// Task 43: Helper function to group workouts by date
function groupWorkoutsByDate(workouts) {
  const grouped = {};
  workouts.forEach(workout => {
    const dateKey = workout.date || 'Unknown';
    if (!grouped[dateKey]) {
      grouped[dateKey] = [];
    }
    grouped[dateKey].push(workout);
  });
  return grouped;
}

// Task 44: Render workouts grouped by date
function renderGroupedWorkoutHistory(sortedWorkouts) {
  const grouped = groupWorkoutsByDate(sortedWorkouts);
  const dates = Object.keys(grouped).sort((a, b) => {
    const dateA = new Date(a);
    const dateB = new Date(b);
    return state.workoutSortOrder === 'oldest' ? dateA - dateB : dateB - dateA;
  });

  dates.forEach(date => {
    // Add date header row
    const headerRow = document.createElement('tr');
    headerRow.className = 'date-group-header';
    headerRow.innerHTML = `
      <td colspan="6" class="date-header-cell">
        <strong>${formatDate(date)}</strong>
      </td>
    `;
    elements.workoutHistoryBody.appendChild(headerRow);

    // Render workouts for this date
    grouped[date].forEach(workout => {
      renderWorkoutRows(workout);
    });
  });
  
  // Attach event listeners once after all workouts are rendered
  attachWorkoutRowEventListeners();
}

// Task 44: Render workouts without grouping
function renderUngroupedWorkoutHistory(sortedWorkouts) {
  sortedWorkouts.forEach(workout => {
    renderWorkoutRows(workout);
  });
  
  // Attach event listeners once after all workouts are rendered
  attachWorkoutRowEventListeners();
}

// Helper function to render rows for a single workout
function renderWorkoutRows(workout) {
  let isFirstRowOfWorkout = true;
  
  workout.exercises.forEach((exercise, exerciseIndex) => {
    exercise.sets.forEach((set, setIndex) => {
      const row = document.createElement('tr');
      row.setAttribute('data-workout-id', workout.workoutId);
      const weightReps = `${set.weight}lbs x ${set.reps}reps`;
      const volume = (set.weight || 0) * (set.reps || 0);
      
      // Actions column - show edit button only on first row of workout
      let actionsCell = '<td></td>';
      if (isFirstRowOfWorkout && exerciseIndex === 0 && setIndex === 0) {
        actionsCell = `
          <td class="workout-actions">
            <button class="btn-icon btn-secondary edit-workout-btn" data-workout-id="${workout.workoutId}" title="Edit Workout">Edit</button>
          </td>
        `;
        isFirstRowOfWorkout = false;
      }
      
      row.innerHTML = `
        <td>${formatDate(workout.date)}</td>
        <td>${escapeHtml(exercise.exerciseName)}</td>
        <td>${escapeHtml(weightReps)}</td>
        <td>${volume.toLocaleString()}</td>
        <td>${escapeHtml(set.notes || workout.notes || '')}</td>
        ${actionsCell}
      `;
      elements.workoutHistoryBody.appendChild(row);
    });
  });
}

// Helper function to attach event listeners to workout action buttons
function attachWorkoutRowEventListeners() {
  // Remove old event listeners by removing the attribute and re-adding
  document.querySelectorAll('.edit-workout-btn').forEach(btn => {
    btn.removeAttribute('data-listener-attached');
    // Clone node to remove all event listeners
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);
  });
  
  // Add event listeners for edit buttons
  document.querySelectorAll('.edit-workout-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const workoutId = e.currentTarget.getAttribute('data-workout-id') || e.target.closest('.edit-workout-btn')?.getAttribute('data-workout-id');
      const workout = state.workouts.find(w => w.workoutId === workoutId);
      if (workout) {
        openWorkoutModalForEdit(workout);
      }
    });
  });
}

async function handleAddWorkout(e) {
  e.preventDefault();

  if (!state.selectedClient) {
    showError('Please select a client first');
    return;
  }

  const formData = {
    clientId: state.selectedClient.clientId,
    date: document.getElementById('workout-date').value,
    exercise: document.getElementById('workout-exercise').value.trim(),
    weight: document.getElementById('workout-weight').value,
    reps: document.getElementById('workout-reps').value,
    notes: document.getElementById('workout-notes').value.trim(),
  };
  
  // Validate form data
  const errors = validateWorkoutForm(formData);
  if (Object.keys(errors).length > 0) {
    displayWorkoutFormErrors(errors);
    return; // Stop submission if validation fails
  }
  
  // Clear any previous errors
  displayWorkoutFormErrors({});
  
  // Convert weight and reps to numbers after validation
  formData.weight = parseFloat(formData.weight);
  formData.reps = parseInt(formData.reps);

  showLoading();

  try {
    // Normalize exercise name for storage
    const { canonicalizeExerciseName, normalizeExerciseName } = await import('/utils/exerciseNormalize.js');
    const canonicalExerciseName = canonicalizeExerciseName(formData.exercise);

    // Find existing workout for this date, or create new structure
    const existingWorkout = state.workouts.find(w => w.date === formData.date);
    
    let exercises = [];
    if (existingWorkout) {
      exercises = JSON.parse(JSON.stringify(existingWorkout.exercises)); // Deep copy
    }

    // Check if exercise already exists in this workout (using normalized comparison)
    const exerciseIndex = exercises.findIndex(
      ex => normalizeExerciseName(ex.exerciseName) === normalizeExerciseName(formData.exercise)
    );

    const newSet = {
      reps: formData.reps,
      weight: formData.weight,
      notes: formData.notes || undefined,
    };

    if (exerciseIndex >= 0) {
      // Add set to existing exercise
      exercises[exerciseIndex].sets.push(newSet);
    } else {
      // Create new exercise with canonical name
      exercises.push({
        exerciseName: canonicalExerciseName,
        sets: [newSet],
      });
    }

    const workoutData = {
      clientId: formData.clientId,
      date: formData.date,
      exercises: exercises,
      notes: formData.notes,
    };
    const newWorkout = await apiCall('/workouts', {
      method: 'POST',
      body: JSON.stringify(workoutData),
    });

    // Update state - replace existing workout or add new one
    if (existingWorkout) {
      const index = state.workouts.findIndex(w => w.workoutId === existingWorkout.workoutId);
      state.workouts[index] = newWorkout;
    } else {
      state.workouts.push(newWorkout);
    }

    renderWorkoutHistory();
    elements.workoutForm.reset();
    setDefaultDate();
    // Clear validation errors
    displayWorkoutFormErrors({});
    
    // Add exercise to suggestions if new
    const exerciseName = formData.exercise;
    if (!state.exerciseSuggestions.some(ex => ex.toLowerCase() === exerciseName.toLowerCase())) {
      state.exerciseSuggestions.push(exerciseName);
      saveExerciseSuggestions();
    }
  } catch (error) {
    // Task 51: Handle validation errors from server
    if (error.message.includes('validation') || error.message.includes('invalid') || error.message.includes('required')) {
      const validationErrors = {};
      if (error.message.includes('date')) validationErrors.date = 'Server: ' + error.message;
      if (error.message.includes('exercise')) validationErrors.exercise = 'Server: ' + error.message;
      if (error.message.includes('weight')) validationErrors.weight = 'Server: ' + error.message;
      if (error.message.includes('reps')) validationErrors.reps = 'Server: ' + error.message;
      if (Object.keys(validationErrors).length > 0) {
        displayWorkoutFormErrors(validationErrors);
      } else {
        showError('Failed to add workout: ' + error.message);
      }
    } else {
      showError('Failed to add workout: ' + error.message);
    }
  } finally {
    hideLoading();
  }
}

// Helper function to show temporary success message (using error message component but with success styling)
function showSuccess(message) {
  const errorEl = elements.errorMessage;
  errorEl.textContent = message;
  errorEl.style.backgroundColor = 'var(--success)';
  errorEl.style.display = 'block';
  setTimeout(() => {
    errorEl.style.display = 'none';
    errorEl.style.backgroundColor = 'var(--error)'; // Reset color
  }, 3000);
}

// Exercise Suggestions
function setupExerciseSuggestions() {
  // Load from localStorage if available
  const saved = localStorage.getItem('exerciseSuggestions');
  if (saved) {
    try {
      state.exerciseSuggestions = JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load exercise suggestions', e);
    }
  }
}

function showExerciseSuggestions() {
  renderExerciseSuggestions();
}

function handleExerciseInput() {
  const value = elements.workoutExercise.value.toLowerCase();
  if (value.length > 0) {
    renderExerciseSuggestions(value);
  } else {
    renderExerciseSuggestions();
  }
}

async function renderExerciseSuggestions(filter = '') {
  elements.exerciseSuggestions.innerHTML = '';

  const filtered = state.exerciseSuggestions.filter(ex => {
    return ex.toLowerCase().includes(filter.toLowerCase());
  });

  // Get last weight/reps for each exercise if client is selected
  const exerciseData = [];
  for (const exercise of filtered) {
    let displayText = exercise;
    if (state.selectedClient && state.workouts && state.workouts.length > 0) {
      try {
        const { normalizeExerciseName } = await import('/utils/exerciseNormalize.js');
        const normalizedExerciseName = normalizeExerciseName(exercise);
        
        // Find the most recent workout set for this exercise
        let lastSet = null;
        const sortedWorkouts = [...state.workouts].sort((a, b) => {
          const dateA = new Date(a.date);
          const dateB = new Date(b.date);
          return dateB - dateA; // Descending order
        });
        
        for (const workout of sortedWorkouts) {
          if (!workout.exercises || workout.exercises.length === 0) continue;
          
          for (const ex of workout.exercises) {
            const normalizedCurrentName = normalizeExerciseName(ex.exerciseName);
            if (normalizedCurrentName === normalizedExerciseName && ex.sets && ex.sets.length > 0) {
              lastSet = ex.sets[ex.sets.length - 1];
              break;
            }
          }
          if (lastSet) break;
        }
        
        if (lastSet && (lastSet.weight > 0 || lastSet.reps > 0)) {
          displayText = `${exercise} (${lastSet.weight}lbs × ${lastSet.reps})`;
        }
      } catch (error) {
        // Silently fail - defaults are nice-to-have
      }
    }
    exerciseData.push({ name: exercise, display: displayText });
  }

  exerciseData.forEach(({ name, display }) => {
    const suggestion = document.createElement('div');
    suggestion.className = 'exercise-suggestion';
    suggestion.textContent = display;
    suggestion.addEventListener('click', async () => {
      elements.workoutExercise.value = name;
      elements.exerciseSuggestions.innerHTML = '';
      // Update defaults when exercise is selected
      await updateWorkoutDefaults();
    });
    elements.exerciseSuggestions.appendChild(suggestion);
  });
}

// Utility Functions
// Date input: Set default to today and allow easy override
function setDefaultDate() {
  const dateInput = document.getElementById('workout-date');
  if (dateInput) {
    const today = new Date().toISOString().split('T')[0];
    // Only set if empty or if user hasn't manually changed it
    if (!dateInput.value) {
      dateInput.value = today;
    }
  }
}

// Update workout form defaults based on previous sessions
async function updateWorkoutDefaults() {
  // Only update if a client is selected
  if (!state.selectedClient) {
    return;
  }
  
  const exerciseInput = document.getElementById('workout-exercise');
  const weightInput = document.getElementById('workout-weight');
  const repsInput = document.getElementById('workout-reps');
  
  if (!exerciseInput || !weightInput || !repsInput) {
    return;
  }
  
  const exerciseName = exerciseInput.value.trim();
  if (!exerciseName) {
    return;
  }
  
  try {
    // Use workout normalization utility for comparison
    const { normalizeExerciseName } = await import('/utils/exerciseNormalize.js');
    const normalizedExerciseName = normalizeExerciseName(exerciseName);
    
    // Find the most recent workout set for this exercise from state.workouts
    let lastSet = null;
    
    if (state.workouts && state.workouts.length > 0) {
      // Sort workouts by date (newest first)
      const sortedWorkouts = [...state.workouts].sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return dateB - dateA; // Descending order
      });
      
      // Find most recent set for this exercise
      for (const workout of sortedWorkouts) {
        if (!workout.exercises || workout.exercises.length === 0) {
          continue;
        }
        
        for (const exercise of workout.exercises) {
          const normalizedCurrentName = normalizeExerciseName(exercise.exerciseName);
          
          if (normalizedCurrentName === normalizedExerciseName && exercise.sets && exercise.sets.length > 0) {
            // Get the last set (most recent) for this exercise
            lastSet = exercise.sets[exercise.sets.length - 1];
            break;
          }
        }
        
        if (lastSet) break;
      }
    }
    
    // Only update if inputs are empty (don't overwrite user input)
    if (!weightInput.value || weightInput.value === '0') {
      weightInput.value = lastSet?.weight || 0;
    }
    
    if (!repsInput.value || repsInput.value === '0') {
      repsInput.value = lastSet?.reps || 6;
    }
  } catch (error) {
    // Silently fail - defaults are nice-to-have, not required
    console.error('Error updating workout defaults:', error);
  }
}


function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: '2-digit', 
    day: '2-digit' 
  });
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function showLoading() {
  elements.loadingOverlay.style.display = 'flex';
}

function hideLoading() {
  elements.loadingOverlay.style.display = 'none';
}

function showError(message) {
  const errorEl = elements.errorMessage;
  errorEl.textContent = message;
  errorEl.style.backgroundColor = 'var(--error)';
  errorEl.style.display = 'block';
  setTimeout(() => {
    errorEl.style.display = 'none';
  }, 5000);
}

// Save exercise suggestions to localStorage
function saveExerciseSuggestions() {
  localStorage.setItem('exerciseSuggestions', JSON.stringify(state.exerciseSuggestions));
}

// Delete Workout Functions
async function handleDeleteWorkout(workout) {
  // Confirmation dialog
  const workoutDate = workout.date || 'this workout';
  const confirmed = confirm(
    `Are you sure you want to delete the workout from ${workoutDate}? This action cannot be undone.`
  );

  if (!confirmed) {
    return; // User cancelled deletion
  }
  
  // Close modal if open
  closeWorkoutModal();

  showLoading();
  try {
    // Task 34: Call DELETE API endpoint
    await apiCall(`/workouts/${workout.workoutId}`, {
      method: 'DELETE',
    });

    // Remove workout from state
    state.workouts = state.workouts.filter(w => w.workoutId !== workout.workoutId);

    // Update UI: re-render workout history
    renderWorkoutHistory();
  } catch (error) {
    showError(`Failed to delete workout: ${error.message}`);
  } finally {
    hideLoading();
  }
}

// Edit Workout Functions
function openWorkoutModalForEdit(workout) {
  state.editingWorkoutId = workout.workoutId;
  elements.workoutModalTitle.textContent = 'Edit Workout';
  elements.workoutEditFormSubmitBtn.textContent = 'Update Workout';
  
  // Show delete button in edit modal
  const deleteBtn = document.getElementById('delete-workout-btn');
  if (deleteBtn) {
    deleteBtn.style.display = 'inline-block';
    deleteBtn.setAttribute('data-workout-id', workout.workoutId);
  }
  
  // Pre-fill form with workout data
  document.getElementById('edit-workout-date').value = workout.date || '';
  document.getElementById('edit-workout-notes').value = workout.notes || '';
  
  // Render exercises and sets
  renderEditWorkoutExercises(workout.exercises || []);
  
  elements.workoutModal.style.display = 'flex';
}

function renderEditWorkoutExercises(exercises) {
  elements.editWorkoutExercisesContainer.innerHTML = '';
  
  if (exercises.length === 0) {
    elements.editWorkoutExercisesContainer.innerHTML = '<p class="no-data-message">No exercises in this workout.</p>';
    return;
  }
  
  exercises.forEach((exercise, exerciseIndex) => {
    const exerciseDiv = document.createElement('div');
    exerciseDiv.className = 'workout-edit-exercise';
    exerciseDiv.setAttribute('data-exercise-index', exerciseIndex);
    
    const exerciseHeader = document.createElement('div');
    exerciseHeader.className = 'workout-edit-exercise-header';
    exerciseHeader.innerHTML = `
      <input type="text" class="workout-edit-exercise-name" value="${escapeHtml(exercise.exerciseName)}" 
             data-exercise-index="${exerciseIndex}" placeholder="Exercise name" required>
    `;
    
    const setsContainer = document.createElement('div');
    setsContainer.className = 'workout-edit-sets';
    setsContainer.innerHTML = '<label style="font-size: 0.9rem; color: var(--text-secondary);">Sets:</label>';
    
    exercise.sets.forEach((set, setIndex) => {
      const setDiv = document.createElement('div');
      setDiv.className = 'workout-edit-set';
      setDiv.setAttribute('data-exercise-index', exerciseIndex);
      setDiv.setAttribute('data-set-index', setIndex);
      setDiv.innerHTML = `
        <input type="number" class="edit-set-weight" value="${set.weight || 0}" 
               min="0" step="0.5" placeholder="Weight" data-exercise-index="${exerciseIndex}" data-set-index="${setIndex}">
        <input type="number" class="edit-set-reps" value="${set.reps || 0}" 
               min="1" placeholder="Reps" data-exercise-index="${exerciseIndex}" data-set-index="${setIndex}">
        <input type="text" class="edit-set-notes" value="${escapeHtml(set.notes || '')}" 
               placeholder="Set notes (optional)" data-exercise-index="${exerciseIndex}" data-set-index="${setIndex}">
      `;
      setsContainer.appendChild(setDiv);
    });
    
    exerciseDiv.appendChild(exerciseHeader);
    exerciseDiv.appendChild(setsContainer);
    elements.editWorkoutExercisesContainer.appendChild(exerciseDiv);
  });
}

function closeWorkoutModal() {
  if (elements.workoutModal) {
    elements.workoutModal.style.display = 'none';
  }
  if (elements.workoutEditForm) {
    elements.workoutEditForm.reset();
  }
  state.editingWorkoutId = null;
  elements.editWorkoutExercisesContainer.innerHTML = '';
  
  // Hide delete button
  const deleteBtn = document.getElementById('delete-workout-btn');
  if (deleteBtn) {
    deleteBtn.style.display = 'none';
    deleteBtn.removeAttribute('data-workout-id');
  }
}

async function handleWorkoutEditFormSubmit(e) {
  e.preventDefault();
  
  if (!state.editingWorkoutId) {
    showError('No workout selected for editing');
    return;
  }
  
  showLoading();
  
  try {
    // Collect form data
    const date = document.getElementById('edit-workout-date').value;
    const notes = document.getElementById('edit-workout-notes').value.trim();
    
    // Normalize exercise names
    const { canonicalizeExerciseName } = await import('/utils/exerciseNormalize.js');
    
    // Collect exercises and sets from the form
    const exercises = [];
    const exerciseDivs = elements.editWorkoutExercisesContainer.querySelectorAll('.workout-edit-exercise');
    
    exerciseDivs.forEach((exerciseDiv, exerciseIndex) => {
      const exerciseNameInput = exerciseDiv.querySelector('.workout-edit-exercise-name');
      const exerciseNameRaw = exerciseNameInput.value.trim();
      
      if (!exerciseNameRaw) return; // Skip empty exercises
      
      // Use canonical name for storage
      const exerciseName = canonicalizeExerciseName(exerciseNameRaw);
      
      const sets = [];
      const setDivs = exerciseDiv.querySelectorAll('.workout-edit-set');
      
      setDivs.forEach((setDiv) => {
        const weightInput = setDiv.querySelector('.edit-set-weight');
        const repsInput = setDiv.querySelector('.edit-set-reps');
        const notesInput = setDiv.querySelector('.edit-set-notes');
        
        const weight = parseFloat(weightInput.value) || 0;
        const reps = parseInt(repsInput.value) || 0;
        const setNotes = notesInput.value.trim() || undefined;
        
        if (reps > 0) { // Only include sets with reps
          sets.push({
            reps,
            weight,
            notes: setNotes,
          });
        }
      });
      
      if (sets.length > 0) { // Only include exercises with sets
        exercises.push({
          exerciseName,
          sets,
        });
      }
    });
    
    const workoutData = {
      date,
      exercises,
      notes,
    };
    
    // Call PUT API endpoint
    const updatedWorkout = await apiCall(`/workouts/${state.editingWorkoutId}`, {
      method: 'PUT',
      body: JSON.stringify(workoutData),
    });
    
    // Update workout in state
    const index = state.workouts.findIndex(w => w.workoutId === state.editingWorkoutId);
    if (index !== -1) {
      state.workouts[index] = updatedWorkout;
    }
    
    // Re-render workout history
    renderWorkoutHistory();
    closeWorkoutModal();
  } catch (error) {
    showError(`Failed to update workout: ${error.message}`);
  } finally {
    hideLoading();
  }
}

