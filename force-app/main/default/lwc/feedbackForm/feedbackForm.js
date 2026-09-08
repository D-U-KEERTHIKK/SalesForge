import { LightningElement, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class FeedbackForm extends LightningElement {
  formData = {
    name: '',
    email: '',
    rating: '',
    comments: ''
  };

  isFormVisible = true;

  isSuccessVisible = false;

  get ratingOptions() {
    return [
      { label: '1 - Poor', value: '1' },
      { label: '2 - Fair', value: '2' },
      { label: '3 - Good', value: '3' },
      { label: '4 - Very Good', value: '4' },
      { label: '5 - Excellent', value: '5' }
    ];
  }

  handleInputChange(event) {
    const fieldId = event.target.dataset.id;
    this.formData = {
      ...this.formData,
      [fieldId]: event.target.value
    };
  }

  handleSubmit(event) {
    event.preventDefault();

    const inputs = this.template.querySelectorAll('lightning-input, lightning-combobox, lightning-textarea');
    let isValid = true;

    inputs.forEach((input) => {
      if (!input.reportValidity()) {
        isValid = false;
      }
    });

    if (isValid) {
      this.isFormVisible = false;
      this.isSuccessVisible = true;

      const toast = new ShowToastEvent({
        title: 'Thank you!',
        message: 'Your feedback has been submitted.',
        variant: 'success'
      });
      this.dispatchEvent(toast);
    }
  }

  handleReset(event) {
    event.preventDefault();
    this.formData = {
      name: '',
      email: '',
      rating: '',
      comments: ''
    };
  }

  handleSubmitAnother(event) {
    event.preventDefault();
    this.isFormVisible = true;
    this.isSuccessVisible = false;
    this.formData = {
      name: '',
      email: '',
      rating: '',
      comments: ''
    };
  }
}