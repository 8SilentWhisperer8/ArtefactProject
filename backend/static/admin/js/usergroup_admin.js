document.addEventListener('DOMContentLoaded', function() {
    const formOutputField = document.querySelector('#id_form_output');
    const outcomeField = document.querySelector('#id_outcome');
    
    if (formOutputField && outcomeField) {
        function updateFieldsBasedOnSelection() {
            const selectedOption = formOutputField.options[formOutputField.selectedIndex];
            if (selectedOption && selectedOption.value) {
                // Make AJAX request to get FormOutput details
                fetch(`/admin/api/formoutput/${selectedOption.value}/`)
                    .then(response => response.json())
                    .then(data => {
                        // Auto-set outcome based on completion_status
                        if (data.completion_status) {
                            outcomeField.value = data.completion_status;
                            
                            // Trigger change event to show/hide relevant fieldsets
                            const changeEvent = new Event('change', { bubbles: true });
                            outcomeField.dispatchEvent(changeEvent);
                            
                            // Auto-populate relevant fields
                            if (data.completion_status === 'partial') {
                                const partialFieldsCompleted = document.querySelector('#id_partial_fields_completed');
                                if (partialFieldsCompleted && !partialFieldsCompleted.value) {
                                    partialFieldsCompleted.value = data.fields_completed || 0;
                                }
                            } else if (data.completion_status === 'failure') {
                                const failureStepsCompleted = document.querySelector('#id_failure_steps_completed');
                                if (failureStepsCompleted && !failureStepsCompleted.value) {
                                    failureStepsCompleted.value = data.steps_taken || 0;
                                }
                            }
                        }
                    })
                    .catch(error => {
                        console.log('Could not fetch FormOutput details:', error);
                    });
            }
        }
        
        formOutputField.addEventListener('change', updateFieldsBasedOnSelection);
        
        // Show/hide fieldsets based on outcome selection
        function toggleFieldsets() {
            const outcome = outcomeField.value;
            const successFields = document.querySelector('.field-success_best_area').closest('fieldset');
            const partialFields = document.querySelector('.field-partial_fields_completed').closest('fieldset');
            const failureFields = document.querySelector('.field-failure_steps_completed').closest('fieldset');
            
            // Hide all fieldsets first
            if (successFields) successFields.style.display = outcome === 'success' ? 'block' : 'none';
            if (partialFields) partialFields.style.display = outcome === 'partial' ? 'block' : 'none';
            if (failureFields) failureFields.style.display = outcome === 'failure' ? 'block' : 'none';
        }
        
        outcomeField.addEventListener('change', toggleFieldsets);
        
        // Initialize on page load
        toggleFieldsets();
    }
});
