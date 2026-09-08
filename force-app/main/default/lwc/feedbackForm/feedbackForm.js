import { LightningElement, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class FeedbackForm extends LightningElement {
    @track formData = {
        name: '',
        email: '',
        rating: '',
        comments: ''
    };

    isSubmitted = false;

    get ratingOptions() {
        return [
            { label: '1 - Poor', value: '1' },
            { label: '2 - Fair', value: '2' },
            { label: '3 - Good', value: '3' },
            { label: '4 - Very Good', value: '4' },
            { label: '5 - Excellent', value: '5' }
        ];
    }

    handleNameChange(event) {
        this.formData = { ...this.formData, name: event.detail.value };
    }

    handleEmailChange(event) {
        this.formData = { ...this.formData, email: event.detail.value };
    }

    handleRatingChange(event) {
        this.formData = { ...this.formData, rating: event.detail.value };
    }

    handleCommentsChange(event) {
        this.formData = { ...this.formData, comments: event.detail.value };
    }

    handleSubmit(event) {
        event.preventDefault();

        const allInputs = this.template.querySelectorAll(
            'lightning-input, lightning-combobox, lightning-textarea'
        );
        let isValid = true;

        allInputs.forEach(input => {
            if (!input.reportValidity()) {
                isValid = false;
            }
        });

        if (isValid) {
            this.isSubmitted = true;
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Thank you!',
                    message: 'Your feedback has been submitted successfully.',
                    variant: 'success'
                })
            );
        }
    }

    handleReset() {
        this.formData = { name: '', email: '', rating: '', comments: '' };
        this.isSubmitted = false;
    }
}
